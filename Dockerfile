FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY tsconfig.json app.config.ts ./
COPY app ./app
RUN bun run build

# --------------------

FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder --chown=bun:bun /app/.output ./.output

USER bun

EXPOSE 3000
ENV PORT 3000
ENV DB_FILE_NAME .data/pixiv.db

CMD ["bun", "./.output/server/index.mjs"]
