---
name: vue-frontend
description: Vue 3 컴포넌트, Pinia store, Vite 설정, 프론트엔드 성능 최적화 작업 시 적용. Composition API, 반응성, computed, re-render 방지, 메시지 페이지네이션을 다룬다.
---

# Vue 3 + Pinia 프론트엔드 규칙

이 skill은 프론트엔드 코드(`*.vue`, `stores/*.ts`, `composables/*.ts`, Vite 설정)를 작성/수정할 때 적용한다.

---

## 기본 원칙

### Composition API 전용
- `<script setup lang="ts">` 사용
- Options API 사용 금지 (일관성 위해)
- 기존 코드가 Options API라면 그대로 두고, 신규 코드만 Composition API

### TypeScript 강제
- 모든 컴포넌트 `lang="ts"`
- `defineProps`, `defineEmits`는 제네릭으로 타입 지정:

```vue
<script setup lang="ts">
interface Props {
  roomId: string;
  initialMessages?: Message[];
}
const props = withDefaults(defineProps<Props>(), {
  initialMessages: () => [],
});

const emit = defineEmits<{
  sendMessage: [text: string];
  leaveRoom: [];
}>();
</script>
```

---

## State 관리 - Pinia

### Store 분리 기준
- **도메인별 분리**: `useChatStore`, `useUserStore`, `useRoomStore`
- 한 store가 너무 커지면 (200줄 이상) 분리 검토
- store 간 의존성은 최소화 (필요하면 컴포넌트 레이어에서 조합)

### Store 구조 (Setup 스타일 권장)
```typescript
// stores/chat.ts
export const useChatStore = defineStore('chat', () => {
  // state
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const currentRoomId = ref<string | null>(null);

  // getters (computed)
  const messageCount = computed(() => messages.value.length);
  const recentMessages = computed(() => messages.value.slice(-50));

  // actions
  async function loadMessages(roomId: string) {
    isLoading.value = true;
    try {
      messages.value = await api.fetchMessages(roomId);
      currentRoomId.value = roomId;
    } finally {
      isLoading.value = false;
    }
  }

  function appendMessage(msg: Message) {
    messages.value.push(msg);
  }

  function reset() {
    messages.value = [];
    currentRoomId.value = null;
  }

  return { messages, isLoading, currentRoomId, messageCount, recentMessages, loadMessages, appendMessage, reset };
});
```

### 직접 변경 vs action 호출
- 컴포넌트에서 store의 ref를 직접 변경하지 말 것
- 항상 action을 통해 변경 (단일 진입점 유지)
- 예외: form 입력 같은 UI-local 상태는 store에 두지 말고 컴포넌트 local로

### Socket.IO와 store 연결
- Socket 인스턴스는 별도 composable로 (`composables/useSocket.ts`)
- 이벤트 수신 → store action 호출
- 이 패턴이 socket 로직과 UI 로직 분리

```typescript
// composables/useSocket.ts
export function useSocketChat() {
  const chatStore = useChatStore();
  const socket = inject<Socket>('socket')!;

  onMounted(() => {
    socket.on('message:new', (msg) => {
      chatStore.appendMessage(msg);
    });
  });

  onUnmounted(() => {
    socket.off('message:new');
  });

  function sendMessage(text: string) {
    socket.emit('message:send', { roomId: chatStore.currentRoomId, text });
  }

  return { sendMessage };
}
```

---

## 반응성 함정 피하기

### Ref vs Reactive
- 원시값(string, number, boolean): `ref`
- 객체/배열: `ref` (일관성) 또는 `reactive`
- **일관성을 위해 `ref`로 통일 권장** - `.value` 패턴이 명확함

### 반응성 잃어버리는 패턴
```typescript
// ❌ destructuring으로 반응성 끊김
const { messages } = useChatStore();

// ✅ storeToRefs 사용
const { messages } = storeToRefs(useChatStore());

// ✅ 또는 store 인스턴스 유지
const chatStore = useChatStore();
// 템플릿에서 chatStore.messages 사용
```

---

## Computed 적극 사용

### 사용 시점
- 다른 반응성 값으로부터 파생되는 값
- 같은 계산이 여러 번 사용될 때 (캐싱 효과)
- 템플릿의 복잡한 표현식

```vue
<script setup lang="ts">
const messages = ref<Message[]>([]);
const filter = ref('');

// ✅
const filteredMessages = computed(() => 
  filter.value 
    ? messages.value.filter(m => m.text.includes(filter.value))
    : messages.value
);

// ❌ 템플릿에서 메서드 호출 - 매 re-render마다 실행
function getFilteredMessages() {
  return filter.value ? messages.value.filter(...) : messages.value;
}
</script>

<template>
  <!-- ❌ -->
  <MessageList :messages="getFilteredMessages()" />
  <!-- ✅ -->
  <MessageList :messages="filteredMessages" />
</template>
```

