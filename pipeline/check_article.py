"""
Автопроверка статьи конвейера: python3 check_article.py <статья.md> <пакет.json>
Печатает ошибки (статью надо исправить) и предупреждения. Код выхода 1, если есть ошибки.
"""
import json, os, re, sys
import yaml

art, pack_path = sys.argv[1], sys.argv[2]
P = json.load(open(pack_path))
raw = open(art, encoding='utf-8').read()
err, warn = [], []
m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
if not m: print('ОШИБКА: нет YAML-шапки между ---'); sys.exit(1)
try: fm = yaml.safe_load(m.group(1))
except Exception as e: print('ОШИБКА: YAML не читается:', e); sys.exit(1)
body = m.group(2)

def need(k):
    if not fm.get(k): err.append(f'нет поля {k}')
for k in ('status', 'type', 'title', 'slug', 'lead', 'date_published', 'date_modified', 'author'): need(k)
status = fm.get('status')
if status not in ('ready', 'needs_review', 'skip'): err.append('status: ready | needs_review | skip')

if status != 'skip':
    for k in ('seo', 'faq', 'factcheck', 'objects', 'schema', 'internal_links'): need(k)
    seo = fm.get('seo') or {}
    t, d = seo.get('title') or '', seo.get('description') or ''
    if not 10 <= len(t) <= 60: err.append(f'seo.title {len(t)} знаков, нужно ≤ 60')
    if not 140 <= len(d) <= 160: err.append(f'seo.description {len(d)} знаков, нужно 140–160')
    if len(fm.get('title') or '') > 80: err.append('title (H1) длиннее 80 знаков')
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+){2,7}', str(fm.get('slug') or '')): err.append('slug: латиница через дефис, 3–8 слов')
    if str(fm.get('date_published'))[:10] != P['date_published']: err.append(f"date_published должна быть {P['date_published']} (дата заметки)")
    if str(fm.get('date_modified'))[:10] != P['date_modified']: err.append(f"date_modified должна быть {P['date_modified']}")
    if not 3 <= len(fm.get('faq') or []) <= 5: err.append('FAQ: 3–5 вопросов')
    try:
        sch = json.loads(fm['schema']) if isinstance(fm.get('schema'), str) else fm.get('schema')
        if not sch: raise ValueError('пусто')
    except Exception as e: err.append(f'schema — невалидный JSON: {e}')
    # объекты и застройщики — только из пакета
    allowed_obj = {P['dossier']['slug']} | {o['slug'] for o in P.get('other_objects', [])}
    for o in fm.get('objects') or []:
        if o.get('id') not in allowed_obj: err.append(f"объект {o.get('id')} не из пакета: допустимы {sorted(allowed_obj)}")
    if not any(o.get('id') == P['dossier']['slug'] for o in fm.get('objects') or []): err.append(f"в objects нет главного досье {P['dossier']['slug']}")
    elif (fm.get('objects') or [{}])[0].get('id') != P['dossier']['slug']: err.append('главное досье должно стоять первым в objects')
    # внутренние ссылки: и в internal_links, и в тексте — только разрешённые адреса
    L = P['links_allowed']
    ok = {P['dossier']['url']} | {o['url'] for o in P.get('other_objects', [])} | set(L['terms']) | set(L['topics']) | set(L['landings']) | {a['url'] for a in L['articles']}
    dv = P['dossier'].get('developer'); ds = P['dossier'].get('district')
    if dv: ok.add(dv['url'])
    if ds: ok.add(ds['url'])
    ok_prefix = ('/slovar/',)  # ещё не созданный термин можно, он оживёт после публикации
    links = re.findall(r'\]\((/[^)\s]*)\)', body)
    for u in links:
        if u not in ok and not u.startswith(ok_prefix): err.append(f'внутренняя ссылка {u} не из разрешённых')
    if not 3 <= len(set(links)) <= 8: warn.append(f'внутренних ссылок в тексте {len(set(links))}, нужно 3–6')
    if P['dossier']['url'] not in links: err.append(f"в тексте нет ссылки на досье {P['dossier']['url']}")
    # картинки
    for im in fm.get('images') or []:
        f = im.get('file', '')
        if not re.fullmatch(r'media/\d+_\d+\.jpg', f): err.append(f'images.file {f}: формат media/<id>_N.jpg')
        elif not os.path.exists(os.path.join('/home/claude/content/articles', f)): err.append(f'нет файла content/articles/{f} — скопируй выбранное фото')
        if not im.get('alt') or len(im['alt']) > 125: err.append(f'alt у {f}: обязателен, ≤ 125 знаков')
    for f in re.findall(r'!\[[^\]]*\]\(([^)]+)\)', body):
        if not os.path.exists(os.path.join('/home/claude/content/articles', f)): err.append(f'в тексте картинка {f}, файла нет')
    # запреты
    low = body.lower() + ' ' + str(fm.get('title', '')).lower() + ' ' + str(fm.get('lead', '')).lower()
    for bad in ('t.me', 'telegram', 'max.ru', 'подписывайтесь', 'наш канал', 'в канале', 'недвижимость инсайд', 'мы писали'):
        if bad in low: err.append(f'запрещено: «{bad}»')
    if 'не является инвестиционной рекомендацией' not in body[-300:].lower(): err.append('последняя строка — «Материал не является инвестиционной рекомендацией.»')
    if '## Источники' not in body: err.append('нет раздела «## Источники»')
    for c in fm.get('factcheck') or []:
        if c.get('status') in ('confirmed', 'changed') and not str(c.get('source', '')).startswith('http'): err.append(f"факт без ссылки: {c.get('claim', '')[:60]}")
    n = len(re.sub(r'\s+', ' ', body))
    if n < 1500: warn.append(f'текст короткий: {n} знаков')
    if n > 12000: warn.append(f'текст длинный: {n} знаков')

expected = f"{P['unit']}-{fm.get('slug')}.md"
if os.path.basename(art) != expected: err.append(f'имя файла должно быть {expected}')
for e in err: print('ОШИБКА:', e)
for w in warn: print('ПРЕДУПРЕЖДЕНИЕ:', w)
print('OK' if not err else f'ошибок: {len(err)}')
sys.exit(1 if err else 0)
