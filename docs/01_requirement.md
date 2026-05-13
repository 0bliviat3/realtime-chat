# Node.js 실시간 채팅 프로그램 개발 과제

## 프로젝트 개요

본 과제의 목표는 실시간 채팅 프로그램을 개발하는 것이다.

이 프로젝트는 단순 채팅 기능 구현이 아니라 아래 항목들을 포함한 실제 서비스 수준의 구조를 목표로 한다.

* 실시간 통신
* 상태 관리
* 다중 채팅방
* 데이터 저장
* 재접속 처리
* 이벤트 처리
* 확장 가능한 구조
* 유지보수 가능한 코드 구성

---

# 기술 스택

## Backend

필수:

* Node.js
* Express.js
* Socket.IO

권장:

* TypeScript
* dotenv
* nodemon

## Frontend

선택 가능:

* Vue.js
* React
* Vanilla JS

## Database

1차:

* SQLite

확장:

* MySQL

## Infra

* Docker
* Docker Compose

---

# 프로젝트 구조 요구사항

## Backend 구조 예시

```text
/backend
  /src
    /config
    /controllers
    /services
    /repositories
    /socket
    /models
    /routes
    /middlewares
    /utils
    app.ts
    server.ts
```

## Frontend 구조 예시

```text
/frontend
  /src
    /components
    /views
    /stores
    /services
    /socket
    /utils
```

---

# 개발 단계

# STEP 1 - 기본 채팅 구현

## 목표

실시간 채팅 기능 구현.

## 요구사항

### 서버

* Express 서버 구성
* Socket.IO 서버 구성
* CORS 처리
* 환경변수 분리

### 클라이언트

* 채팅 UI 구성
* 메시지 입력창
* 메시지 목록 표시

### 기능

* 사용자 접속 가능
* 메시지 전송 가능
* 모든 사용자에게 메시지 브로드캐스트
* 닉네임 설정 가능

### 시스템 메시지

아래 이벤트를 시스템 메시지로 출력.

```text
[System] userA joined
[System] userB left
```

### 접속자 목록

실시간 접속자 목록 표시.

---

# STEP 2 - 채팅방 기능

## 목표

다중 채팅방 지원.

## 요구사항

### 채팅방 기능

* 채팅방 생성
* 채팅방 목록 조회
* 채팅방 입장
* 채팅방 퇴장
* 방별 메시지 분리

### 상태 관리

* 현재 사용자의 room 상태 관리
* room별 사용자 수 관리

### Socket.IO

* socket room 기능 활용
* room broadcast 구현

---

# STEP 3 - DB 저장 기능

## 목표

메시지 영속화.

## 요구사항

### DB 설계

테이블 예시:

#### users

```text
id
nickname
created_at
```

#### rooms

```text
id
name
created_at
```

#### messages

```text
id
room_id
user_id
message
created_at
```

### 기능

* 메시지 저장
* 최근 메시지 조회
* room 입장 시 최근 100개 메시지 로드

### Repository 패턴 적용

DB 접근 로직 분리.

---

# STEP 4 - 재접속 처리

## 목표

끊김 이후 자동 복구.

## 요구사항

### reconnect 처리

브라우저 새로고침 또는 네트워크 재연결 시:

* 자동 재접속
* 이전 room 자동 복원
* 최근 메시지 자동 로드

### session 처리

아래 중 하나 선택:

* JWT
* Session 기반
* localStorage 기반 임시 세션

---

# STEP 5 - 고급 기능

## 목표

실서비스 수준 기능 추가.

## 기능 요구사항

### 읽음 처리

예시:

```text
userA read up to message #152
```

### typing indicator

예시:

```text
userB is typing...
```

### 메시지 수정

* 수정 이벤트 실시간 반영

### 메시지 삭제

* 삭제 이벤트 실시간 반영

### optimistic UI

* 서버 응답 전에 임시 렌더링
* 실패 시 rollback

### 메시지 순서 보장

* timestamp 기반 정렬
* race condition 방지

---

# STEP 6 - Docker 환경 구성

## 목표

컨테이너 기반 실행.

## 요구사항

### Dockerfile 작성

* backend Dockerfile
* frontend Dockerfile

### docker-compose 구성

포함 대상:

* frontend
* backend
* database

### 실행 명령

```bash
docker compose up -d
```

---

# STEP 7 - Redis 확장

## 목표

멀티 서버 확장 대응.

## 요구사항

### Redis Pub/Sub 적용

* Socket 이벤트 동기화
* room 이벤트 동기화

### scale-out 대응

아래 상황에서도 정상 동작:

* backend 서버 여러 대
* 서로 다른 인스턴스 간 메시지 전달

### Docker Compose 확장

redis 서비스 추가.

---

# 코드 품질 요구사항

## 필수

* 모듈화
* 서비스 레이어 분리
* 중복 제거
* 명확한 네이밍
* 에러 처리
* async/await 사용
* 타입 안정성

## 금지

* 모든 로직을 server 파일 하나에 작성
* 전역 변수 남용
* callback hell
* 하드코딩

---

# UI 요구사항

## 최소 요구사항

* 반응형 레이아웃
* 채팅창 스크롤 유지
* 사용자 구분 UI
* 시스템 메시지 구분
* 접속자 목록 UI

## 선택 기능

* 다크모드
* 알림음
* unread badge
* 프로필 이미지

---

# 테스트 요구사항

## 필수 테스트

### 동시 접속 테스트

* 여러 사용자 동시 접속
* 동시 메시지 전송

### reconnect 테스트

* 새로고침 후 자동 복구

### room 테스트

* room 분리 검증

### 대량 메시지 테스트

* 짧은 시간 내 다량 메시지 처리

---

# 성능 고려사항

## 고려 대상

* Socket 이벤트 최소화
* 메모리 누수 방지
* 불필요한 렌더링 방지
* DB query 최적화
* reconnect storm 방지

---

# 최종 산출물

## 필수 포함

* 전체 소스코드
* README.md
* 실행 방법
* 환경변수 예시
* Docker 실행 방법
* API 명세
* Socket 이벤트 명세

---

# 추가 도전 과제

## OPTIONAL

### 파일 업로드

* 이미지 전송
* 파일 전송

### 음성 채팅

* WebRTC 기반

### 관리자 기능

* 강제 퇴장
* mute
* ban

### AI 기능

* 메시지 요약
* 욕설 필터링
* AI Assistant Bot

---

# 개발 원칙

## 중요

* 유지보수 가능한 구조 우선
* 기능 추가가 쉬운 구조 우선
* 단순 구현보다 확장성을 고려
* 리팩토링 가능한 코드 유지
* 이벤트 흐름을 명확하게 유지

---

# 권장 개발 순서

1. 기본 서버 구성
2. Socket 연결
3. 기본 채팅
4. 사용자 상태 관리
5. room 기능
6. DB 저장
7. reconnect 처리
8. 고급 기능
9. Docker 구성
10. Redis 확장

---

# 평가 포인트

## 핵심 평가 요소

* 코드 구조
* 실시간 이벤트 처리
* 상태 관리 능력
* 유지보수성
* 확장성
* 에러 처리
* 리팩토링 안정성
* 동시성 처리
* reconnect 안정성
* Socket.IO 이해도

---

# 최종 목표

단순 데모 수준이 아니라:

"실제로 확장 가능한 실시간 채팅 서비스"

수준의 구조와 품질을 목표로 개발한다.

