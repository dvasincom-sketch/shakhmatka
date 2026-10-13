# Шахматка: сайт (Next.js + Payload CMS) для Timeweb Cloud Apps.
# Контекст сборки — корень репозитория: нужны web/ (сайт) и content/ (статьи, досье, справочники для первичного импорта).
# База — PostgreSQL (DATABASE_URI), фото — S3 (S3_*). Подробно: docs/deploy.md

FROM node:22-bookworm-slim AS deps
WORKDIR /app/web
COPY web/package.json web/package-lock.json web/.npmrc ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app/web
COPY --from=deps /app/web/node_modules ./node_modules
COPY web/ ./
# На этапе сборки базы нет: все страницы рендерятся на запрос, а адрес-заглушка только выбирает адаптер Postgres.
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URI=postgres://build:build@127.0.0.1:1/build \
    PAYLOAD_SECRET=build-only-not-used-at-runtime \
    NODE_OPTIONS=--max-old-space-size=3072
ARG NEXT_PUBLIC_SITE_URL=https://шахматка.москва
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npx next build

FROM node:22-bookworm-slim AS run
WORKDIR /app/web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Полные node_modules и исходники нужны, чтобы в контейнере работали миграции и импорт контента (payload run).
COPY --from=build /app/web ./
COPY content/ /app/content/
RUN chmod +x docker-entrypoint.sh && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
