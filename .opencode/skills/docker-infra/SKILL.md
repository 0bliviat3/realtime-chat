---
name: docker-infra
description: Dockerfile, docker-compose.yml, 컨테이너 환경 설정 변경 시 적용. 개발/운영 환경 분리, volume mount, hot reload, lightweight image, 빌드 최적화를 다룬다.
---

# Docker / Docker Compose 규칙

이 skill은 `Dockerfile`, `docker-compose*.yml`, `.dockerignore`를 작성/수정할 때 적용한다.

---

## 환경 분리 원칙

### 파일 구조
```
realtime-chat/
├── backend/
│   ├── Dockerfile               # 운영용 (multi-stage)
│   └── Dockerfile.dev           # 개발용 (hot reload, dev dependencies)
├── frontend/
│   ├── Dockerfile               # 운영용 (build → nginx serve)
│   └── Dockerfile.dev           # 개발용 (vite dev server)
├── docker-compose.yml           # 운영 기본
├── docker-compose.dev.yml       # 개발 override
└── .dockerignore
```

### Compose 실행
```bash
# 개발
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 운영
docker compose up -d
```

---

## 개발 환경 (Dockerfile.dev)

### 핵심 요구사항
- **Hot reload** 동작
- 소스 코드 volume mount (이미지 재빌드 없이 변경 반영)
- `node_modules`는 별도 volume (호스트 OS와 격리)

### Backend Dockerfile.dev 예시
```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

# tsx watch 또는 ts-node-dev로 hot reload
CMD ["pnpm", "dev"]
```

### docker-compose.dev.yml 예시
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - /app/node_modules    # node_modules는 컨테이너 것 유지
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_SOCKET_URL=http://localhost:3000
```

### node_modules anonymous volume 패턴
`/app/node_modules` 라인이 핵심. 호스트의 node_modules가 컨테이너로 마운트되어 OS 호환성 깨지는 문제 방지.

---

## 운영 환경 (Dockerfile)

### 핵심 요구사항
- **Multi-stage build** - 빌드 산출물만 최종 이미지에
- **경량 이미지** - alpine 또는 distroless
- **non-root user**로 실행
- **이미지에 시크릿 박지 말 것** - 환경변수 또는 secret manager

### Backend 운영 Dockerfile 예시
```dockerfile
# === Build stage ===
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

# 의존성 캐시 활용
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 운영 의존성만 남김
RUN pnpm prune --prod

# === Runtime stage ===
FROM node:22-alpine AS runtime

WORKDIR /app

# non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 빌드 산출물과 prod 의존성만 복사
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# init system으로 zombie process 방지 (선택)
# RUN apk add --no-cache tini
# ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/index.js"]
```

### Frontend 운영 Dockerfile 예시 (Vite build → nginx)
```dockerfile
# === Build stage ===
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build-time 환경변수 (VITE_*는 빌드 시 박힘)
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN pnpm build

# === Runtime stage ===
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 운영 docker-compose.yml
```yaml
services:
  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_PATH=/data/chat.db
      - REDIS_URL=${REDIS_URL:-}
    volumes:
      - chat-data:/data
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_SOCKET_URL: ${VITE_SOCKET_URL}
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  chat-data:
```

---

## .dockerignore (필수)

루트와 각 서비스 폴더에 두기. 빌드 컨텍스트 크기와 이미지 크기 줄임.

```
# .dockerignore (각 서비스 루트)
node_modules
dist
.git
.gitignore
.env
.env.local
*.log
.vscode
.idea
coverage
.nyc_output
README.md
*.md
.opencode/
.agent/
test/
**/*.test.ts
**/*.spec.ts
```

---

## 이미지 크기 최적화

### 우선순위
1. **multi-stage build** - 가장 효과 큼
2. **alpine 기반** - debian/ubuntu 대비 1/10 크기
3. **레이어 캐시 활용** - 변경 잦은 파일을 Dockerfile 뒤쪽에
4. **prod 의존성만** - `pnpm prune --prod` 또는 `pnpm install --prod`
5. **불필요 파일 제외** - .dockerignore

### 캐시 활용 패턴
```dockerfile
# ❌ 코드 변경마다 의존성 재설치
COPY . .
RUN pnpm install

# ✅ package.json만 먼저 → 의존성 캐시
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
```

---

## 환경변수 / 시크릿 처리

### 이미지에 박지 말 것
- DB 비밀번호, JWT secret, API key 등
- Dockerfile에 `ENV SECRET=xxx` 절대 금지
- 빌드 시 ARG로 받아도 결국 이미지에 흔적 남음

### 주입 방법
- Compose: `environment:` 또는 `env_file:`
- Kubernetes: Secrets
- 서버: systemd EnvironmentFile

### docker-compose에서 .env 활용
```yaml
services:
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}      # .env에서 읽음
      - DB_PASSWORD=${DB_PASSWORD}
```

`.env` 파일은 `.gitignore` 대상, 별도 관리.

---

## Volume 전략

### 명명된 volume 사용
```yaml
volumes:
  - chat-data:/data        # ✅ 명명된 volume
  # - ./data:/data         # ❌ bind mount는 운영에서 권한 문제 자주
```

### 백업 가능한 위치에 mount
```yaml
volumes:
  chat-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/realtime-chat/data
```

호스트의 `/var/lib/realtime-chat/data`로 매핑되어 일반 백업 도구로 백업 가능.

---

## Healthcheck

운영 환경에서 필수. compose의 `depends_on: condition: service_healthy`로 기동 순서 보장.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
```

백엔드에 `/health` 엔드포인트 구현:
```typescript
app.get('/health', async (_req, res) => {
  // DB 연결 확인
  try {
    await db.get('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});
```

---

## 흔한 함정

- **`latest` 태그 사용** - 재현 불가. 항상 specific tag (`node:22.10-alpine`).
- **root user로 실행** - 보안 위험. non-root user 추가.
- **빌드 컨텍스트 거대화** - `.dockerignore` 없으면 `node_modules`, `.git` 다 보냄. 빌드 느리고 캐시 무효화 잦음.
- **레이어 캐시 무효화** - `COPY . .`가 Dockerfile 앞쪽에 있으면 코드 변경마다 모든 RUN 재실행.
- **Compose에서 build vs image 혼용** - dev는 build, 운영은 미리 빌드한 image pull 권장.
- **WebSocket proxy 설정 누락** - nginx 앞단에 둘 때 `proxy_http_version 1.1` + `Upgrade`/`Connection` 헤더 필수.

---

## nginx 설정 (Frontend serve 시)

`frontend/nginx.conf`:
```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api/ {
    proxy_pass http://backend:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # WebSocket proxy
  location /socket.io/ {
    proxy_pass http://backend:3000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }

  # 정적 파일 캐싱
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

---

## 검증 체크리스트

Docker 관련 변경 후:
- [ ] `docker compose build` 성공
- [ ] `docker compose up` 후 모든 서비스 healthy
- [ ] 개발 환경에서 hot reload 동작
- [ ] 운영 이미지 크기 합리적 (backend < 200MB, frontend < 50MB 기준)
- [ ] non-root user로 실행되는지 (`docker exec <container> whoami`)
- [ ] 이미지에 시크릿/소스코드 누출 없는지 (`docker history`, `dive` 도구로 확인)
