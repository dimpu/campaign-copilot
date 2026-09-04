# ── Stage 1: Install dependencies ─────────────────────────────────
FROM oven/bun:1.2 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --ignore-scripts

# ── Stage 2: Build ────────────────────────────────────────────────
FROM oven/bun:1.2 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# ── Stage 3: Production (slim) ───────────────────────────────────
FROM oven/bun:1.2-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone Next.js server (includes only needed deps)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Drizzle kit + schema for migrations at startup
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/lib/db/schema.ts ./lib/db/schema.ts
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json

# Seed script + its dependency (faker)
COPY --from=builder /app/scripts/seed.ts ./scripts/seed.ts
COPY --from=builder /app/node_modules/@faker-js ./node_modules/@faker-js

# Entrypoint that auto-migrates + seeds on first run
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Persistent DB volume
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./data/local.db"

ENTRYPOINT ["./docker-entrypoint.sh"]
