# ============================================================
# frontend/Dockerfile
# Multi-stage build para Next.js 14 con output standalone
# ============================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── Dependencias ──────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno requeridas en build time
ARG NEXT_PUBLIC_API_URL=https://sigc.unitru.edu.pe/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Imagen final (usa standalone output de Next.js) ───────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public               ./public
COPY --from=builder /app/.next/standalone      ./
COPY --from=builder /app/.next/static          ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/login || exit 1

CMD ["node", "server.js"]
