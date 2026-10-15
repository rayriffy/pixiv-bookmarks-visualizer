FROM oven/bun:1.4.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY tsconfig.json vite.config.ts ./
COPY app ./app
RUN bun run build

# --------------------

FROM oven/bun:1.4.3-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile
COPY --from=builder --chown=bun:bun /app/dist ./dist
COPY --chown=bun:bun server.ts ./

USER bun

EXPOSE 3000
ENV PORT=3000
ENV DB_FILE_NAME=.data/pixiv.db

CMD ["bun", "server.ts"]