---

## Re-render 최적화

### 큰 리스트
- `v-for`에는 반드시 `:key` (인덱스 말고 의미 있는 ID)
- 1000개 이상 → virtual scrolling 검토 (`vue-virtual-scroller`)

### 컴포넌트 분리
- 자주 변경되는 부분과 안 변경되는 부분 분리
- 부모의 사소한 변경이 무거운 자식 컴포넌트 재계산을 트리거하지 않도록

### v-memo (Vue 3.2+)
정말 무거운 자식 컴포넌트의 경우:
```vue
<MessageItem
  v-for="msg in messages"
  :key="msg.id"
  v-memo="[msg.id, msg.text, msg.editedAt]"
  :message="msg"
/>
```
디펜던시 변경 시에만 re-render.

### shallowRef
큰 객체이고 깊은 반응성이 필요 없으면 `shallowRef`:
```typescript
const largeDataset = shallowRef<HeavyData>({ ... });
// .value 자체를 교체할 때만 반응
```

---

## 메시지 페이지네이션 (실시간 채팅 특화)

### 초기 로드
- 최근 50개만 로드
- 로딩 인디케이터 표시

### 무한 스크롤 (위로)
- 스크롤이 상단에 가까워지면 이전 페이지 로드
- **cursor 기반** (마지막으로 로드한 메시지의 ID 또는 createdAt 사용)
- offset 기반 절대 금지 - 새 메시지가 끼면 페이지 어긋남

```typescript
const oldestLoadedId = ref<string | null>(null);
const hasMore = ref(true);
const isLoadingMore = ref(false);

async function loadMore() {
  if (!hasMore.value || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const older = await api.fetchMessages(roomId, { before: oldestLoadedId.value, limit: 50 });
    if (older.length < 50) hasMore.value = false;
    if (older.length > 0) {
      messages.value = [...older, ...messages.value];
      oldestLoadedId.value = older[0].id;
    }
  } finally {
    isLoadingMore.value = false;
  }
}
```

### 새 메시지 도착 시 스크롤
- 사용자가 하단을 보고 있으면 자동 스크롤
- 위쪽 메시지를 읽고 있으면 자동 스크롤 금지 (대신 "새 메시지 N개" 배지 표시)

```typescript
function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
}
```

---

## Vite 설정 주의

### 환경변수
- 클라이언트에 노출되는 env는 반드시 `VITE_` prefix
- 시크릿(API key 등)을 `VITE_*`로 두지 말 것 - 번들에 포함되어 노출됨
- 백엔드 통신용 API URL: `VITE_API_URL`, `VITE_SOCKET_URL`

### Proxy (개발 환경)
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true },
    },
  },
});
```
WebSocket proxy에 `ws: true` 필수.

### Build 최적화
- `manualChunks`로 vendor 분리 (vue, pinia, socket.io-client)
- 큰 의존성은 dynamic import (필요 시점에 로드)

---

## 흔한 함정

- **`v-html` 사용** - XSS 위험. 사용자 입력은 절대 v-html로 렌더링하지 말 것. 마크다운 등은 DOMPurify로 sanitize.
- **watch에서 동일 ref 변경** - 무한 루프. immediate, deep 옵션 사용 시 특히 주의.
- **메모리 누수 (이벤트 리스너)** - `onMounted`에서 `addEventListener` 했으면 `onUnmounted`에서 `removeEventListener`.
- **Socket 인스턴스 중복 생성** - app 레벨에서 한 번만 생성, provide/inject 또는 전역 plugin으로 공유.
- **Async setup의 Suspense 의존** - `<script setup>`에서 top-level await 쓰면 부모에 Suspense 필요. 컴포넌트 마운트 후 fetch가 더 안전.

---

## 검증 시나리오 (Playwright)

프론트 변경 시 `playwright-verify` skill의 절차를 따라 검증.
이 프로젝트에서 특히 확인해야 할 시나리오:

1. 메시지 입력 → submit → 본인 화면에 즉시 표시
2. 다른 브라우저에서 같은 room → 새 메시지가 broadcast 수신되어 표시
3. 새로고침 → reconnect 후 이전 room 복원, 최근 메시지 표시
4. 스크롤 위로 → 이전 메시지 추가 로드 (cursor 기반)
5. 백엔드 일시 중단 → 클라이언트 reconnect 시도 (UI에 "재연결 중" 표시)
