#!/bin/sh
# Старт контейнера: миграции базы → сайт. Импорт контента — по флагу SEED_ON_START=1 (первый деплой или обновление контента).
# Фоновые скрипты (импорт, фото, поиск) работают по одному, с маленьким пулом подключений к базе и ограничением памяти:
# иначе на небольшом тарифе контейнер убивается по памяти (Killed), а база упирается в лимит подключений.
set -e
cd "$(dirname "$0")"

# поиск: встроенный Meilisearch, если внешний не задан. Индекс в контейнере временный — собирается заново при каждом старте (несколько секунд).
if [ -z "$MEILI_HOST" ] && [ "${MEILI_EMBEDDED:-1}" = "1" ] && command -v meilisearch >/dev/null 2>&1; then
  export MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
  mkdir -p /tmp/meili
  meilisearch --db-path /tmp/meili/data --dump-dir /tmp/meili/dumps --http-addr 127.0.0.1:7700 --master-key "$MEILI_MASTER_KEY" --env production --no-analytics --max-indexing-memory 128MiB --max-indexing-threads 1 > /tmp/meili/log.txt 2>&1 &
  export MEILI_HOST=http://127.0.0.1:7700
  echo "→ поиск: встроенный Meilisearch (127.0.0.1:7700)"
fi

# миграции: до 6 попыток — при перезапуске старый контейнер ещё может держать подключения к базе
echo "→ миграции базы"
n=0
until DB_POOL_MAX=2 npx payload migrate; do
  n=$((n + 1))
  if [ "$n" -ge 6 ]; then echo "✗ миграции не прошли за 6 попыток — проверьте базу и лимит подключений"; exit 1; fi
  echo "… база недоступна, повтор через 15 с ($n/6)"
  sleep 15
done

# фоновые скрипты: пул 2 подключения, память Node до 640 МБ
# (npm-скрипты задают NODE_OPTIONS через cross-env и затёрли бы лимит памяти, поэтому скрипт запускается напрямую через payload run)
job() {
  f=$(node -p "(require('./package.json').scripts['$1'].match(/payload run (\\S+)/) || [])[1] || ''")
  [ -n "$f" ] || { echo "✗ нет скрипта $1"; return 1; }
  echo "→ $1"
  DB_POOL_MAX=2 SEARCH_HOOKS=0 NODE_OPTIONS="--no-deprecation --max-old-space-size=${JOB_MEMORY_MB:-640}" npx payload run "$f"
}

if [ "$SEED_ON_START" = "1" ]; then
  # порядок: районы → досье → статьи → факты → досье ещё раз (хронология объектам, созданным статьями) → свежие события из updates.json → фото досье → адреса и точки → застройщики → словарь
  # импорт идёт в фоне, сайт отвечает сразу; повторный запуск безопасен (обновляет по slug)
  (
    sleep 20
    echo "→ импорт контента"
    job seed:places && job seed:dossiers && job seed && job seed:facts && job seed:dossiers && job seed:updates && job seed:photos && job seed:photos-remote && job seed:geo && job seed:developers && job seed:terms \
      && echo "✓ импорт контента завершён — поставьте SEED_ON_START=0" || echo "✗ импорт контента завершился с ошибкой"
    job media:restore || echo "✗ проверка фото завершилась с ошибкой"
    job search:index || echo "✗ поисковый индекс не собран — сайт ищет по базе"
  ) &
else
  # фото: если записи в базе есть, а файлов в хранилище нет — дозагрузить из content/ (с S3 после первого раза это быстрая проверка)
  # свежие события из content/objects/updates.json: уже загруженные пропускаются, без изменений — быстрая проверка
  # адреса и точки объектов из content/objects/geo.json: обновляются только изменившиеся, без изменений — быстрая проверка
  ( sleep 20; job seed:updates || echo "✗ свежие события объектов не загружены"; job seed:geo || echo "✗ точки объектов не обновлены"; job seed:photos-remote || echo "✗ фото из открытых источников не загружены"; job media:restore || echo "✗ проверка фото завершилась с ошибкой"; job search:index || echo "✗ поисковый индекс не собран — сайт ищет по базе" ) &
fi

echo "→ сайт на порту ${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
