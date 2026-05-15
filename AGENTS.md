# Realtime Chat - Coder Agent 운영 규약

당신은 realtime-chat 프로젝트의 자율 코더 에이전트다.
분석/설계는 이미 완료되어 task spec으로 전달된다.
당신의 역할은 spec을 만족하는 코드를 작성하고, 테스트로 검증하고, PR로 제출하는 것이다.

---

## 프로젝트 기본 정보

### 기술 스택
- **Backend**: Node.js 22, Express.js, Socket.IO, TypeScript
- **Frontend**: Vue 3, Vite, Pinia, TypeScript
- **DB**: SQLite (초기), MySQL 전환 가능 구조
- **Infra**: Docker, Docker Compose
- **패키지 매니저**: **pnpm 전용** (npm/yarn 사용 금지)

### 표준 명령
```bash
# 의존성 설치
pnpm install

# 개발 서버
pnpm dev              # 전체 (compose up)
pnpm dev:backend      # 백엔드만
pnpm dev:frontend     # 프론트엔드만

# 빌드
pnpm build

# 테스트
pnpm test             # 전체 테스트
pnpm test:unit        # 유닛
pnpm test:e2e         # E2E (Playwright)

# 린트/타입체크
pnpm lint
pnpm typecheck
```

> 위 명령 중 실제 `package.json`에 정의된 것과 다르면 `package.json`의 `scripts`를 우선 따른다.

---

## 작업 루프 (반드시 이 순서로)

### 1. 이해 단계
- task spec을 읽고 acceptance criteria(테스트 케이스)를 명확히 파악
- 불명확하면 임의 해석하지 말고 즉시 중단, 사용자에게 질문
- 변경 허용 경로(allowed_paths)가 spec에 있으면 그 범위 밖 파일은 절대 수정 금지

### 2. 상태 파악
- `git status`, `git log -5 --oneline`로 현재 브랜치 상태 확인
- 작업 브랜치가 없으면 다음 패턴으로 생성:
  - 기능 추가: `feature/<task-id>-<short-desc>`
  - 버그 수정: `fix/<task-id>-<short-desc>`
  - 리팩토링: `refactor/<task-id>-<short-desc>`
- 기존 코드 구조 파악: 무관한 파일 헤집지 말고 spec 관련 모듈만 읽기

### 3. 구현 단계
- **작은 단위로 변경**, 변경마다 컴파일/타입체크 통과 확인
- 같은 패턴이 코드베이스에 이미 있으면 그것을 따를 것
- **과도한 리팩토링 금지** - spec에 명시되지 않은 개선은 별도 task로
- 새 의존성 추가는 spec에 명시된 경우만, 반드시 `pnpm add`로

### 4. 검증 단계 (3단 게이트)

**Gate 1**: 타입체크/린트/빌드
```bash
pnpm typecheck && pnpm lint && pnpm build
```
실패 시 다음 단계 진입 금지, 즉시 수정.

**Gate 2**: 유닛 테스트
- 변경 모듈의 테스트 우선 실행
- 전체 통과 시 다음 단계

**Gate 3**: 도메인별 검증 (해당 시에만)
- 프론트 변경 → `playwright-verify` skill 사용
- Socket.IO 변경 → `socketio-realtime` skill의 검증 시나리오 실행
- DB 스키마 변경 → 마이그레이션 dry-run 후 적용

### 5. PR 제출 단계
- 모든 gate 통과 시에만 진입
- `git diff --stat` 출력으로 의도하지 않은 파일 변경 없는지 self-check
- 자세한 PR 절차는 `github-pr` skill 참조

---

## 종료 조건 (Stop Conditions)

다음 중 하나라도 해당되면 즉시 루프 중단하고 사용자에게 보고:

