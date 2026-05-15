---
name: socketio-realtime
description: Socket.IO를 사용한 실시간 통신 구현 시 적용. room 처리, disconnect/reconnect, broadcast, 이벤트 구조, 동시성 테스트, Redis adapter 확장 가능 구조를 다룬다.
---

# Socket.IO 실시간 통신 구현 규칙

이 skill은 Socket.IO 관련 코드(`*.socket.ts`, `*Handler.ts`, room manager, namespace, adapter 등)를 작성/수정할 때 적용한다.

---

## 기본 원칙

### Event-driven 구조 유지
- 비즈니스 로직과 socket 핸들러를 분리
- 핸들러는 얇게, 실제 로직은 서비스 레이어로 위임
- 한 이벤트 핸들러는 하나의 책임만

### Room 처리
- Socket.IO 표준 `room` 기능 사용 (별도 자료구조로 중복 관리 금지)
- room ID는 의미 있는 prefix 사용: `chat:<roomId>`, `user:<userId>`
- room join/leave는 반드시 명시적으로 호출, 자동 정리에 의존하지 말 것

### 이벤트 타입 정의 필수

```typescript
// shared/socket-events.ts
export interface ServerToClientEvents {
  'message:new': (payload: MessageDTO) => void;
  'room:joined': (payload: { roomId: string; members: number }) => void;
  'room:user-left': (payload: { userId: string }) => void;
}

export interface ClientToServerEvents {
  'message:send': (payload: { roomId: string; text: string }, ack: (res: AckResult) => void) => void;
  'room:join': (payload: { roomId: string }, ack: (res: AckResult) => void) => void;
}
```

서버/클라이언트 모두 이 타입을 import해서 사용. 양쪽이 다르면 컴파일 에러로 잡힘.

---

## 반드시 처리해야 할 케이스

### 1. disconnect 처리
```typescript
socket.on('disconnect', async (reason) => {
  // 이 사용자가 속한 모든 room에서 leave
  // 다른 사용자에게 user-left 이벤트 broadcast
  // room이 비었으면 room manager에서 정리
  // DB의 임시 상태(typing indicator 등) 정리
});
```

disconnect reason 분류:
- `client namespace disconnect` - 정상 종료
- `transport close` - 네트워크 끊김 (reconnect 가능성 높음)
- `ping timeout` - 비정상 종료
- 이유에 따라 cleanup 정책 다르게 (즉시 vs grace period)

### 2. reconnect 처리
- 클라이언트는 Socket.IO 기본 reconnect 옵션 사용 (`reconnection: true`)
- 재접속 시 반드시 처리:
  - **이전 room 복원**: 클라이언트가 마지막 room ID를 localStorage에 저장 → reconnect 후 자동 join
  - **최근 메시지 복원**: 마지막 message ID 이후 메시지 fetch
  - **중복 emit 방지**: 같은 socket.id로 join 중복 호출되어도 한 번만 처리

### 3. duplicate connection 처리
- 같은 사용자가 여러 탭/기기에서 접속하는 경우:
  - 정책 1: 모두 허용, 각각 별도 socket으로 broadcast
  - 정책 2: 마지막 접속만 활성, 이전 socket disconnect (단일 세션 모드)
- 정책은 프로젝트에서 사전 합의된 것을 따름 (불확실하면 사용자에게 질문)

### 4. room cleanup
- room의 마지막 사용자가 나가면 room 자체를 cleanup
- DB의 room 메타데이터는 보존 (재진입 시 복원)
- 메모리에 남아있는 typing indicator, presence 정보 정리

---

## 메모리 상태 최소화

서버 메모리에 상태를 두지 말 것. 다음 중 하나로 보관:
- **DB**: 영속 필요한 데이터 (메시지, room 정보, 멤버십)
- **Room manager**: Socket.IO room 자체 (in-memory지만 Socket.IO가 관리)
- **Redis** (확장 시): cross-instance 공유 상태

이유: 서버 재시작/scale-out 시 상태가 보존되거나 자연스럽게 재구성되어야 함.

---

## Broadcast 최적화

