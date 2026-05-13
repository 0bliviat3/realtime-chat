# Frontend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies with pnpm
RUN pnpm install

# Copy source code
COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]