#!/usr/bin/env python3
"""Статистика по архбюро для статьи и страницы /arhitektory/: стадии проектов, застройщики, роли, смены архитектора."""
import json, glob, collections, re
ROOT = '/home/claude'
B = json.load(open(f'{ROOT}/content/objects/architects.json'))['bureaus']
O = {o['slug']: o for o in json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))['objects'] if o.get('name')}
for f in glob.glob(f'{ROOT}/content/objects/dossiers/*.json'):
    d = json.load(open(f)); O[d['slug']] = {**O.get(d['slug'], {}), **{k: v for k, v in d.items() if v}}
C = json.load(open(f'{ROOT}/content/objects/corrections.json'))
for s, c in C.items():
    if isinstance(c, dict) and s in O:
        if c.get('stage'): O[s]['stage'] = c['stage']
        if c.get('developer'): O[s]['developer'] = c['developer']
DEVN = {d['slug']: d['name'] for d in json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))['developers']}
ALT = re.compile(r'альтернатив|неосуществл|прежн|в стол|вместо|замен', re.I)
STAGES = ['land', 'concept', 'architecture', 'permit', 'sales', 'completed']
out, pairs = [], collections.Counter()
per_obj = collections.Counter()
for b in B:
    if b['kind'] != 'architecture': continue
    objs = [x for x in b['objects'] if x['slug'] in O]
    st = collections.Counter(O[x['slug']].get('stage') or 'unknown' for x in objs if not ALT.search(x['role']))
    dev = collections.Counter(O[x['slug']].get('developer') for x in objs if O[x['slug']].get('developer') and not ALT.search(x['role']))
    for d, n in dev.items(): pairs[(b['name'], DEVN.get(d, d))] += n
    for x in objs: per_obj[x['slug']] += 1
    main = [x for x in objs if not ALT.search(x['role'])]
    built = sum(st[s] for s in ('permit', 'sales', 'completed'))
    out.append({'key': b['key'], 'name': b['name'], 'objects': len(objs), 'main': len(main), 'alt': len(objs) - len(main), 'stages': dict(st),
                'reached_permit_share': round(built / len(main), 2) if main else None, 'devs': [[DEVN.get(d, d), n] for d, n in dev.most_common(5)]})
out.sort(key=lambda x: -x['objects'])
multi = sum(1 for v in per_obj.values() if v >= 2)
alt_total = sum(x['alt'] for x in out)
allst = collections.Counter()
for x in out: allst.update(x['stages'])
res = {'bureaus': out, 'top_pairs': [[a, d, n] for (a, d), n in pairs.most_common(25)], 'objects_with_architect': len(per_obj), 'objects_multi_bureau': multi, 'alt_links': alt_total, 'stage_total': dict(allst)}
json.dump(res, open(f'{ROOT}/pipeline/architects/stats.json', 'w'), ensure_ascii=False, indent=1)
print('объектов', len(per_obj), 'с 2+ бюро', multi, 'альтернативных связей', alt_total, 'стадии', dict(allst))
for x in out[:15]: print(x['name'], x['objects'], 'дошли до РНС+', x['reached_permit_share'], x['devs'][:3])
print(res['top_pairs'][:12])
