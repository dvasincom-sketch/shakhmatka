#!/usr/bin/env python3
"""Портфель застройщика с Яндекс Недвижимости → pipeline/dev-catalog/<dev>.json (только новые для нас ЖК в Москве).
Вход: pipeline/dev-catalog/<dev>-yandex.json — {id: {u, name, addr, st, cl, pr, t}} (выгрузка из браузера, раздел застройщика с showOutdated=YES).
  python3 pipeline/dev-catalog/merge-yandex.py <dev-slug> <z-код Яндекса>   → затем content/archive/build-catalog-dossiers.py <dev-slug>"""
import json, re, sys, glob, os
ROOT = '/home/claude'
dev, z = sys.argv[1], sys.argv[2]
Y = json.load(open(f'{ROOT}/pipeline/dev-catalog/{dev}-yandex.json'))
def n(s): return re.sub(r'[^a-zа-я0-9]', '', (s or '').lower().replace('ё', 'е').replace('ый', 'й'))
def strip(nm): return re.sub(r'^(жк|жилой комплекс|жилой квартал|жилой район|жилой дом|квартал|микрорайон|мфк|многофункциональный комплекс|апарт-комплекс|клубный дом|клубный квартал|делюкс-резиденция|сити-комплекс|фамильный дом|мультиквартал|усадьба|дом)\s+', '', (nm or '').strip().replace('«', '').replace('»', '').replace('"', ''), flags=re.I)
idx = json.load(open(f'{ROOT}/pipeline/mk/all-objects-index.json'))['objects']
for o in json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))['objects']:
    if o.get('name'): idx.append({'slug': o['slug'], 'name': o['name'], 'zu': o.get('zu'), 'aliases': o.get('aliases')})
for f in glob.glob(f'{ROOT}/content/objects/dossiers/*.json'):
    d = json.load(open(f)); idx.append({'slug': d['slug'], 'name': d.get('name'), 'zu': d.get('zu'), 'aliases': d.get('aliases')})
TR = str.maketrans({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'c','ш':'sh','щ':'sh','ъ':'','ы':'y','ь':'','э':'e','ю':'u','я':'a'})
def skel(s):
    s = strip(s or '').lower().translate(TR)
    s = s.replace('dzh', 'j').replace('ks', 'x').replace('ph', 'f').replace('ck', 'k').replace('c', 'k').replace('q', 'k').replace('w', 'v')
    s = re.sub(r'[^a-z0-9]', '', s); s = re.sub(r'[aeiouy]', '', s)
    return re.sub(r'(.)\1+', r'\1', s)
def full(s):
    s = strip(s or '').lower().translate(TR)
    s = s.replace('dzh', 'j').replace('ks', 'x').replace('ph', 'f').replace('ck', 'k').replace('c', 'k').replace('q', 'k').replace('w', 'v').replace('y', 'i')
    s = re.sub(r'[^a-z0-9]', '', s); s = re.sub(r'(.)\1+', r'\1', s)
    return re.sub(r'e$', '', s)
SK, FU = {}, {}
BLOCK = {('PerovSky', 'perovskoe-2'), ('Белые ночи', 'balans')}
M = {}
for o in idx:
    for s in [o.get('name'), o.get('zu'), *(o.get('aliases') or [])]:
        if s and len(n(strip(s))) > 3: M.setdefault(n(strip(s)), o['slug'])
        if s and len(skel(s)) >= 4: SK.setdefault(skel(s), o['slug'])
        if s and len(full(s)) >= 3: FU.setdefault(full(s), o['slug'])
src = f'https://realty.yandex.ru/moskva/kupit/novostrojka/{z}/?showOutdated=YES'
P = json.load(open(f'{ROOT}/pipeline/dev-catalog/{dev}.json')) if os.path.exists(f'{ROOT}/pipeline/dev-catalog/{dev}.json') else {'developer': dev, 'sources': [], 'projects': []}
have = {p['name'] for p in P['projects']} | {p.get('yandex_site_id') for p in P['projects']}
hits, new, skipped = [], [], []
for i, c in Y.items():
    addr = c.get('addr') or ''
    if not addr.startswith('Москва'): skipped.append(f"{c.get('name')} | {addr}"); continue
    if re.search(r'офис|бизнес-центр|бц |business', (c.get('name') or '') + ' ' + c.get('t', ''), re.I) and not re.search(r'квартир|апартамент', c.get('t', ''), re.I): skipped.append(f"{c.get('name')} | офисы"); continue
    nm = re.sub(r'^(ЖК|жилой комплекс|жилой район|микрорайон|жилой дом( по)?|сити-комплекс|делюкс-резиденция|фамильный дом|клубный дом|клубный квартал|усадьба|мультиквартал|МФК)\s+', '', (c.get('name') or '').replace('«', '').replace('»', ''), flags=re.I).strip()
    s = {'Оне': 'one'}.get(nm) or M.get(n(nm))
    if not s and len(full(nm)) >= 3: s = FU.get(full(nm))
    if not s and len(skel(nm)) >= 4: s = SK.get(skel(nm))
    if s and (c.get('name'), s) in BLOCK or (nm, s) in BLOCK: s = None
    if s: hits.append((nm, s)); continue
    if nm in have or i in have: continue
    done = (c.get('st') or '').startswith('Сдан')
    pr = c.get('pr'); cl = c.get('cl') or None
    new.append(nm)
    P['projects'].append({'name': nm, 'address': addr, 'zu': None, 'district': None, 'stage': 'completed' if done else 'sales', 'completion': None if done else (c.get('st') or None),
        'class': cl.capitalize() if cl else None, 'buildings': None, 'price_from_mln': float(pr.replace(',', '.')) if pr and not done else None, 'price_as_of': 'октябрь 2026' if pr and not done else None,
        'our_slug': None, 'sources': [f"https://realty.yandex.ru{c['u']}" if c.get('u', '').startswith('/') else src], 'yandex_site_id': i,
        'notes': 'Яндекс Недвижимость, раздел застройщика в Москве (с завершёнными), 15.10.2026' + ('' if done else '; статус «строится/продажи», срок сдачи по каталогу')})
P['sources'] = list(dict.fromkeys(P['sources'] + [src]))
json.dump(P, open(f'{ROOT}/pipeline/dev-catalog/{dev}.json', 'w'), ensure_ascii=False, indent=1)
print(f'{dev}: в выгрузке {len(Y)}, у нас уже {len(hits)}, новых {len(new)}, не Москва/офисы {len(skipped)}')
print('новые:', ', '.join(new)); print('совпали:', ', '.join(f'{a}→{b}' for a, b in hits)); print('пропущены:', '; '.join(skipped[:15]))
