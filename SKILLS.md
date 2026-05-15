# SKILLS.md

## 목적

이 문서는 AI coder-agent가 프로젝트를 개발할 때 사용할 기술적 판단 기준과 구현 전략을 정의한다.

---

# 기본 기술 스택

## Backend

- Node.js 22
- Express.js
- Socket.IO
- TypeScript
- pnpm

## Frontend

- Vue 3
- Vite
- Pinia
- TypeScript

## Infra

- Docker
- Docker Compose

---

# 우선 기술 선택 기준

## 패키지 매니저

항상:

```bash
pnpm
```

사용.

npm 사용 금지.

---

# 실시간 통신 전략

## 기본

Socket.IO 기반 구현.

## Room 처리

Socket.IO room 기능 사용.

## 이벤트 구조

반드시 event-driven 구조 유지.

---

# 상태 관리 전략

## Frontend

Pinia 사용.

## Backend

메모리 상태 최소화.

가능한 DB 또는 room manager 사용.

---

# DB 전략

## 초기

SQLite 사용.

## 확장 가능 구조 유지

MySQL 전환 가능하게 repository 패턴 유지.

---

# 인증 전략

초기:

- localStorage 기반 임시 세션 가능

확장:

- JWT 인증 추가 가능 구조 유지

---

# 코드 품질 전략

## 우선순위

1. 유지보수성
2. 확장성
3. 안정성
4. 성능
5. 코드 길이

---

# TypeScript 규칙

## 금지

- any 남용
- 타입 누락
- 암시적 타입 남용

## 필수

- interface 적극 사용
- DTO 타입 정의
- API 응답 타입 정의

---

# Socket.IO 구현 전략

## 반드시 처리

- disconnect
- reconnect
- room cleanup
- duplicate connection

---

# reconnect 전략

반드시:

- 이전 room 복원
- 최근 메시지 복원
- 중복 emit 방지

---

# 성능 전략

## 메시지 처리

- pagination 고려
- 최근 메시지 제한
- 불필요한 broadcast 금지

## 프론트엔드

- excessive re-render 방지
- computed 적극 사용

---

# Docker 전략

## 개발 환경

- volume mount 사용
- hot reload 지원

## 운영 환경

- production build 분리
- lightweight image 사용

---

# Redis 확장 전략

멀티 서버 확장을 고려하여:

- socket adapter 분리 가능 구조 유지
- pub/sub 확장 가능 구조 유지

---

# 테스트 전략

반드시 테스트:

- 동시 접속
- reconnect
- room isolation
- 대량 메시지
- race condition

---

# Git 전략

## Commit 규칙

작은 단위 commit 유지.

모든 commit 메시지는 반드시 아래 컨벤션을 따른다:

```text
feat: 기능 추가
fix: 버그 수정
refactor: 리팩토링
chore: 설정 변경
docs: 문서 수정
test: 테스트 추가/수정
```
### 규칙
- commit 메시지는 반드시 한국어로 작성한다.
- 너무 짧거나 의미 없는 메시지는 금지
- 한 commit에는 하나의 논리적 변경만 포함
- 예시:
```text
feat: 채팅 메시지 전송 기능 추가
fix: socket reconnect 오류 수정
refactor: room service 구조 개선
```

## Pull Request 규칙
모든 PR은 반드시 한국어로 작성한다.

### PR 제목 규칙
- 변경 내용을 명확하게 요약
- 한국어 사용 필수
- 예시:
```text
채팅 room join 로직 개선
Socket reconnect 안정성 개선
메시지 저장 구조 리팩토링
```

### PR 본문 규칙
PR 본문은 반드시 다음 구조를 따른다:
```text
## 변경 내용
- 무엇을 변경했는지 설명

## 이유
- 왜 변경했는지 설명

## 테스트
- 어떤 테스트를 했는지 설명

## 기타
- 추가 참고 사항
```


## 브랜치 전략

가능하면:

```text
feature/*
fix/*
refactor/*
```

패턴 유지.

---

# Agent 작업 규칙

Agent는:

- 기존 구조를 먼저 분석한다.
- 수정 영향 범위를 먼저 판단한다.
- 필요한 파일만 수정한다.
- 과도한 리팩토링을 피한다.
- 동작 안정성을 우선한다.

---

# 최종 목표

단순 기능 구현이 아니라:

- 유지보수 가능한 구조
- 확장 가능한 구조
- 실제 서비스 가능한 구조

를 만드는 것을 목표로 한다.
