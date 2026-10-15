import sys,os
root=sys.argv[1]
p=os.path.join(root,'Dockerfile'); s=open(p).read()
if 'meilisearch' not in s:
    s=s.replace("FROM node:22-bookworm-slim AS run\nWORKDIR /app/web\n","""FROM node:22-bookworm-slim AS run
WORKDIR /app/web
# Встроенный поисковый движок Meilisearch (запускается в том же контейнере, если не задан внешний MEILI_HOST; MEILI_EMBEDDED=0 — выключить)
ADD https://github.com/meilisearch/meilisearch/releases/download/v1.12.8/meilisearch-linux-amd64 /usr/local/bin/meilisearch
RUN chmod 755 /usr/local/bin/meilisearch
""",1)
    open(p,'w').write(s)
p=os.path.join(root,'web','docker-entrypoint.sh'); s=open(p).read()
if 'MEILI_EMBEDDED' not in s:
    s=s.replace('echo "→ миграции базы"','''# поиск: встроенный Meilisearch, если внешний не задан. Индекс в контейнере временный — собирается заново при каждом старте (несколько секунд).
if [ -z "$MEILI_HOST" ] && [ "${MEILI_EMBEDDED:-1}" = "1" ] && command -v meilisearch >/dev/null 2>&1; then
  export MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \\n')}"
  mkdir -p /tmp/meili
  meilisearch --db-path /tmp/meili/data --dump-dir /tmp/meili/dumps --http-addr 127.0.0.1:7700 --master-key "$MEILI_MASTER_KEY" --env production --no-analytics > /tmp/meili/log.txt 2>&1 &
  export MEILI_HOST=http://127.0.0.1:7700
  echo "→ поиск: встроенный Meilisearch (127.0.0.1:7700)"
fi

echo "→ миграции базы"''',1)
    open(p,'w').write(s)
print('ok')
