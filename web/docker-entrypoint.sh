#!/bin/sh
# Старт контейнера: миграции базы → сайт. Импорт контента — по флагу SEED_ON_START=1 (первый деплой или обновление контента).
set -e
cd "$(dirname "$0")"

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
