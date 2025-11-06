### Production multi-stage Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm (corepack)
RUN apk add --no-cache python3 make g++ git jq || true
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install deps for build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

### Runner stage
FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package metadata and install production deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built app
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main"]
