# ============================================================
# Stock Exchange DApp - 生产构建 Dockerfile
# 多阶段构建：减少最终镜像体积
# ============================================================

# --- 阶段 1: 依赖安装 ---
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund --prefer-offline; \
    else \
      npm install --no-audit --no-fund --prefer-offline; \
    fi

# --- 阶段 2: 构建 ---
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# --- 阶段 3: 运行 ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3200

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3200

ENV PORT=3200
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]