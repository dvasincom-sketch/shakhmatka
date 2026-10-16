#!/usr/bin/env python3
"""
Скачивает фото статей, у которых в шапке указан source_url (например, материалы раздела «Интерьер»
по мотивам Never Too Small — фото используются с разрешения правообладателя).
Запуск из корня проекта:  python3 scripts/fetch-article-photos.py
Уже скачанные файлы не трогает. Затем — импорт: cd web && npm run seed
"""
import os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'content', 'articles')
PAT = re.compile(r'file:\s*"([^"]+)".*?source_url:\s*"([^"]+)"')

done = skip = fail = 0
for name in sorted(os.listdir(ART)):
    if not name.endswith('.md'):
        continue
    head = open(os.path.join(ART, name), encoding='utf-8').read().split('\n---\n', 1)[0]
    for file, url in PAT.findall(head):
        if not url.startswith('https://cdn.prod.website-files.com/'):
            continue  # только фото с сайта-источника; Wikimedia и пр. редакция кладёт сама
        dst = os.path.join(ART, file)
        if os.path.exists(dst):
            skip += 1
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (shakhmatka editorial)'})
            with urllib.request.urlopen(req, timeout=60) as r, open(dst, 'wb') as f:
                f.write(r.read())
            done += 1
            print('скачано', file)
        except Exception as e:
            fail += 1
            print('ошибка', file, e, file=sys.stderr)
print(f'Фото статей: скачано {done}, уже были {skip}, ошибок {fail}')
