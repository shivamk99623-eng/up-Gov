# syntax=docker/dockerfile:1
# better-sqlite3 compiles a native addon at npm install — needs build tools only in install stages.
FROM node:20-alpine AS base
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
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# App scripts and SQLite database (node_modules are NOT copied from host)
# COPY --from=builder --chown=nextjs:nodejs /app/create_db.js ./create_db.js
COPY --from=builder --chown=nextjs:nodejs /app/create_indexes.js ./create_indexes.js
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
# COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/filters').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
