# AGENTS.md

## 목적

이 문서는 AI coder-agent가 프로젝트를 개발할 때 반드시 따라야 하는 개발 규칙과 행동 원칙을 정의한다.

---

# 개발 환경

## 운영체제

- Ubuntu 24.04

## Runtime

- Node.js 22 LTS

## Package Manager

- pnpm

## Backend

- Node.js
- Express.js
- Socket.IO
- TypeScript

## Frontend

- Vue 3
- Vite
- TypeScript

## Database

- SQLite (초기)
- MySQL (확장 가능)

## Infra

- Docker
- Docker Compose

---

# Agent 행동 원칙

## 중요

Agent는 반드시:

- 유지보수 가능한 구조를 우선한다.
- 단일 파일 거대화를 피한다.
- 기능 추가가 쉬운 구조를 유지한다.
- 기존 코드 스타일을 유지한다.
- 중복 코드를 최소화한다.
- 타입 안정성을 유지한다.
- async/await 기반으로 작성한다.

---

# 금지 사항

## 절대 금지

- server.ts 하나에 모든 로직 작성
- callback hell
- any 남용
- 하드코딩
- 전역 상태 남용
- 비동기 누락
- 의미 없는 helper 함수 생성
- 미사용 코드 방치

---

# Backend 규칙

## 아키텍처

반드시 아래 구조 유지:

- controller
- service
- repository
- socket
- middleware

## 역할 분리

### controller

HTTP 요청 처리만 담당.

### service

비즈니스 로직 처리.

### repository

DB 접근 전용.

### socket

Socket.IO 이벤트 처리.

---

# Frontend 규칙

## 상태 관리

- Pinia 사용

## API 분리

- services 디렉토리 사용

## Socket 분리

- socket 디렉토리 사용

## UI 원칙

- 컴포넌트 단위 분리
- 재사용 가능한 구조 유지
- 로직과 UI 분리

---

# Socket.IO 규칙

## 이벤트 네이밍

반드시 아래 패턴 사용:

```text
chat:send
chat:receive
room:join
room:leave
user:typing
```

## Socket 이벤트 처리

- 이벤트 등록 위치 명확화
- disconnect 처리 필수
- reconnect 고려
- room broadcast 적극 활용

---

# Docker 규칙

## 필수

- backend Dockerfile 작성
- frontend Dockerfile 작성
- docker-compose 구성

## 실행 방식

반드시 아래 명령으로 실행 가능해야 함:

```bash
docker compose up -d
```

---

# 코드 작성 규칙

## 함수 규칙

- 함수 하나는 하나의 책임만 가진다.
- 함수 길이는 가능한 짧게 유지.
- 의미 있는 이름 사용.

## 에러 처리

모든 비동기 로직은:

- try/catch 처리
- 사용자 메시지 처리
- 로그 출력

---

# 성능 고려

반드시 고려:

- reconnect storm
- memory leak
- 불필요한 socket emit
- 과도한 re-render
- DB query 최소화

---

# 개발 순서

Agent는 반드시 아래 순서를 우선한다.

1. 기본 서버 구성
2. Socket 연결
3. 기본 채팅
4. room 기능
5. DB 저장
6. reconnect 처리
7. 고급 기능
8. Docker 구성
9. Redis 확장

---

# 최종 목표

목표는:

"확장 가능한 실시간 채팅 서비스"

구조를 만드는 것이다.
