# Backend Dockerfile
FROM node:22-slim

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set pnpm config for CI environments to avoid TTY issues
ENV CI=true
ENV confirmModulesPurge=false

# Copy package files
COPY package*.json pnpm-lock.yaml  ./

# Install dependencies with pnpm
RUN pnpm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "dev"]
