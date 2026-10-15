#!/usr/bin/env python3
"""Дома «Московских кварталов» (Фонд реновации) по карточкам москварталы.рф → досье.
Вход: pipeline/mk/posts/houses.json (parse-posts.py). Выход:
  content/objects/dossiers/mk-*.json — новые дома и обогащение уже заведённых mk-досье;
  content/objects/facts.json — цена «от» и за м² по последним размещениям;
  pipeline/mk/posts/report.json — что сделано.
Источник фактов — карточки домов и квартир на москварталы.рф; дата размещения — когда квартиры дома впервые замечены в продаже (не позднее)."""
import json, re, os, glob
ROOT = '/home/claude'
D = f'{ROOT}/content/objects/dossiers'
H = json.load(open(f'{ROOT}/pipeline/mk/posts/houses.json'))
MON = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
MONG = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
MONP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре']
def mlabel(d): return f'{MON[int(d[5:7]) - 1]} {d[:4]}'
def translit(s):
    t = str.maketrans({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'})
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower().translate(t))).strip('-')
def compact(a):
    a = re.sub(r'\s*\(.*?\)', '', a).replace('г. Москва, ', '')
    a = re.sub(r'\b(ул|ш|пр-кт|пр-д|б-р|пер|наб|ал)\.,?', lambda m: {'ул': ',', 'ш': 'ш.,', 'пр-кт': 'пр-т,', 'пр-д': 'пр.,', 'б-р': 'б-р,', 'пер': 'пер.,', 'наб': 'наб.,', 'ал': 'ал.,'}[m.group(1)], a)
    a = re.sub(r'\bд\.\s*', '', a); a = re.sub(r'\bк\.\s*к\.', 'к.', a); a = re.sub(r',\s*к\.\s*', ' к', a)
    a = re.sub(r',\s*,', ',', re.sub(r'\s+,', ',', re.sub(r'\s{2,}', ' ', a))).strip(' ,')
    return a
def akey(a):
    a = (a or '').lower().replace('ё', 'е'); a = re.sub(r'\(.*?\)', '', a)
    a = re.sub(r'\b(г|москва|ул|д|к|пр-д|пр-кт|ш|б-р|влд|вл|з/у|стр|корп|пер|наб|ал|п|пос)\.?(?=[\s,\d]|$)', ' ', a)
    return re.sub(r'[^a-zа-я0-9/]+', '', a)
def pl(n, a, b, c): return a if n % 10 == 1 and n % 100 != 11 else b if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14 else c
def th(x): return f'{round(x / 1000):,}'.replace(',', ' ')
def mln(x): return str(round(x / 1e6, 1)).replace('.', ',')
# районы
DK = {}
for line in open(f'{ROOT}/pipeline/districts-fill/districts-list.txt'):
    for name, key in re.findall(r'([А-ЯЁа-яё \-]+?) = ([a-z0-9-]+)', line.split(':', 1)[1]): DK[name.strip().replace('ё', 'е')] = key
DK.update({'Троицк': 'troitsk'})
AMBIG = {'Коммунарка', 'Внуково', 'Щербинка', 'Филимонковский', 'Вороново', 'Бекасово', 'Краснопахорский'}  # районы ТиНАО с 2024 года — у нас ключи по прежним поселениям
def district(h):
    dl = (h.get('district_line') or '').split(',')[-1].strip().replace('ё', 'е')
    if not dl or dl in AMBIG: return None
    return DK.get(dl)
# уже заведённые mk-досье и объекты базы
MK = {}
for f in glob.glob(f'{D}/mk-*.json'):
    d = json.load(open(f))
    if 'портале «Московские кварталы» (Московский фонд реновации)' in d.get('_readme', ''): continue
    for s in [d['zu'], d['name'], *d.get('aliases', [])]: MK.setdefault(akey(re.sub(r'^(ЖК|Московские кварталы,)\s*', '', s)), d['slug'])
LINK = {'кусковская12/1': 'kuskovskaya-12', 'славянский1а': 'kvartal-triumfalnyy', 'боровский1': 'mk-borovskiy-proezd-1', 'новочеремушкинская41а': 'mk-novocheremushkinskaya-z-u-41-1a', 'никитинская213': 'mk-nikitinskaya-vl-21'}   # проверено вручную: тот же дом
SKIP = {'нижегородская74'}   # карточки дома нет, одна квартира — совпадение с ЖК «Н74» не подтверждено
MERGE = {'яворки16': 'яворки156', 'генералапилипенко11': 'генералапилипенко1123', 'генералапилипенко12': 'генералапилипенко1123'}
G = {}
for h in H:
    k = akey(h['address']); k = MERGE.get(k, k)
    if k in G:
        g = G[k]
        for f in ('posts', 'flats', 'price_changes', 'auctions'): g.setdefault(f, []).extend(h.get(f) or [])
        for f in ('site_slugs', 'addresses'): g[f] = sorted(set(g.get(f, [])) | set(h.get(f, [])))
        g['address'] = max(g['address'], h['address'], key=len) if 'подъезд' not in h['address'] else g['address']
        for f, v in h.items():
            if f not in g or g[f] in (None, '', []): g[f] = v
    else: G[k] = dict(h)
