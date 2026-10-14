"""
Конвейер статей, шаг после партии: переносит находки фактчекинга из статей в поправки досье.
  python3 harvest-articles.py
- ownership_changes → corrections[slug].owners (история собственников) и текущий застройщик;
- developers (role main / previous) опубликованных статей → застройщик досье, если фактчекинг нашёл другого.
Ручные записи в corrections.json не перезаписываются: дописываются только недостающие.
"""
import glob, json, os, re
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
CP = os.path.join(ROOT, 'objects', 'corrections.json')
C = json.load(open(CP))
ARCH = json.load(open(os.path.join(ROOT, 'objects', 'archive-dossiers.json')))
D = {o['slug']: o for o in ARCH['objects']}
DEVN = {re.sub(r'[^a-zа-я0-9]', '', d['name'].lower().replace('ё', 'е')): d['slug'] for d in ARCH['developers']}

def dev_slug(name, slug=None):
    if slug: return slug
    k = re.sub(r'[^a-zа-я0-9]', '', (name or '').lower().replace('ё', 'е'))
    return DEVN.get(k)

n_own = n_dev = 0
for f in sorted(glob.glob(os.path.join(ROOT, 'articles', '*.md'))):
    s = open(f, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n', s, re.S)
    if not m: continue
    fm = yaml.safe_load(m.group(1)) or {}
    objs = fm.get('objects') or []
    if not objs: continue
    main_obj = objs[0].get('id')
    if str(fm.get('editor_notes') or '').lstrip().lower().startswith('не тот объект'): continue  # статья не про досье пакета
    if D.get(main_obj, {}).get('manual'): continue  # ручные досье ведёт редакция
    # 1. смена собственника — только подтверждённая источником
    for ch in fm.get('ownership_changes') or []:
        slug = ch.get('object') or main_obj
        if slug not in D or not str(ch.get('source', '')).startswith('http'): continue
        c = C.setdefault(slug, {})
        owners = c.setdefault('owners', [])
        to = dev_slug(ch.get('to'), ch.get('to_slug'))
        if not to or any(o.get('developer') == to and o.get('since') for o in owners): continue
        fr = dev_slug(ch.get('from'))
        date = re.sub(r'\s*\(.*?\)', '', str(ch.get('date') or '')).strip()
        if fr and not any(o.get('developer') == fr for o in owners):
            owners.append({'developer': fr, 'name': ch.get('from'), 'until': date})
        owners.append({'developer': to, 'name': ch.get('to'), 'since': date, 'how': ch.get('how'), 'source': ch.get('source')})
        c.setdefault('developer', to); c.setdefault('developerName', ch.get('to'))
        if fr: c.setdefault('previousDevelopers', [fr])
        n_own += 1
    # 2. текущий застройщик по фактчекингу статьи (не для отклонённых)
    if fm.get('status') == 'skip' or main_obj not in D: continue
    devs = fm.get('developers') or []
    main = next((d for d in devs if d.get('role') == 'main'), None)
    if main and main.get('id') and main['id'] != D[main_obj].get('developer') and not C.get(main_obj, {}).get('developer'):
        c = C.setdefault(main_obj, {})
        c['developer'] = main['id']; c['developerName'] = main.get('name')
        prev = [d['id'] for d in devs if d.get('role') == 'previous' and d.get('id')]
        if prev: c.setdefault('previousDevelopers', prev)
        c.setdefault('note', f"застройщик по фактчекингу статьи {os.path.basename(f)[:5]}")
        n_dev += 1

json.dump(C, open(CP, 'w'), ensure_ascii=False, indent=1)
print(f'смен собственника добавлено: {n_own}, застройщиков досье поправлено: {n_dev}')
