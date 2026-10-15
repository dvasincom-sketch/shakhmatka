"""
Архитектурные бюро из досье и статей → страницы /arhitektory/.
Вход: pipeline/architects/out-*.json (разметка по брифу pipeline/architects/BRIEF.md), content/objects/archive-dossiers.json, content/articles/*.md.
Выход: content/objects/architects.json и web/src/lib/architects.ts.
  python3 content/archive/build-architects.py
Ручные правки — словарь FIX ниже (склейка, переименование, исключение).
"""
import glob, json, os, re, yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'content', 'objects', 'architects.json')
TS = os.path.join(ROOT, 'web', 'src', 'lib', 'architects.ts')

DROP = {'kso', 'ucd', 'severin-group', 'severin', 'tpo-reserv', 'tpo-rezerv'}  # не бюро или связь с проектом не подтверждена текстом
RENAME = {}  # key → новое название

norm = lambda s: re.sub(r'[^a-zа-я0-9]+', '', (s or '').lower().replace('ё', 'е').replace('architects', '').replace('architekten', '').replace('бюро', '').replace('мастерская', ''))

src = [json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(os.path.join(ROOT, 'pipeline', 'architects', 'out-*.json')))]
# склейка: одинаковое нормализованное название или алиас → один ключ
parent = {}
def find(k):
    while parent.get(k, k) != k: k = parent[k]
    return k
by_norm = {}
bureaus = {}
for s in src:
    for b in s['bureaus']:
        k = b['key']; parent.setdefault(k, k)
        for nm in [b['name']] + (b.get('aliases') or []):
            n = norm(nm)
            if len(n) < 3: continue
            if n in by_norm and find(by_norm[n]) != find(k):
                a, c = find(by_norm[n]), find(k)
                keep, drop = (a, c) if len(a) >= len(c) or a in bureaus else (c, a)
                parent[drop] = keep
            by_norm.setdefault(n, k)
        cur = bureaus.setdefault(k, {'name': b['name'], 'aliases': set(), 'kind': b.get('kind') or 'architecture'})
        cur['aliases'] |= set(b.get('aliases') or [])
merged = {}
for k, b in bureaus.items():
    r = find(k)
    m = merged.setdefault(r, {'key': r, 'name': None, 'aliases': set(), 'kind': b['kind']})
    if not m['name'] or (k == r): m['name'] = b['name']
    m['aliases'] |= b['aliases'] | {b['name']}
    if b['kind'] == 'architecture': m['kind'] = 'architecture'

D = json.load(open(os.path.join(ROOT, 'content', 'objects', 'archive-dossiers.json'), encoding='utf-8'))
objs = {o['slug']: o for o in D['objects']}
arts = {}
for f in glob.glob(os.path.join(ROOT, 'content', 'articles', '*.md')):
    s = open(f, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---', s, re.S)
    try: fm = yaml.safe_load(m.group(1)) if m else None
    except Exception: fm = None
    if fm and fm.get('status') != 'skip': arts[os.path.basename(f)] = fm
for k, m in merged.items(): m.update(objects={}, articles={})
for s in src:
    for l in s['links']:
        k = find(l['bureau'])
        if k in DROP or k not in merged: continue
        m = merged[k]
        if l.get('article'):
            fm = arts.get(l['article'])
            if not fm or not fm.get('slug'): continue
            m['articles'][fm['slug']] = {'slug': fm['slug'], 'title': fm.get('title'), 'date': str(fm.get('date_published') or fm.get('date') or '')[:10]}
            if l.get('obj') in objs: m['objects'].setdefault(l['obj'], {'role': l.get('role') or '', 'events': []})
        elif l.get('obj') in objs:
            o = objs[l['obj']]; tl = o.get('timeline') or []
            ev = tl[l['event']] if isinstance(l.get('event'), int) and l['event'] < len(tl) else None
            x = m['objects'].setdefault(l['obj'], {'role': l.get('role') or '', 'events': []})
            if not x['role'] and l.get('role'): x['role'] = l['role']
            if ev and not any(e['date'] == ev['date'] and e['title'] == ev['title'] for e in x['events']):
                x['events'].append({'date': ev['date'], 'title': ev['title'], 'signal': ev.get('certainty') == 'signal'})

out = []
for k, m in merged.items():
    if k in DROP or not (m['objects'] or m['articles']): continue
    name = RENAME.get(k, m['name'])
    out.append({'key': k, 'name': name, 'kind': m['kind'], 'aliases': sorted(a for a in m['aliases'] if a != name),
                'objects': [{'slug': s, **v, 'events': sorted(v['events'], key=lambda e: e['date'])} for s, v in m['objects'].items()],
                'articles': sorted(m['articles'].values(), key=lambda a: a['date'], reverse=True)})
out.sort(key=lambda b: (-len(b['objects']) - len(b['articles']), b['name'].lower()))
json.dump({'_readme': 'Сгенерировано build-architects.py из разметки досье и статей. Связи из досье — данные архива редакции (часть — сигналы).', 'bureaus': out},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(TS, 'w', encoding='utf-8').write(
    '// Сгенерировано content/archive/build-architects.py — не править руками.\n'
    'export type BureauEvent = { date: string; title: string; signal: boolean }\n'
    'export type BureauObject = { slug: string; role: string; events: BureauEvent[] }\n'
    'export type Bureau = { key: string; name: string; kind: string; aliases: string[]; objects: BureauObject[]; articles: { slug: string; title: string; date: string }[] }\n'
    f'export const BUREAUS: Bureau[] = {json.dumps(out, ensure_ascii=False)}\n'
    'export const bureauByKey = (k: string) => BUREAUS.find((b) => b.key === k)\n'
    '/** Бюро, связанные с объектом */\n'
    'export const bureausOf = (objSlug: string) => BUREAUS.filter((b) => b.objects.some((o) => o.slug === objSlug))\n')
print(f'бюро: {len(out)} (архитектура {sum(b["kind"] == "architecture" for b in out)}), с 2+ проектами: {sum(len(b["objects"]) >= 2 for b in out)}')
print('топ:', ', '.join(f'{b["name"]} {len(b["objects"])}' for b in out[:12]))