F = json.load(open(f'{ROOT}/content/objects/facts.json'))
rep = {'new': [], 'enriched': [], 'linked': [], 'skipped': []}
ROWS = []
for k, h in sorted(G.items()):
    if k in SKIP: rep['skipped'].append(h['address']); continue
    fl = sorted(h.get('flats') or [], key=lambda f: f['date'])
    slugs = h.get('site_slugs') or []
    url = f'https://москварталы.рф/obekty/{slugs[0]}/' if slugs else 'https://москварталы.рф/'
    first = min([f['date'] for f in fl] + [p['date'] for p in h.get('posts', [])] + [a['date'] for a in h.get('auctions', [])] or ['2026-10-15'])
    last_m = max(f['date'] for f in fl)[:7] if fl else None
    lastf = [f for f in fl if f['date'][:7] == last_m]
    tl = []
    st = (h.get('status') or '').lower()
    year = re.search(r'(20\d\d)', h.get('completion') or '')
    done = st.startswith(('заверш', 'введ', 'сдан', 'идёт засел', 'идет засел'))
    if year and done:
        tl.append({'date': f'{year.group(1)}-12-31', 'dateLabel': f'{year.group(1)} год', 'kind': 'construction', 'title': 'Дом введён в эксплуатацию', 'certainty': 'fact'})
    ff = [f for f in fl if f['date'][:7] == first[:7]]
    pr = f': от {th(min(f["ppm"] for f in ff))} тыс. ₽ за м²' if ff else ''
    tl.append({'date': first, 'dateLabel': mlabel(first), 'kind': 'sales', 'title': f'Квартиры дома выставлены на продажу на портале «Московские кварталы»{pr}', 'certainty': 'fact'})
    auc = sorted(h.get('auctions') or [], key=lambda a: a['date']) or ([{'date': f['date']} for f in fl if f['auction']][:1])
    if auc: tl.append({'date': auc[0]['date'], 'dateLabel': mlabel(auc[0]['date']), 'kind': 'tender', 'title': 'Часть квартир дома продаётся через аукцион', 'certainty': 'fact'})
    for c in h.get('price_changes') or []:
        if c.get('avg_pct') is not None and abs(c['avg_pct']) >= 5 and (c.get('n') or 0) >= 5:
            tl.append({'date': c['date'], 'dateLabel': mlabel(c['date']), 'kind': 'price', 'title': f'Фонд {"поднял" if c["avg_pct"] > 0 else "снизил"} цены на {c["n"]} {pl(c["n"], "квартиру", "квартиры", "квартир")} в среднем на {str(abs(c["avg_pct"])).replace(".", ",")}%', 'certainty': 'fact'})
    # описание
    bits = []
    fn, fl_ = h.get('flats_total'), h.get('floors')
    dist = district(h)
    fmax = int(re.findall(r'\d+', fl_)[-1]) if fl_ and re.search(r'\d', fl_) else None
    head = 'Жилой дом' + (f' на {fn} {pl(int(fn), "квартиру", "квартиры", "квартир")}' if fn else '') + (f' ({fl_.replace("-", "–")} {pl(fmax, "этаж", "этажа", "этажей")})' if fmax else '')
    if year and done: head += f', введён в {year.group(1)} году'
    elif st.startswith('стро'): head += ', строится' + (f', ввод — {h["completion"].strip()}' if h.get('completion') else '')
    if head == 'Жилой дом': head = f'Жилой дом по адресу {compact(h["address"])}'
    bits.append(head + '.')
    fin = (h.get('finish') or '').strip()
    if fin: bits.append({'отделка по стандарту реновации': 'Отделка по стандарту реновации.', 'готовая отделка': 'Квартиры с отделкой.', 'без отделки': 'Квартиры без отделки.', 'отделка: стандартная': 'Отделка стандартная.'}.get(fin.lower(), f'{fin[0].upper()}{fin[1:]}.'))
    sale = 'Квартиры продаёт Московский фонд реновации на портале «Московские кварталы» (москварталы.рф)'
    if lastf:
        y, m = int(last_m[:4]), int(last_m[5:])
        sale += f': в {MONP[m - 1]} {y} года — от {th(min(f["ppm"] for f in lastf))} тыс. ₽ за м², лоты от {mln(min(f["price"] for f in lastf))} млн ₽'
    bits.append(sale + '.')
    if h.get('family_mortgage', '').lower().startswith('да'): bits.append('Доступна семейная ипотека.')
    mt = [re.sub(r'^м\.\s*', '', x).strip() for x in (h.get('metro') or []) if not x.startswith('До метро')]
    if mt: bits.append('Метро: ' + ', '.join(re.sub(r'\s*—\s*(\d+) мин\.?', r' (\1 мин.)', x) for x in mt) + '.')
    summary = ' '.join(bits)
    src = f'Карточка дома на портале «Московские кварталы»: {url}'
    target = LINK.get(k) or MK.get(k)
    if target and not os.path.exists(f'{D}/{target}.json'):   # архивный объект — только цены
        rep['linked'].append({'address': h['address'], 'slug': target})
    elif target:
        d = json.load(open(f'{D}/{target}.json'))
        keep = [t for t in d['timeline'] if 'значится в каталогах' not in t['title'] and 'на открытом рынке под брендом' not in t['title'] and 'портале «Московские кварталы»' not in t['title']]
        have = {(t['date'][:4], t['kind']) for t in keep if t['kind'] == 'construction'}
        d['timeline'] = sorted(keep + [t for t in tl if not (t['kind'] == 'construction' and (t['date'][:4], 'construction') in have)], key=lambda t: t['date'])
        if target.startswith('mk-'):
            d['summary'] = summary if h.get('flats_total') else re.sub(r'\s*(Каталоги относят|Квартиры продаёт Московский фонд).*$', '', d['summary']).replace('Жилой дом Московского фонда реновации по адресу', 'Жилой дом по адресу').strip() + ' ' + sale + '.'
            if done: d['stage'] = 'completed'
            elif d.get('stage') in (None, 'permit', 'land', 'concept'): d['stage'] = 'sales'
            if not d.get('district') and dist: d['district'] = dist
        else:
            if 'Московские кварталы' not in d['summary']: d['summary'] = d['summary'].rstrip('.') + '. ' + sale + '.'
        if 'москварталы.рф' not in d.get('_readme', ''): d['_readme'] = (d.get('_readme', '') + f' Дополнено 15.10.2026 по карточке дома на москварталы.рф: {url}').strip()
        json.dump(d, open(f'{D}/{target}.json', 'w'), ensure_ascii=False, indent=2)
        rep['enriched'].append(target)
    else:
        name = compact(h['address'])
        target = 'mk-' + translit(name)
        d = {'_readme': f'Ручное досье (15.10.2026) по карточке дома на портале «Московские кварталы» (Московский фонд реновации): {url}',
             'slug': target, 'name': name, 'zu': name, 'aliases': sorted({f'Московские кварталы, {name}', *[compact(a) for a in h.get('addresses', []) if compact(a) != name]}),
             'region': 'moscow', 'district': dist, 'stage': 'completed' if done else 'sales', 'developer': 'fond-renovatsii', 'summary': summary,
             'timeline': sorted(tl, key=lambda t: t['date'])}
        if not dist: d.pop('district')
        json.dump(d, open(f'{D}/{target}.json', 'w'), ensure_ascii=False, indent=2)
        rep['new'].append(target)
    ff_first = [f for f in fl if f['date'][:7] == first[:7]]
    ROWS.append({'slug': target, 'name': compact(h['address']) if not target.startswith(('kuskovskaya', 'kvartal')) else None, 'district': dist or (json.load(open(f'{D}/{target}.json')).get('district') if os.path.exists(f'{D}/{target}.json') else None),
        'done': bool(year and done), 'building': st.startswith('стро'), 'year': int(year.group(1)) if year else None, 'completion': (h.get('completion') or '').strip() or None,
        'flats': int(fn) if fn else None, 'floors': fl_, 'finish': fin or None, 'family': (h.get('family_mortgage') or '').lower().startswith('да'), 'metro': mt[:2],
        'first': first, 'ppmFirst': round(min(f['ppm'] for f in ff_first)) if ff_first else None,
        'nowMonth': last_m, 'ppmNow': round(min(f['ppm'] for f in lastf)) if lastf else None, 'ppmMax': round(max(f['ppm'] for f in lastf)) if lastf else None,
        'priceNow': round(min(f['price'] for f in lastf) / 1e6, 2) if lastf else None, 'auction': bool(auc), 'posted': len(fl), 'url': url})
    if lastf:
        F['objects'].setdefault(target, {}).update({'priceFrom': round(min(f['price'] for f in lastf) / 1e6, 1), 'priceM2From': round(min(f['ppm'] for f in lastf) / 1000, 1),
            'priceAsOf': mlabel(last_m + '-01'), 'priceSource': 'портал «Московские кварталы» (москварталы.рф)'})
json.dump(F, open(f'{ROOT}/content/objects/facts.json', 'w'), ensure_ascii=False, indent=1)
json.dump(ROWS, open(f'{ROOT}/pipeline/mk/posts/page-rows.json', 'w'), ensure_ascii=False, indent=1)
json.dump(rep, open(f'{ROOT}/pipeline/mk/posts/report.json', 'w'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in rep.items()}, rep['linked'], rep['skipped'])
