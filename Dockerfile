# syntax=docker/dockerfile:1
# better-sqlite3 compiles a native addon at npm install — needs build tools only in install stages.
FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Install all dependencies (native build for better-sqlite3)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Production dependencies only — reuse compiled native modules from deps
FROM deps AS prod-deps
RUN npm prune --omit=dev


# Build Next.js app
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# Production runner (slim — no build tools; native modules copied from prod-deps)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UP_PROJECT_ROOT=/app

# node:alpine already has uid/gid 1000 as user `node` — reuse it so bind-mounted
# ./database (owned by ubuntu:1000 on EC2) is writable for SQLite -shm/-wal.
RUN mkdir -p /app/database && chown -R node:node /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts

# SQLite worker loads TypeScript handlers via jiti — needs workers/ + src/ at runtime
COPY --from=builder --chown=node:node /app/workers ./workers
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=node:node /app/create_indexes.js ./create_indexes.js
COPY --from=builder --chown=node:node /app/create_entity_index.js ./create_entity_index.js

# Do NOT bake database/data.db into the image — OverlayFS makes ~2.5GB SQLite
# very slow. Mount host DB via docker-compose (./database:/app/database).

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/filters').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
