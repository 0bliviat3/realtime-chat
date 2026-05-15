# SKILLS.md → AGENTS.md + Skills 분리 가이드

기존 단일 `SKILLS.md`를 opencode 표준 구조로 분리한 결과물 안내.

---

## 최종 디렉토리 구조

```
realtime-chat/
├── AGENTS.md                                    # ⭐ 항상 컨텍스트에 로드 (코더 agent 운영 규약 + 프로젝트 기본 정보)
├── .opencode/
│   ├── opencode.json                            # MCP 등록, 권한 가드레일
│   └── skills/                                  # 도메인별 skill (필요 시에만 활성화)
│       ├── socketio-realtime/
│       │   └── SKILL.md                         # Socket.IO 구현 규칙
│       ├── db-repository/
│       │   └── SKILL.md                         # DB 접근, repository 패턴, 인증
│       ├── vue-frontend/
│       │   └── SKILL.md                         # Vue 3 + Pinia, 프론트 성능
│       ├── docker-infra/
│       │   └── SKILL.md                         # Docker, compose, nginx
│       ├── playwright-verify/
│       │   └── SKILL.md                         # 브라우저 검증 절차
│       └── github-pr/
│           └── SKILL.md                         # PR 제출 (한국어 컨벤션)
├── .agent/                                      # 🚫 gitignore - 작업 중 임시 파일
│   ├── state.md                                 # 작업 scratchpad (코더가 갱신)
│   ├── baseline.json                            # Playwright baseline
│   └── allowed_paths                            # task별 변경 허용 경로
└── .gitignore                                   # .agent/ 추가
```

---

## 기존 SKILLS.md 내용이 어디로 갔는지 매핑

| 기존 SKILLS.md 섹션 | 이동한 곳 | 이유 |
|---------------------|----------|------|
| 기본 기술 스택 | `AGENTS.md` | 모든 task에서 필요 |
| 우선 기술 선택 기준 (pnpm) | `AGENTS.md` | 모든 task에서 필요 |
| 실시간 통신 전략 | `socketio-realtime/SKILL.md` | Socket 관련 task에만 필요 |
| 상태 관리 - Frontend (Pinia) | `vue-frontend/SKILL.md` | 프론트 task에만 필요 |
| 상태 관리 - Backend (메모리 최소화) | `socketio-realtime/SKILL.md` | Socket과 결합도 높음 |
| DB 전략 | `db-repository/SKILL.md` | DB task에만 필요 |
| 인증 전략 | `db-repository/SKILL.md` | DB/세션과 결합 |
| 코드 품질 전략 (5가지 우선순위) | `AGENTS.md` | 모든 코드에 적용 |
| TypeScript 규칙 | `AGENTS.md` | 모든 TS 코드에 적용 |
| Socket.IO 구현 전략 (disconnect 등) | `socketio-realtime/SKILL.md` | Socket task에만 |
| reconnect 전략 | `socketio-realtime/SKILL.md` | Socket task에만 |
| 성능 전략 - 메시지 처리 | `socketio-realtime/SKILL.md` | Socket과 결합 |
| 성능 전략 - 프론트엔드 | `vue-frontend/SKILL.md` | 프론트 task에만 |
| Docker 전략 | `docker-infra/SKILL.md` | Docker task에만 |
| Redis 확장 전략 | `socketio-realtime/SKILL.md` (확장 가능 구조 섹션) | Socket adapter와 결합 |
| 테스트 전략 | 각 도메인 skill의 "검증 시나리오" 섹션 | 도메인별 테스트가 다름 |
| Git 전략 (커밋/PR 한국어) | `github-pr/SKILL.md` | PR 단계에만 |
| 브랜치 전략 | `github-pr/SKILL.md` | PR 단계에만 |
| Agent 작업 규칙 | `AGENTS.md` (Agent 작업 원칙) | 모든 task에 적용 |
| 최종 목표 | `AGENTS.md` (코드 품질 우선순위) | 철학, 항상 적용 |

---

## 왜 이렇게 분리하는가

### 컨텍스트 효율
- 45K 컨텍스트 한도에서 AGENTS.md는 매 turn 로드됨
- 통합 SKILLS.md를 매번 다 읽으면 baseline 컨텍스트가 큼
- 도메인별 skill은 description으로 trigger되어 필요 시에만 로드

