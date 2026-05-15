---
name: playwright-verify
description: 프론트엔드 변경(Vue 컴포넌트, 라우팅, 스타일, 클라이언트 JS) 후 브라우저에서 콘솔 에러, API 호출 실패, 버튼 클릭 오류, Socket.IO 연결 상태를 검증할 때 적용. 시각 회귀는 대상이 아니다.
---

# Playwright 브라우저 검증 절차

프론트엔드 코드(`*.vue`, `frontend/src/**`, `*.css`)를 변경한 경우에만 사용한다.
백엔드 전용 변경에는 사용하지 않는다 (시간 낭비).

---

## 사전 준비: Baseline 캡처

수정 전 페이지 상태의 콘솔/네트워크를 한 번 기록한다.
이미 존재하던 외부 SDK 에러, analytics 실패 등은 무시 대상이다.

```javascript
// 1. 페이지 이동 (수정 전 커밋 상태)
// 2. console messages, failed requests 수집
// 3. .agent/baseline.json 으로 저장
```

수정 후 새로 생긴 에러만 분석 대상이다.

---

## 3단계 검증

### Stage 1: Smoke Check (모델 호출 없이 결정론적 판정)

1. 대상 페이지(또는 변경 영향 페이지) 로드
2. Socket.IO 연결 확인 (`io.on('connect', ...)` 발생 여부)
3. 다음을 수집:
   - `console.error`, `console.warn`, `pageerror`
   - 4xx/5xx HTTP 응답 (분석 대상 도메인만, 외부 SDK 제외)
   - WebSocket 연결 실패 / 연결 후 disconnect
   - unhandled promise rejection
4. baseline에 없던 새 항목이 있나?
   - **없음 → Stage 2로**
   - **있음 → Stage 3로 (분석 모드)**

### Stage 2: 시나리오 검증

PM agent가 task spec에 acceptance scenario를 명시한다.
realtime-chat 프로젝트의 표준 시나리오 예시:

```javascript
// e2e 테스트 파일로 저장 - 회귀 자산으로 누적
test('로그인 → 채팅방 입장 → 메시지 송수신', async ({ page, context }) => {
  await page.goto('/login');
  await page.fill('[data-testid=nickname]', '테스터1');
  await page.click('[data-testid=enter]');
  await expect(page).toHaveURL(/\/rooms/);
  
  await page.click('[data-testid=room-general]');
  await expect(page).toHaveURL(/\/rooms\/general/);
  
  // 메시지 입력 및 전송
  await page.fill('[data-testid=message-input]', '안녕하세요');
  await page.click('[data-testid=send]');
  
  // 본인 화면에 표시 확인
  await expect(page.locator('[data-testid=message-list]')).toContainText('안녕하세요');
  
  // 두 번째 브라우저로 같은 room에 접속
  const page2 = await context.newPage();
  await page2.goto('/login');
  await page2.fill('[data-testid=nickname]', '테스터2');
  await page2.click('[data-testid=enter]');
  await page2.click('[data-testid=room-general]');
  
  // 첫 번째 사용자가 메시지 전송
  await page.fill('[data-testid=message-input]', '두번째 메시지');
  await page.click('[data-testid=send]');
  
  // 두 번째 사용자 화면에도 표시
  await expect(page2.locator('[data-testid=message-list]')).toContainText('두번째 메시지');
});
```

모든 assertion 통과 시 검증 완료.
실패 시 Stage 3.

### Stage 3: 분석 모드 (실패 시에만)

이때만 LLM에게 페이지 상태를 컨텍스트로 투입:
- 현재 URL
- 새로 생긴 콘솔 에러 메시지 (full stack)
- 실패한 네트워크 요청 (method, URL, status, response body 앞 500자)
- WebSocket 이벤트 로그 (실패 직전 10개)
- accessibility snapshot (실패 요소 주변만)

원인 추론 → 코드 수정 → Stage 1로 복귀.

---

## 컨텍스트 절약 규칙

- accessibility snapshot은 **실패 시에만**, **부분만** 수집
- `page.content()`(HTML 전체)는 호출하지 말 것 - 토큰 폭증
- console message는 deduplicate 후 전달
- 네트워크 응답 body는 500자로 truncate

---

## 검증 대상 도메인 화이트리스트

다음 도메인의 요청만 분석:
- `localhost:*`
- `*.local`
- 프로젝트 spec에 명시된 자사 API 도메인

외부 SDK(GA, Sentry, Hotjar 등)의 실패는 무시한다.

---

## Socket.IO 특화 검증

realtime-chat 프로젝트에서 특히 신경 쓸 점:

### Socket 이벤트 모니터링
```javascript
// Playwright 컨텍스트에서 Socket.IO 이벤트 가로채기
await page.addInitScript(() => {
  window.__socketEvents = [];
  const origIo = window.io;
  window.io = (...args) => {
    const socket = origIo(...args);
    const origEmit = socket.emit.bind(socket);
    socket.emit = (event, ...payload) => {
      window.__socketEvents.push({ direction: 'out', event, payload, t: Date.now() });
      return origEmit(event, ...payload);
    };
    socket.onAny((event, ...payload) => {
      window.__socketEvents.push({ direction: 'in', event, payload, t: Date.now() });
    });
    return socket;
  };
});

// 검증 시점에 이벤트 추출
const events = await page.evaluate(() => window.__socketEvents);
```

### 확인 항목
- `connect` 이벤트 발생 (서버 연결 성공)
- 의도한 room으로 `room:join` 송신 → `room:joined` 수신
- 새 메시지 송신 → 다른 클라이언트가 수신 (multi-context test)
- disconnect 시 reconnect 시도 → 성공

---

## 종료 후

검증 통과 시:
- 작성한 Playwright 시나리오를 `frontend/e2e/<feature>.spec.ts`로 commit (회귀 자산)
- 새로 생긴 콘솔 에러가 없음을 명시적으로 로그
- Socket 이벤트 흐름이 예상대로 동작했음을 로그

---

## 실행 명령

```bash
# 전체 E2E 실행
pnpm test:e2e

# 특정 파일만
pnpm test:e2e frontend/e2e/chat.spec.ts

# headed 모드로 디버그 (사람이 보면서)
pnpm test:e2e --headed --debug

# Playwright MCP 사용 시 - MCP가 알아서 실행, 위 명령은 수동 디버그용
```
