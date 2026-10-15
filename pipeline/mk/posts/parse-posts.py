#!/usr/bin/env python3
"""Разбор выгрузки постов-мониторинга сайта «Московских кварталов» (москварталы.рф) → houses.json.
Каждый пост ссылается на карточку дома на москварталы.рф — она и есть источник; сам мониторинг в публикациях не упоминаем.
Вход: /mnt/user-data/uploads/moskvartaly/*.md (выгрузка у пользователя: ~/tg_parser/output/moskvartaly)."""
import re, json, glob, os, collections
SRC = '/mnt/user-data/uploads/moskvartaly'
OUT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://москварталы.рф'
def site_slug(text):
    m = re.search(r'xn--80aae5aibotfo5h\.xn--p1ai/(?:obekty|apartments/house)/([a-z0-9\-]+)', text)
    return m.group(1) if m else None
def num(s): return float(s.replace(' ', '').replace(' ', '').replace(',', '.'))
def norm_addr(a):
    a = re.sub(r'\*', '', a).strip()
    a = re.sub(r'^(г\. Москва, |ЖК )', '', a)
    return a.strip()
H = {}   # slug -> house
def akey(a):
    a = (a or '').lower().replace('ё', 'е')
    a = re.sub(r'\(.*?\)', '', a)
    a = re.sub(r'\b(ул|д|к|пр-д|пр-кт|ш|б-р|влд|вл|з/у|стр|корп|пер|наб|ал|п|пос)\.?(?=[\s,\d]|$)', ' ', a)
    return re.sub(r'[^a-zа-я0-9/]+', '', a)
def house(slug, addr):
    k = akey(addr) or slug
    h = H.setdefault(k, {'key': k, 'site_slugs': set(), 'address': addr, 'addresses': set(), 'posts': [], 'flats': [], 'price_changes': []})
    if addr: h['addresses'].add(addr)
    if slug: h['site_slugs'].add(slug)
    return h
posts = sorted(glob.glob(f'{SRC}/*.md'), key=lambda p: int(re.search(r'_(\d+)_', os.path.basename(p)).group(1)))
stats = collections.Counter()
for p in posts:
    t = open(p, encoding='utf8').read()
    date = re.search(r'^date: (\S+)', t, re.M).group(1)[:10]
    pid = int(re.search(r'^id: (\d+)', t, re.M).group(1))
    kind = os.path.basename(p).split('_', 2)[2][:-3]
    body = t.split('---', 2)[2]
    stats[kind] += 1
    if kind.startswith('новый-объект') or (kind.startswith('новые-квартиры') and 'аукцион' not in kind) or kind.startswith('квартиры-переопубликованы'):
        m = re.search(r'🏡 \*\*(?:Адрес:\*\* )?(.+?)(?:\*\*)?\n', body)
        addr = norm_addr(m.group(1)) if m else None
        head = body.split('━━━')[0] if kind.startswith('новые') or kind.startswith('квартиры') else body.split('━━━━')[0]
        slug = site_slug(head) or site_slug(body)
        if not slug: stats['no-slug'] += 1; continue
        h = house(slug, addr)
        h['posts'].append({'id': pid, 'date': date, 'kind': kind})
        g = lambda rx: (re.search(rx, head) or [None, None])[1]
        if kind.startswith('новый-объект'):
            h['first_object_post'] = h.get('first_object_post') or date
            info = {'district_line': g(r'📍 Район: (.+)'), 'floors': g(r'Этажность: (.+)'), 'flats_total': g(r'Квартир: (\d+)'),
                    'completion': g(r'Ввод в эксплуатацию: (.+?)\s*\n'), 'status': g(r'Статус: (.+)'), 'finish': g(r'🔧 (.+)'),
                    'family_mortgage': g(r'Семейная ипотека: (.+)'), 'metro': re.findall(r'🚇 (.+)', head)}
            for k, v in info.items():
                if v: h[k] = v.strip() if isinstance(v, str) else v
        else:
            d = g(r'\n📍 ([^\[\n].+)')
            if d and not h.get('district_line'): h['district_line'] = d.strip()
        for fm in re.finditer(r'🏠 (\S+?)(?:-комнатная квартира| квартира|-комн\.?)?(?: квартира)?, ([\d,]+) кв\.м\n🏢 Этаж: (\d+)\n💰 ([\d  ]+) ₽\n📊 ([\d  ]+) ₽/м²(.*?)(?=\n\n|\Z)', body, re.S):
            rooms, area, floor, price, ppm, rest = fm.groups()
            h['flats'].append({'date': date, 'post': pid, 'rooms': rooms, 'area': num(area), 'floor': int(floor), 'price': num(price), 'ppm': num(ppm),
                               'auction': 'Аукцион' in rest, 'kind': 'relist' if kind.startswith('квартиры') else 'new'})
    elif kind.startswith('новые-квартиры-с-аукционом'):
        for m in re.finditer(r'(🆕|🏡) \[(.+?)\]\(.*?\) \(\+(\d+)\)', body):
            h = house(None, norm_addr(m.group(2)))
            h.setdefault('auctions', []).append({'date': date, 'n': int(m.group(3)), 'new_object': m.group(1) == '🆕'})
    elif kind.startswith('изменение-цен'):
        for blk in re.split(r'\n(?=🏡)', body):
            slug = site_slug(blk)
            if not slug: continue
            m = re.search(r'🏡 \*\*(.+?)\*\*', blk)
            h = house(slug, norm_addr(m.group(1)) if m else None)
            avg = re.search(r'Среднее изменение: \*\*([+\-−]?[\d.,]+)%\*\*', blk); n = re.search(r'Изменились цены: \*\*(\d+)', blk)
            if avg: h['price_changes'].append({'date': date, 'avg_pct': num(avg.group(1).replace('−', '-')), 'n': int(n.group(1)) if n else None})
for h in H.values():
    h['addresses'] = sorted(h['addresses']); h['site_slugs'] = sorted(h['site_slugs'])
    h['url'] = f"{SITE}/obekty/{h['site_slugs'][0]}/" if h['site_slugs'] else None
    if not h.get('address') and h['addresses']: h['address'] = h['addresses'][0]
    fl = h['flats']
    if fl:
        h['first_listing'] = min(f['date'] for f in fl)
        h['last_listing'] = max(f['date'] for f in fl)
        last = [f for f in fl if f['date'] >= h['last_listing'][:7]]  # последний месяц размещений
        h['ppm_range_all'] = [min(f['ppm'] for f in fl), max(f['ppm'] for f in fl)]
        h['last_month'] = {'month': h['last_listing'][:7], 'ppm_min': min(f['ppm'] for f in last), 'ppm_max': max(f['ppm'] for f in last), 'price_min': min(f['price'] for f in last), 'n': len(last)}
        h['n_flats_posted'] = len(fl)
        h['auction_share'] = round(sum(f['auction'] for f in fl) / len(fl), 2)
json.dump(sorted(H.values(), key=lambda h: h['key']), open(f'{OUT}/houses.json', 'w'), ensure_ascii=False, indent=1)
print(len(posts), 'постов;', dict(stats)); print('домов', len(H), '; с карточкой объекта', sum(1 for h in H.values() if h.get('first_object_post')), '; с квартирами', sum(1 for h in H.values() if h['flats']), '; квартир', sum(len(h['flats']) for h in H.values()))
