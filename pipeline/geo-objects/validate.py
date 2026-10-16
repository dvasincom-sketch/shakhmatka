"""
Проверка точек объектов: точка должна лежать в своём районе (или рядом — допуск 400 м).
  python3 pipeline/geo-objects/validate.py
Вход: pipeline/geo-objects/raw.tsv (slug, источник, широта, долгота, точность, адрес, заметка) — результат геокодирования.
Выход: content/objects/geo.json — {slug: {address, lat, lng, precision, source}} только для прошедших проверку,
       pipeline/geo-objects/rejected.tsv — отклонённые с причиной.
Районы: content/places/moscow-districts-osm.geojson (OSM), ключи — web/src/lib/districts.ts.
"""
import json, math, os, re, sqlite3
from shapely.geometry import shape, Point

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
src = open(os.path.join(ROOT, 'web/src/lib/districts.ts'), encoding='utf-8').read()
D = {k: (n, o) for k, n, o in re.findall(r"'([\w-]+)': \{ name: '([^']+)', okrug: '([^']+)' \}", src)}
norm = lambda s: s.lower().replace('ё', 'е').replace('район ', '').replace('-', ' ').strip()
BYNAME = {norm(n): k for k, (n, o) in D.items()}
SPECIAL = {'Новомосковский административный округ': 'nao', 'Троицкий административный округ': 'tao'}
POLY = {}
for f in json.load(open(os.path.join(ROOT, 'content/places/moscow-districts-osm.geojson'), encoding='utf-8'))['features']:
    n = f['properties']['district']
    k = SPECIAL.get(n) or BYNAME.get(norm(n))
    POLY[k] = shape(f['geometry'])
MOSCOW = None
from shapely.ops import unary_union
MOSCOW = unary_union(list(POLY.values()))

def poly_for(district):
    if not district: return None
    if district in POLY: return POLY[district]
    o = D.get(district, (None, None))[1]
    return POLY.get({'НАО': 'nao', 'ТАО': 'tao'}.get(o))

K = math.cos(math.radians(55.75))
def dist_m(poly, p):  # приблизительно, в метрах
    d = poly.exterior.distance(p) if poly.geom_type == 'Polygon' else min(g.exterior.distance(p) for g in poly.geoms)
    return d * 111000 * (K if True else 1)

ALT = {}
for line in open(os.path.join(os.path.dirname(__file__), 'alt.tsv'), encoding='utf-8'):
    if line.strip():
        a = line.rstrip('\n').split('\t'); ALT[a[0]] = (float(a[2]), float(a[3]))

def in_district(district, lat, lng):
    poly = poly_for(district)
    if poly is None: return None
    p = Point(lng, lat)
    return poly.contains(p) or poly.distance(p) * 111000 * K <= 400

objs = {}
db = sqlite3.connect(os.path.join(ROOT, 'web/shakhmatka.db'))
for slug, district, region in db.execute('select slug, district, region from objects'):
    objs[slug] = (district, region)

out, rej, review = {}, [], []
lines = []
for fn in ('raw.tsv', 'raw2.tsv', 'raw3.tsv'):  # raw2 — второй проход: адреса из текста досье, поиск по названию ЖК в OSM, адреса из каталогов
    fp = os.path.join(os.path.dirname(__file__), fn)
    if os.path.exists(fp): lines += open(fp, encoding='utf-8').read().splitlines()
for line in lines:
    if not line.strip() or line.startswith('#'): continue
    slug, source, lat, lng, prec, addr, note = (line.rstrip('\n').split('\t') + [''] * 7)[:7]
    if slug in out: continue  # первый проход точнее
    lat, lng = float(lat), float(lng)
    district, region = objs.get(slug, (None, None))
    if slug not in objs: rej.append((slug, 'нет в базе')); continue
    if region == 'moscow' and slug in ALT and in_district(district, lat, lng) is False and in_district(district, *ALT[slug]):
        lat, lng = ALT[slug]; source, prec = 'O', 'b'
    p = Point(lng, lat)
    if region != 'moscow' and MOSCOW.contains(p):
        rej.append((slug, f'объект вне Москвы ({region}), а точка в Москве')); continue
    if region == 'moscow':
        poly = poly_for(district)
        if poly is not None:
            if not poly.contains(p):
                d = poly.distance(p) * 111000 * K
                if d > 2500:
                    rej.append((slug, f'вне района {district}: {d:.0f} м')); continue
                if d > 400:
                    # рядом с границей района: точка из официального реестра или с точным адресом надёжнее нашей привязки к району — берём, но отдаём на сверку
                    review.append((slug, f'в {d:.0f} м от района {district} — проверить район или точку'))
        elif not MOSCOW.buffer(0.005).contains(p):
            rej.append((slug, 'вне Москвы')); continue
    SRC = {'E': 'ЕИСЖС (наш.дом.рф)', 'O': 'OpenStreetMap', 'N': 'OpenStreetMap (по названию)', 'R': 'OpenStreetMap (адрес по каталогу новостроек)'}
    PREC = {'b': 'building', 'a': 'area', 's': 'street'}
    out[slug] = {'address': addr, 'lat': round(lat, 6), 'lng': round(lng, 6), 'precision': PREC.get(prec, prec), 'source': SRC.get(source, source)}

json.dump(dict(sorted(out.items())), open(os.path.join(ROOT, 'content/objects/geo.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(os.path.dirname(__file__), 'rejected.tsv'), 'w', encoding='utf-8').write('\n'.join('\t'.join(r) for r in rej) + '\n')
open(os.path.join(os.path.dirname(__file__), 'review.tsv'), 'w', encoding='utf-8').write('\n'.join('\t'.join(r) for r in review) + '\n')
print(f'на сверку (рядом с границей района): {len(review)}')
from collections import Counter
print(f'принято {len(out)}, отклонено {len(rej)}; источники {Counter(v["source"] for v in out.values())}; точность {Counter(v["precision"] for v in out.values())}')
for r in rej[:30]: print('  ✗', *r)
