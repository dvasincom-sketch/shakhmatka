"""
Контуры районов Москвы для интерактивной карты на /novostroyki/.
  python3 web/scripts/build-moscow-map.py
Берёт content/places/moscow-districts-osm.geojson (границы районов из OpenStreetMap, © участники OpenStreetMap, ODbL;
выгрузка github.com/timurkanaz/Russia_geojson_OSM), сопоставляет с web/src/lib/districts.ts по названию,
упрощает, проецирует в плоскость и пишет web/src/lib/moscow-map.ts: пути районов, контуры округов и рамки для приближения.
НАО и ТАО в выгрузке — целыми округами: на карте они кликаются как «район» с ключом nao / tao.
Нужен shapely: pip install shapely.
"""
import json, math, os, re
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT, 'content', 'places', 'moscow-districts-osm.geojson')
DTS = os.path.join(ROOT, 'web', 'src', 'lib', 'districts.ts')
OUT = os.path.join(ROOT, 'web', 'src', 'lib', 'moscow-map.ts')

W = 1000  # ширина всей Москвы в единицах карты
LAT0 = 55.75
K = math.cos(math.radians(LAT0))
TOL = 0.55  # допуск упрощения в единицах карты (≈ 0,5 px при ширине карты 1000 px)

src = open(DTS, encoding='utf-8').read()
D = {k: (n, o) for k, n, o in re.findall(r"'([\w-]+)': \{ name: '([^']+)', okrug: '([^']+)' \}", src)}
norm = lambda s: s.lower().replace('ё', 'е').replace('район ', '').replace('-', ' ').strip()
BYNAME = {norm(n): k for k, (n, o) in D.items()}
SPECIAL = {'Новомосковский административный округ': ('nao', 'НАО', 'Новомосковский округ'),
           'Троицкий административный округ': ('tao', 'ТАО', 'Троицкий округ')}

g = json.load(open(SRC, encoding='utf-8'))
feats = []
for f in g['features']:
    n = f['properties']['district']
    if n in SPECIAL:
        k, o, name = SPECIAL[n]
    else:
        k = BYNAME.get(norm(n))
        if not k: raise SystemExit(f'нет в districts.ts: {n}')
        name, o = D[k]
    feats.append((k, name, o, shape(f['geometry'])))

xs = [c for *_, s in feats for c in (s.bounds[0], s.bounds[2])]
ys = [c for *_, s in feats for c in (s.bounds[1], s.bounds[3])]
LON0, LATMAX = min(xs), max(ys)
SC = W / ((max(xs) - LON0) * K)
H = round((LATMAX - min(ys)) * SC)
def proj(x, y): return ((x - LON0) * K * SC, (LATMAX - y) * SC)
import shapely
P = lambda s: shapely.transform(s, lambda a: __import__('numpy').column_stack(proj(a[:, 0], a[:, 1])))

def path(s):
    out = []
    polys = [s] if s.geom_type == 'Polygon' else list(s.geoms)
    for p in polys:
        if p.area < 2: continue  # крошечные осколки
        for ring in [p.exterior, *p.interiors]:
            pts = list(ring.coords)[:-1]
            if len(pts) < 3: continue
            # относительные координаты с шагом 0,1 — короче строка
            q = [(round(x * 10), round(y * 10)) for x, y in pts]
            seg = [f'M{q[0][0]/10:g} {q[0][1]/10:g}']
            px, py = q[0]
            for x, y in q[1:]:
                if (x, y) == (px, py): continue
                seg.append(f'l{(x-px)/10:g} {(y-py)/10:g}')
                px, py = x, y
            out.append(''.join(seg) + 'z')
    return ''.join(out)

def box(s, pad=0.06):
    a, b, c, d = s.bounds
    w, h = c - a, d - b
    return [round(a - w * pad, 1), round(b - h * pad, 1), round(w * (1 + 2 * pad), 1), round(h * (1 + 2 * pad), 1)]

def label_pt(s):
    # точка подписи: центр самого большого куска, если он внутри, иначе representative_point
    big = s if s.geom_type == 'Polygon' else max(s.geoms, key=lambda p: p.area)
    c = big.centroid
    if not big.contains(c): c = big.representative_point()
    return [round(c.x, 1), round(c.y, 1)]

proj_feats = [(k, n, o, P(s).buffer(0)) for k, n, o, s in feats]
districts = []
for k, n, o, s in proj_feats:
    simp = s.simplify(TOL, preserve_topology=True)
    districts.append({'k': k, 'n': n, 'o': o, 'd': path(simp), 'c': label_pt(s), 'b': box(s, .15)})

okrugs = []
for o in sorted({o for *_, o, _ in proj_feats}):
    u = unary_union([s.buffer(0.05) for _, _, oo, s in proj_feats if oo == o]).buffer(-0.05)
    okrugs.append({'o': o, 'd': path(u.simplify(TOL * 1.3, preserve_topology=True)), 'c': label_pt(u), 'b': box(u)})

# «Москва в МКАД и рядом»: главные куски районов без анклавов (Внуково и острова Кунцева растягивают рамку)
big = lambda s: s if s.geom_type == 'Polygon' else max(s.geoms, key=lambda p: p.area)
old = unary_union([big(s) for k, _, o, s in proj_feats if o not in ('НАО', 'ТАО', 'ЗелАО') and k not in ('vnukovo', 'kuntsevo')])
VIEWS = {'old': box(old, .03), 'all': [0, 0, W, H]}

ts = ['// Сгенерировано web/scripts/build-moscow-map.py из границ OpenStreetMap (© участники OpenStreetMap, ODbL). Не править руками.',
      'export type MapDistrict = { k: string; n: string; o: string; d: string; c: [number, number]; b: [number, number, number, number] }',
      'export type MapOkrug = { o: string; d: string; c: [number, number]; b: [number, number, number, number] }',
      f'export const MAP_W = {W}', f'export const MAP_H = {H}',
      f'/** Проекция широты и долготы в координаты карты: x = (lng − lon0) · k · sc, y = (latMax − lat) · sc */',
      f'export const MAP_PROJ = {{ lon0: {LON0!r}, latMax: {LATMAX!r}, k: {K!r}, sc: {SC!r} }}',
      f'export const MAP_VIEWS: Record<"old" | "all", [number, number, number, number]> = {json.dumps(VIEWS)}',
      f'export const MAP_DISTRICTS: MapDistrict[] = {json.dumps(districts, ensure_ascii=False, separators=(",", ":"))}',
      f'export const MAP_OKRUGS: MapOkrug[] = {json.dumps(okrugs, ensure_ascii=False, separators=(",", ":"))}', '',
      'export const projectLL = (lat: number, lng: number): [number, number] => [(lng - MAP_PROJ.lon0) * MAP_PROJ.k * MAP_PROJ.sc, (MAP_PROJ.latMax - lat) * MAP_PROJ.sc]', '']
open(OUT, 'w', encoding='utf-8').write('\n'.join(ts))
print(f'{len(districts)} районов, {len(okrugs)} округов, {os.path.getsize(OUT)//1024} КБ → {OUT}')
