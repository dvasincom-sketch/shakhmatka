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
    npm run seed:places && npm run seed:dossiers && npm run seed && npm run seed:facts && npm run seed:dossiers && npm run seed:photos && npm run seed:developers && npm run seed:terms \
      && echo "✓ импорт контента завершён" || echo "✗ импорт контента завершился с ошибкой"
  ) &
fi

echo "→ сайт на порту ${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
