#!/usr/bin/env python3
"""Добавляет в content/archive/registry.json и note-dates.json заметки из notes_marked.json, которых там ещё нет.
Инкрементально, существующие записи реестра не пересобираются (исходники merge.py больше не хранятся).
Запуск после `ingest-notes.py --merge`, перед build-dossiers.py:  python3 pipeline/ingest/append-registry.py"""
import json, re, os, collections
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = os.path.join(ROOT, 'content', 'archive')
R = json.load(open(f'{A}/registry.json'))
M = {int(k): v for k, v in json.load(open(f'{A}/notes_marked.json')).items()}
N = json.load(open(f'{ROOT}/pipeline/notes-text.json'))
ND = json.load(open(f'{A}/note-dates.json'))
def norm(s):  # как в merge.py
    if not s: return None
    s = s.replace('ё', 'е').replace('Ё', 'Е').strip(' «»"\'.')
    s = re.sub(r'^(ЗУ|ул\.?|улица)\s+', '', s, flags=re.I)
    s = re.sub(r'\s+', ' ', s); s = re.sub(r'\s*,\s*', ', ', s)
    s = re.sub(r'\b(стр|строение)\.?\s*', ' стр. ', s); s = re.sub(r'\b(вл|влд|владение)\.?\s*', ' вл. ', s)
    return re.sub(r'\s+', ' ', s).strip().lower()
LAST = max(n for v in R.values() for n in v["notes"])  # реестр собран по эту заметку; более ранние без объектов туда не попали намеренно
# название → ключ: по названиям, уже закреплённым в реестре (самый «частый» адрес)
name2key = collections.defaultdict(collections.Counter)
for k, v in R.items():
    for nm, c in v['names'] + v['aliases']: name2key[norm(nm)][k] += c
def resolve(o):
    k = norm(o.get('key'))
    if k: return k
    for nm in [o.get('name')] + (o.get('aliases') or []):
        c = name2key.get(norm(nm))
        if c: return c.most_common(1)[0][0]
    n = norm(o.get('name'))
    return ('имя:' + n) if n else None
def upd(lst, val):
    d = collections.Counter(dict((a, b) for a, b in lst)); d[val] += 1; return d.most_common()
added = collections.Counter()
for nid in sorted(M):
    if nid <= LAST: continue
    r = M[nid]; keys = []
    for o in r.get('objects') or []:
        k = resolve(o); keys.append(k)
        if not k: continue
        d = R.setdefault(k, {'key': None if k.startswith('имя:') else (o.get('key') or '').strip(), 'byname': k.startswith('имя:'), 'notes': [], 'events': [], 'names': [], 'aliases': [], 'devs': [], 'districts': [], 'cities': [], 'main': 0})
        if nid not in d['notes']: d['notes'] = sorted(d['notes'] + [nid])
        if o.get('role') == 'main': d['main'] += 1
        if o.get('name'): d['names'] = upd(d['names'], o['name'].strip(' «»"'))
        for a in o.get('aliases') or []: d['aliases'] = upd(d['aliases'], a.strip(' «»"'))
        for f, kk in (('devs', 'developer'), ('districts', 'district'), ('cities', 'city')):
            if o.get(kk): d[f] = upd(d[f], o[kk])
        added['объект'] += 1
    for e in r.get('events') or []:
        i = e.get('obj')
        if isinstance(i, int) and 0 <= i < len(keys) and keys[i]:
            R[keys[i]]['events'].append({**e, 'note': nid, 'value': r.get('value')}); added['событие'] += 1
    added['заметка'] += 1
for k, v in N.items():
    if k not in ND and v.get('date'): ND[k] = v['date'][:10]
json.dump(R, open(f'{A}/registry.json', 'w'), ensure_ascii=False)
json.dump(ND, open(f'{A}/note-dates.json', 'w'), ensure_ascii=False)
print(dict(added))
