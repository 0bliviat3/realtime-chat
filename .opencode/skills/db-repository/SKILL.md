---
name: db-repository
description: DB 접근 코드(repository, 엔티티, 마이그레이션, 쿼리)를 작성/수정할 때 적용. SQLite 초기 운영과 MySQL 전환 가능 구조, 인증/세션 처리, 트랜잭션 패턴을 다룬다.
---

# DB 접근 및 Repository 패턴

이 skill은 DB 관련 코드(`repository/*`, `entity/*`, `migration/*`, SQL을 다루는 service)를 작성/수정할 때 적용한다.

---

## DB 전략

### 초기 (현재)
- **SQLite** 사용 (파일 기반, 단일 노드)
- 개발/소규모 운영에 적합
- DB 파일은 Docker volume에 마운트

### 확장 시점
- 동시 쓰기 충돌 발생, 또는 멀티 인스턴스 필요해질 때
- **MySQL**로 전환

### Repository 패턴 강제
어떤 DB를 쓰든 service 레이어는 repository 인터페이스만 의존:

```typescript
// repository/MessageRepository.ts
export interface MessageRepository {
  create(input: CreateMessageInput): Promise<Message>;
  findRecentByRoom(roomId: string, limit: number, before?: string): Promise<Message[]>;
  findById(id: string): Promise<Message | null>;
  countByRoom(roomId: string): Promise<number>;
}

// repository/sqlite/SqliteMessageRepository.ts
export class SqliteMessageRepository implements MessageRepository { ... }

// 추후 추가
// repository/mysql/MysqlMessageRepository.ts
// export class MysqlMessageRepository implements MessageRepository { ... }
```

DI 컨테이너 또는 factory에서 환경변수(`DB_TYPE`)에 따라 구현체 선택.

---

## SQL 작성 규칙

### Raw SQL을 service에 직접 쓰지 말 것
- 모든 SQL은 repository 안에만
- service는 repository 메서드만 호출

### Prepared statement 강제
SQL injection 방지. 문자열 concat으로 쿼리 만들지 말 것.

```typescript
// ❌ 절대 금지
const sql = `SELECT * FROM messages WHERE room_id = '${roomId}'`;

// ✅
const sql = `SELECT * FROM messages WHERE room_id = ?`;
const rows = await db.all(sql, [roomId]);
```

### SQLite/MySQL 호환성
다음 차이는 추상화 레이어 또는 SQL 작성 시 주의:

| 항목 | SQLite | MySQL |
|------|--------|-------|
| AUTO_INCREMENT | `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT AUTO_INCREMENT` |
| 날짜 타입 | `TEXT` (ISO 8601) 또는 `INTEGER` (unix ts) | `DATETIME`, `TIMESTAMP` |
| BOOLEAN | `INTEGER` (0/1) | `TINYINT(1)` 또는 `BOOLEAN` |
| JSON | `TEXT` + JSON1 extension | `JSON` 타입 |
| 대소문자 | 기본 case-insensitive (LIKE) | collation 의존 |
| UPSERT | `INSERT ... ON CONFLICT(...) DO UPDATE` | `INSERT ... ON DUPLICATE KEY UPDATE` |

가능하면 ANSI 표준 SQL 사용. 분기 필요한 경우 repository 구현체에서 처리.

### 권장: ID는 UUID
- AUTO_INCREMENT는 DB 종속성, 분산 환경에서 충돌 가능
- UUID v7 (시간순 정렬 가능) 권장
- 메시지 ID, room ID 등 모두 UUID

---

## 트랜잭션

### 사용 시점
- 둘 이상의 테이블에 영향을 주는 변경
- read-modify-write 패턴
- 동시성 충돌 가능성 있는 작업

### 패턴
```typescript
async createMessageAndUpdateRoom(input: CreateMessageInput) {
  return this.db.transaction(async (tx) => {
    const message = await this.messageRepo.create(input, tx);
    await this.roomRepo.updateLastMessageAt(input.roomId, message.createdAt, tx);
    return message;
  });
}
```

트랜잭션 내부에서 외부 IO (HTTP 호출, Socket emit 등) 금지. 트랜잭션 commit 후 실행.

---

## 마이그레이션

### 도구
- 권장: `node-pg-migrate` 스타일의 SQL 파일 기반 (`001_create_messages.sql`)
- 또는 ORM 자체 마이그레이션 (Drizzle, Prisma 등 - 프로젝트 선택 따름)

### 규칙
- **마이그레이션 파일은 절대 수정 금지** (이미 적용된 것). 새 파일 추가.
- 파일명: `<sequence>_<description>.sql` (e.g. `003_add_user_email_index.sql`)
- 가능하면 reversible (down migration 함께 작성)
- destructive 변경 (DROP COLUMN, DROP TABLE)은 spec에 명시된 경우만

### 새 마이그레이션 작성 체크리스트
- [ ] 기존 데이터에 영향 주는지 검토 (NOT NULL 추가 시 default 필요)
- [ ] 인덱스 필요한지 (FK, 자주 WHERE에 쓰이는 컬럼)
- [ ] SQLite와 MySQL 둘 다에서 동작하는 문법인지

---

## 인덱스 전략

다음 컬럼은 반드시 인덱스:
- 모든 FK
- `WHERE` 절에 자주 쓰이는 컬럼
- `ORDER BY` 자주 쓰이는 컬럼 (특히 메시지의 `created_at`)

복합 인덱스는 가장 자주 쓰이는 조합으로:
```sql
-- "room의 최근 메시지" 조회가 빈번하면
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
```

---

## 인증 / 세션 전략

### 현재 (초기 단계)
- **localStorage 기반 임시 세션 가능**
- 클라이언트가 localStorage에 user ID 또는 임시 토큰 저장
- 서버는 토큰 검증 후 socket connection 허용

### 확장 (JWT 도입 시)
- access token (단기, 15분~1시간) + refresh token (장기, 7~30일)
- access token은 localStorage 또는 메모리, refresh token은 httpOnly cookie
- Socket.IO connection auth:

```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const payload = await verifyToken(token);
    socket.data.userId = payload.userId;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});
```

### Repository 패턴 적용
인증 정보도 repository를 통해 접근:
```typescript
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updatePasswordHash(id: string, hash: string): Promise<void>;
}
```

비밀번호 해싱은 반드시 bcrypt 또는 argon2. 평문 저장 절대 금지.

---

## 자주 발생하는 함정

- **N+1 쿼리** - 메시지 목록 가져온 뒤 각 메시지의 작성자 정보를 1건씩 조회. JOIN 또는 batch 조회로 해결.
- **트랜잭션 없는 read-modify-write** - 카운터 증가, 잔여 수량 차감 등은 반드시 트랜잭션 + lock
- **시간대 혼동** - DB는 항상 UTC로 저장, 클라이언트에서 변환
- **NULL 의미 혼동** - "값 없음" vs "삭제됨" vs "초기값". 의미 분리.
- **Soft delete 일관성 부족** - `deleted_at` 컬럼 쓴다면 모든 조회에 `WHERE deleted_at IS NULL` 추가 (view 또는 base repository로 강제)

---

## 검증 시나리오

DB 관련 변경 시 다음 테스트 필수:
1. 마이그레이션 정방향 (`migrate up`) 정상 동작
2. 기존 데이터 영향 없음 (있다면 마이그레이션 안에 데이터 변환 포함)
3. SQLite로 통과한 쿼리가 MySQL에서도 동작하는지 (CI에 둘 다 돌리는 게 이상적)
4. 인덱스 사용되는지 `EXPLAIN` 확인 (성능 민감한 쿼리)
