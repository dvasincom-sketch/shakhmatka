"""
Класс жилья проектов: pipeline/classes/out-*.json (бриф pipeline/classes/BRIEF.md) →
  content/objects/classes.json — класс, основание и источник по каждому проекту;
  content/objects/facts.json  — поле class для каталога (только если в facts класса ещё нет: класс из статьи главнее);
  web/src/lib/classes.ts      — основание и источник для страницы объекта.
Методика — термин «Класс жилья» в словаре (content/terms/terms.json, slug klass-zhilya).
  python3 content/archive/build-classes.py
"""
import glob, json, os, re
from urllib.parse import urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'content', 'objects', 'classes.json')
FACTS = os.path.join(ROOT, 'content', 'objects', 'facts.json')
TS = os.path.join(ROOT, 'web', 'src', 'lib', 'classes.ts')

# Не берём: привязка к проекту только по названию/алиасу, апарт-отель, класс назван только в имени, «четыре ЖК бизнес-класса» без списка
EXCLUDE = {
    'forst': 'привязка по названию из новости', 'ferst': 'привязка по названию из новости',
    'staropetrovskiy-atrium': 'привязка по алиасу', 'yuzhnoportovaya': 'привязка по алиасу',
    'starovagankovskiy': 'привязка по алиасу', 'one': 'привязка по названию', 'vishnevaya-7': 'привязка по алиасу',
    'nametkina-10d': 'апарт-отель', 'tishinskiy-bulvar': 'класс только в названии',
    'amarant': 'в источнике нет списка проектов', 'myata': 'в источнике нет списка проектов',
    'veresk': 'в источнике нет списка проектов', 'perets': 'в источнике нет списка проектов',
}
SITE = {'realty.yandex.ru': 'Яндекс Недвижимость', 'cian.ru': 'ЦИАН', 'www.cian.ru': 'ЦИАН', 'novostroy-m.ru': 'Новострой-М',
        'www.novostroy-m.ru': 'Новострой-М', 'domclick.ru': 'Домклик', 'xn--80az8a.xn--d1aqf.xn--p1ai': 'наш.дом.рф'}

rows = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'pipeline', 'classes', 'out-*.json'))):
    for r in json.load(open(f, encoding='utf-8')):
        if not r.get('class') or r['slug'] in EXCLUDE: continue
        host = urlparse(r.get('source') or '').netloc
        site = SITE.get(host, host.removeprefix('www.'))
        kind = 'СМИ' if 'СМИ' in (r.get('evidence') or '') or '/novosti/' in (r.get('source') or '') or '/expertise/' in (r.get('source') or '') else 'каталог'
        rows[r['slug']] = {'class': r['class'], 'basis': r.get('basis') or 'catalog', 'source': r.get('source'),
                           'site': site, 'kind': kind, 'checked': '15.10.2026'}

facts = json.load(open(FACTS, encoding='utf-8'))
for slug, v in facts['objects'].items():
    if v.get('class') and slug not in rows:
        rows[slug] = {'class': v['class'], 'basis': 'article', 'source': None, 'site': 'статья «Шахматки»', 'kind': 'статья', 'checked': v.get('priceAsOf')}
n = 0
for slug, r in rows.items():
    o = facts['objects'].setdefault(slug, {})
    if not o.get('class'): o['class'] = r['class']; n += 1
json.dump(facts, open(FACTS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'_readme': 'Сгенерировано build-classes.py. Класс — заявленный (застройщик, наш.дом.рф или каталог), см. методику в словаре.', 'objects': rows},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
slim = {k: {'b': v['basis'], 's': v['source'], 'n': v['site'], 'k': v['kind']} for k, v in sorted(rows.items())}
open(TS, 'w', encoding='utf-8').write(
    '// Сгенерировано content/archive/build-classes.py — не править руками.\n'
    '// Основание класса: b — developer | domrf | catalog | article; s — ссылка; n — площадка; k — каталог | СМИ | статья.\n'
    'export type ClassSource = { b: string; s: string | null; n: string; k: string }\n'
    f'export const CLASS_SOURCES: Record<string, ClassSource> = {json.dumps(slim, ensure_ascii=False)}\n')
from collections import Counter
print(f'класс у {len(rows)} проектов ({Counter(v["class"] for v in rows.values())}); в facts.json добавлено {n}')