### 불필요한 broadcast 금지
- 자기 자신에게는 보내지 말 것: `socket.to(room).emit(...)` (자기 제외) vs `io.to(room).emit(...)` (자기 포함)
- 변경 없는 데이터 emit 금지 (typing indicator on/off 상태 토글 시 같은 상태 반복 emit 방지)

### Pagination
- 메시지 히스토리 로드는 페이지 단위 (기본 50개, 최대 200개)
- 최신 메시지 우선 (`ORDER BY created_at DESC LIMIT ...`)
- 무한 스크롤은 cursor 기반 (offset 기반 금지 - 페이지 사이 새 메시지 끼면 어긋남)

### 최근 메시지 제한
- 클라이언트 초기 로드 시 최근 N개만 (e.g. 50개)
- 그 이전은 사용자가 스크롤로 요청 시 추가 로드

---

## Redis Adapter 확장 가능 구조

현재는 단일 서버 인메모리지만, 다음 구조를 유지해야 추후 multi-instance 전환이 매끄럽다:

```typescript
// adapter는 환경변수로 스왑 가능하게
import { createAdapter as createRedisAdapter } from '@socket.io/redis-adapter';

if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createRedisAdapter(pubClient, subClient));
}
// REDIS_URL 없으면 기본 in-memory adapter
```

### 지켜야 할 제약 (Redis adapter 호환성을 위해)
- `io.sockets.sockets`를 직접 순회하지 말 것 (단일 인스턴스의 socket만 보임)
- room 멤버 확인은 `io.in(room).fetchSockets()` 사용 (adapter aware)
- 서버 메모리에 socket 객체 보관 금지 (cross-instance 참조 불가)

---

## 테스트 시나리오 (반드시 통과)

새 Socket.IO 기능 추가/변경 시 다음 시나리오를 테스트로 작성:

1. **동시 접속**: N개 클라이언트가 동시에 같은 room 접속 → 모두 정상 join, 멤버 카운트 정확
2. **reconnect 시나리오**: 클라이언트 강제 disconnect → 재접속 → 이전 room 복원, 끊겼던 동안의 메시지 복원
3. **room isolation**: room A의 broadcast가 room B에 새지 않음
4. **대량 메시지**: 1초에 100개 메시지 발송 → 순서 보존, 메시지 누락 없음
5. **race condition**: 동시에 같은 room join 요청 → 멤버 카운트 정확, 중복 join 없음
6. **duplicate connection**: 같은 사용자 두 번 접속 → 정책대로 동작 (둘 다 살림 / 이전 끊김)

테스트 도구:
- 유닛: vitest + socket.io-client (mock)
- 통합: 실제 서버 + N개 client 시뮬레이션

```typescript
// 통합 테스트 예시
import { io as Client } from 'socket.io-client';

it('동시 접속 N명 시 모두 broadcast 수신', async () => {
  const clients = Array.from({ length: 10 }, () => Client('http://localhost:3000'));
  await Promise.all(clients.map(c => new Promise(r => c.on('connect', r))));
  
  await Promise.all(clients.map(c => c.emitWithAck('room:join', { roomId: 'test' })));
  
  const received = new Map<string, number>();
  clients.forEach(c => c.on('message:new', () => 
    received.set(c.id, (received.get(c.id) ?? 0) + 1)));
  
  clients[0].emit('message:send', { roomId: 'test', text: 'hello' });
  await wait(100);
  
  // 자기 자신 제외 9명이 받아야 함
  expect([...received.values()].filter(v => v === 1).length).toBe(9);
  
  clients.forEach(c => c.disconnect());
});
```

---

## 흔한 함정

- **socket.id를 user ID로 쓰지 말 것** - reconnect 시마다 바뀜. 별도 auth payload로 user ID 식별.
- **disconnect 핸들러에서 async 작업 무방비** - disconnect는 자주 발생, DB 쓰기 폭주 가능. 큐잉 또는 throttle 고려.
- **에러 처리 누락** - `socket.on` 핸들러 내부 throw는 silent 실패. 반드시 try/catch + ack로 클라이언트에 에러 통지.
- **JSON 직렬화 불가 객체 emit** - Date, Map, Set, circular ref. DTO로 변환 후 emit.
- **클라이언트에 너무 큰 페이로드** - 첨부파일은 URL만, 큰 객체는 분할.
