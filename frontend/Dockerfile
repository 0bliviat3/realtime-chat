# Frontend Dockerfile
FROM node:22-slim

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set pnpm config for CI environments to avoid TTY issues
ENV CI=true
ENV confirmModulesPurge=false

RUN pnpm config set strict-dep-builds false

# Copy package files
COPY package*.json pnpm-lock.yaml  ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