### 도메인 분리
- Socket.IO 작업할 때 Docker 규칙은 noise
- DB 마이그레이션 작업할 때 Vue 컴포넌트 규칙은 noise
- 관련 정보만 컨텍스트에 → 모델 집중도 향상

### 유지보수
- 한 도메인 규칙 바뀌어도 해당 SKILL.md만 수정
- 통합 파일이면 conflict 잦음

---

## 적용 절차

### 1. 기존 SKILLS.md 백업 후 제거
```bash
cd ~/workspace/realtime-chat
mv SKILLS.md SKILLS.md.backup
# 또는 git에 남아있다면 그대로 삭제 후 commit
```

### 2. 새 파일들 배치
이 가이드와 함께 생성된 파일들을 다음 위치에 둠:
- `AGENTS.md` → 프로젝트 루트
- `.opencode/opencode.json` → 프로젝트 루트의 `.opencode/`
- 각 `*/SKILL.md` → `.opencode/skills/<name>/SKILL.md`

### 3. .gitignore 갱신
```bash
# 기존 .gitignore에 추가
cat >> .gitignore << 'EOF'

# Agent scratchpad
.agent/

# opencode 캐시
.opencode/cache/
EOF
```

### 4. 환경변수 설정
```bash
# 셸 rc에 추가, 또는 systemd EnvironmentFile에
export GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_xxxxxxxxxxxx
```

### 5. MCP 연결 확인
```bash
opencode mcp list
# playwright, github 모두 connected 표시 확인
```

### 6. 첫 task로 검증
간단한 task spec(예: "README에 빌드 명령 한 줄 추가")을 투입해서:
- AGENTS.md가 로드되는지
- 적절한 skill이 trigger되는지
- PR이 한국어 컨벤션으로 생성되는지

---

## 추가 권장 사항

### 마이그레이션 후 검증 task

다음 task spec을 차례로 투입해서 각 skill이 잘 trigger되는지 확인:

1. **Socket.IO skill 확인**
   ```
   Task: typing indicator 이벤트 추가
   - 사용자가 입력 중일 때 같은 room의 다른 사용자에게 "X님이 입력 중" 표시
   - Acceptance: 입력 시작 시 typing:start, 입력 멈춘 후 3초 뒤 typing:stop
   ```
   → `socketio-realtime` skill이 활성화되어야 함

2. **DB skill 확인**
   ```
   Task: 메시지에 reaction(이모지) 기능 추가
   - reactions 테이블 신규
   - MessageRepository에 addReaction/removeReaction 메서드
   ```
   → `db-repository` skill이 활성화되어야 함

3. **Vue skill 확인**
   ```
   Task: 메시지 검색 컴포넌트 추가
   - 검색어 입력 → 현재 room의 메시지 필터링
   - Pinia store의 computed로 구현
   ```
   → `vue-frontend` skill 활성화

각 skill이 description의 키워드로 자동 trigger되는지 확인. 안 되면 description을 더 구체적으로 조정.

### 향후 skill 추가 시점

다음 상황이 생기면 새 skill 분리:
- 특정 라이브러리/패턴을 다룰 일이 늘어남 (예: Redis 본격 도입 시 `redis-pubsub/`)
- 특정 작업 유형의 절차가 정형화됨 (예: 성능 프로파일링 절차)
- AGENTS.md가 너무 커져서 (>500줄) 도메인 분리가 자연스러움

---

## 문제 발생 시

### Skill이 trigger 안 됨
- `SKILL.md`의 `description` 필드가 너무 추상적인지 확인
- description에 구체적인 키워드 (Socket.IO, Pinia, Dockerfile 등) 명시
- 너무 광범위해도 안 됨 (모든 task에서 trigger되면 컨텍스트 낭비)

### 여러 skill이 동시에 trigger됨
- 의도적이면 OK (Socket.IO + DB 변경 동시에 일어남)
- 의도하지 않은데 trigger되면 description 좁히기

### 한 task가 여러 도메인 걸침
- 자연스러운 일. skill은 독립적이라 동시 활성화 문제 없음
- 단, 한 task가 4-5개 도메인 걸치면 task가 너무 큰 신호 - PM이 쪼개야 함
