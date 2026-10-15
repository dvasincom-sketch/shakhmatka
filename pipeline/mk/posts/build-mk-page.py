#!/usr/bin/env python3
"""page-rows.json (build-mk-posts.py) → web/src/lib/mk-houses.ts для страницы /moskovskie-kvartaly/."""
import json, os
ROOT = '/home/claude'
R = json.load(open(f'{ROOT}/pipeline/mk/posts/page-rows.json'))
names = {}
for f in os.listdir(f'{ROOT}/content/objects/dossiers'):
    if f.endswith('.json'):
        d = json.load(open(f'{ROOT}/content/objects/dossiers/{f}')); names[d['slug']] = (d['name'], d.get('district'))
A = json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))
for o in A['objects']:
    if o.get('name'): names.setdefault(o['slug'], (o['name'], o.get('district')))
HED = json.load(open(f'{ROOT}/pipeline/mk/posts/hedonic.json'))
rows = []
for r in R:
    n, dist = names.get(r['slug'], (r['name'], None))
    hz = HED['houses'].get(r.get('url'))
    r = {**r, 'name': n, 'district': r.get('district') or dist, 'ppmStd': hz['std'] if hz else None, 'stdN': hz['n'] if hz else None}
    rows.append({k: v for k, v in r.items() if v not in (None, [], False) or k in ('done', 'building')})
ts = '''/** Дома «Московских кварталов» (Фонд реновации) с ценами. СГЕНЕРИРОВАНО pipeline/mk/posts/build-mk-page.py — руками не править.
 * Источник — карточки домов и квартир на москварталы.рф; ppmNow/priceNow — минимум по размещениям последнего месяца (nowMonth),
 * ppmFirst — минимум в месяц, когда квартиры дома впервые замечены в продаже (first). */
export type MkHouse = { slug: string; name: string; district?: string; done: boolean; building: boolean; year?: number; completion?: string; flats?: number; floors?: string;
  finish?: string; family?: boolean; metro?: string[]; first: string; ppmFirst?: number; nowMonth?: string; ppmNow?: number; ppmMax?: number; priceNow?: number; auction?: boolean; posted?: number; url: string; ppmStd?: number; stdN?: number }
export const MK_CHECKED = '2026-10-15'
/** Гедонический индекс цен Фонда (pipeline/mk/posts/hedonic.py): месяц → уровень цен к базовому месяцу при той же квартире в том же доме. ppmStd — сопоставимая цена: стандартная квартира (2 комнаты, 55 м², средний этаж, без аукциона) в ценах месяца to */
export const MK_INDEX = ''' + json.dumps({k: HED[k] for k in ('base', 'to', 'index', 'index_se', 'r2', 'n', 'houses_n', 'merged')}, ensure_ascii=False) + '''
export const MK_HOUSES: MkHouse[] = ''' + json.dumps(rows, ensure_ascii=False, indent=0) + '\n'
open(f'{ROOT}/web/src/lib/mk-houses.ts', 'w').write(ts)
print(len(rows), 'домов,', sum(1 for r in rows if r.get('ppmNow')), 'с ценой')