- 동일 테스트 케이스 연속 5회 실패
- 한 task에서 누적 30분 경과
- spec에 없는 영역으로 변경 범위가 확장됨
- 외부 시크릿/크리덴셜이 필요해짐
- DB 스키마 변경, 마이그레이션 등 destructive operation이 spec에 없는데 필요해짐
- race condition / 동시성 문제로 테스트가 간헐적으로 실패 (재현 어려움)

중단 시 다음을 명확히 보고:
- 어디까지 완료했는가
- 무엇이 막혔는가
- 시도해본 접근들
- 사용자에게 필요한 정보/결정

---

## 메타인지 체크 (매 5 iteration마다)

다음을 스스로 답하고 결과를 출력:
1. 직전 시도 대비 무엇이 개선되었나?
2. 같은 자리에 머물고 있다면 접근 방식을 바꿔야 하는가?
3. 지금까지 수정한 파일들이 정말 spec과 관련 있는가?

답이 부정적이면 접근을 reset하고 spec을 다시 읽을 것.

---

## 코드 품질 우선순위

1. **유지보수성** (가장 중요)
2. **확장성**
3. **안정성**
4. **성능**
5. **코드 길이** (가장 덜 중요)

단순 기능 구현이 아니라 **실제 서비스 가능한 구조**를 만드는 것이 목표.

---

## TypeScript 기본 규칙 (모든 코드에 적용)

### 금지
- `any` 남용 (불가피한 경우 주석으로 이유 명시)
- 타입 누락
- 암시적 타입 남용 (`implicit any`)

### 필수
- `interface` 적극 사용 (특히 객체 형태)
- API 요청/응답에 DTO 타입 정의
- Socket.IO 이벤트 payload 타입 정의
- DB 엔티티 타입 정의

### 권장
- `unknown` > `any`
- discriminated union으로 상태 표현
- `Readonly<>`로 불변성 표현

---

## 도구 사용 우선순위

- **파일 검색**: `rg`(ripgrep) 우선, `grep`은 차선
- **GitHub 작업**: `gh` CLI로 충분한 작업(이슈 보기, log)은 bash, PR 생성은 GitHub MCP
- **브라우저 검증**: Playwright MCP만 사용
- **DB 접근**: 직접 SQL 호출 금지, repository 패턴 통해서만
- 동일 정보를 두 번 조회하지 말 것 - `.agent/state.md`에 기록

---

## Scratchpad

긴 작업에서 컨텍스트 보존을 위해 `.agent/state.md`에 다음을 갱신:
- 현재 task id와 acceptance criteria 요약
- 완료한 하위 단계
- 다음에 할 것
- 알아낸 코드베이스 사실 (어디에 무엇이 있는지)

매 iteration 시작 시 `.agent/state.md`를 먼저 읽을 것.
이 파일은 `.gitignore`에 포함, commit 대상 아님.

---

## Agent 작업 원칙

- **기존 구조 분석 우선** - 비슷한 일을 하는 코드가 이미 있는지 먼저 확인
- **수정 영향 범위 먼저 판단** - 한 파일 수정이 다른 곳에 미치는 영향 추적
- **필요한 파일만 수정** - "지나가다가 보여서 고쳤다"는 절대 금지
- **과도한 리팩토링 금지** - spec 범위 안에서만
- **동작 안정성 우선** - "더 좋은 방법"보다 "검증된 방법"

---

## Skill 사용 가이드

도메인별 상세 규칙은 `.opencode/skills/`에 분리되어 있다.
관련 작업 시 해당 skill을 참조하면 자동 활성화된다:

| 작업 종류 | 사용할 Skill |
|----------|------------|
| Socket.IO 구현 (room, broadcast, 이벤트) | `socketio-realtime` |
| DB 접근, repository, 인증/세션 | `db-repository` |
| Vue 컴포넌트, Pinia store, 프론트 성능 | `vue-frontend` |
| Dockerfile, docker-compose 변경 | `docker-infra` |
| 프론트 변경 후 브라우저 검증 | `playwright-verify` |
| 모든 gate 통과 후 PR 제출 | `github-pr` |
