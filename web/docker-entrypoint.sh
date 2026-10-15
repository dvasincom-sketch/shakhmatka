#!/bin/sh
# Старт контейнера: миграции базы → сайт. Импорт контента — по флагу SEED_ON_START=1 (первый деплой или обновление контента).
set -e
cd "$(dirname "$0")"

# поиск: встроенный Meilisearch, если внешний не задан. Индекс в контейнере временный — собирается заново при каждом старте (несколько секунд).
if [ -z "$MEILI_HOST" ] && [ "${MEILI_EMBEDDED:-1}" = "1" ] && command -v meilisearch >/dev/null 2>&1; then
  export MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
  mkdir -p /tmp/meili
  meilisearch --db-path /tmp/meili/data --dump-dir /tmp/meili/dumps --http-addr 127.0.0.1:7700 --master-key "$MEILI_MASTER_KEY" --env production --no-analytics > /tmp/meili/log.txt 2>&1 &
  export MEILI_HOST=http://127.0.0.1:7700
  echo "→ поиск: встроенный Meilisearch (127.0.0.1:7700)"
fi

echo "→ миграции базы"
npx payload migrate

if [ "$SEED_ON_START" = "1" ]; then
  # порядок: районы → досье → статьи → факты → досье ещё раз (хронология объектам, созданным статьями) → словарь
  # импорт идёт в фоне, сайт отвечает сразу; повторный запуск безопасен (обновляет по slug)
  (
    sleep 5
    echo "→ импорт контента"
    SEARCH_HOOKS=0 npm run seed:places && SEARCH_HOOKS=0 npm run seed:dossiers && SEARCH_HOOKS=0 npm run seed && SEARCH_HOOKS=0 npm run seed:facts && SEARCH_HOOKS=0 npm run seed:dossiers && SEARCH_HOOKS=0 npm run seed:photos && SEARCH_HOOKS=0 npm run seed:developers && SEARCH_HOOKS=0 npm run seed:terms \
      && echo "✓ импорт контента завершён" || echo "✗ импорт контента завершился с ошибкой"
    npm run media:restore || echo "✗ проверка фото завершилась с ошибкой"
    npm run search:index || echo "✗ поисковый индекс не собран — сайт ищет по базе"
  ) &
else
  # фото: если записи в базе есть, а файлов в хранилище нет (контейнер пересоздан) — дозагрузить из content/
  ( sleep 5; npm run media:restore || echo "✗ проверка фото завершилась с ошибкой"; npm run search:index || echo "✗ поисковый индекс не собран — сайт ищет по базе" ) &
fi

echo "→ сайт на порту ${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
