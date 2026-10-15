"""Ручные досье домов Московского фонда реновации («Московские кварталы») из pipeline/mk/projects.json → content/objects/dossiers/mk-*.json,
правки существующих объектов → content/objects/corrections.json, классы → pipeline/classes/out-mk.json, цены → content/objects/facts.json."""
import json, re, os
ROOT = '/home/claude'
P = json.load(open(f'{ROOT}/pipeline/mk/projects.json'))
# район — только где назвал каталог или улица целиком в одном районе
DISTRICT = {'Клинская, 2А к7': 'khovrino', 'Родниковая, 4А': 'solntsevo', '3-я Прядильная, вл. 4': 'izmaylovo', '3-я Прядильная, з/у 10': 'izmaylovo',
            '3-я Прядильная, з/у 14': 'izmaylovo', '2-я Фрезерная, з/у 6': 'nizhegorodskiy'}
SKIP = {'Амурская, 1 к1'}  # совпадение с нашим участком amurskaya-1 не подтверждено — разберём отдельно
def translit(s):
    t = str.maketrans({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'})
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower().translate(t))).strip('-')
def dmy(s):
    m = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', s or ''); return f'{m.group(3)}-{m.group(2)}-{m.group(1)}' if m else None
def pl(n, a, b, c):
    return a if n % 10 == 1 and n % 100 != 11 else b if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14 else c
CLS = {'комфорт': 'comfort', 'бизнес': 'business', 'премиум': 'premium'}
classes, made = [], []
F = json.load(open(f'{ROOT}/content/objects/facts.json'))
C = json.load(open(f'{ROOT}/content/objects/corrections.json'))
for p in P['projects']:
    zu = p['zu']
    if zu in SKIP: continue
    if p.get('our_slug'):
        slug = p['our_slug']
        c = C.setdefault(slug, {})
        prev = c.get('previousDevelopers') or []
        c.update({'developer': 'fond-renovatsii', 'developerName': 'Фонд реновации', 'previousDevelopers': sorted(set(prev + ['pik'])),
                  'note': (c.get('note', '') + '; дом Фонда реновации («Московские кварталы») по карточке Яндекс Недвижимости, ' + p['sources'][0]).strip('; ')})
        if p.get('stage'): c['stage'] = p['stage']
    else:
        slug = 'mk-' + translit(zu)
        tl = []
        for label, kind, rx in [('Выдано разрешение на строительство', 'permit', r'РНС (\d{2}\.\d{2}\.\d{4})'), ('Опубликована проектная декларация', 'sales', r'ПД (\d{2}\.\d{2}\.\d{4})'),
                                ('Дом введён в эксплуатацию', 'construction', r'акт ввода[^\d]*(\d{2}\.\d{2}\.\d{4})')]:
            m = re.search(rx, (p.get('notes') or '') + ' ' + (p.get('completion') or ''))
            if m: tl.append({'date': dmy(m.group(1)), 'kind': kind, 'title': label + (f' (корпус по адресу {zu})' if kind == 'construction' else ''), 'certainty': 'fact'})
        if p.get('open_market') == 'confirmed' or p.get('stage') == 'sales':
            tl.append({'date': '2026-10-15', 'dateLabel': 'октябрь 2026', 'kind': 'sales', 'title': 'Квартиры продаются на открытом рынке под брендом «Московские кварталы»' + (f', от {str(round(p["price_from_mln"], 1)).replace(".", ",")} млн ₽' if p.get('price_from_mln') and p.get('open_market') == 'confirmed' else ''), 'certainty': 'fact'})
        if not tl: tl.append({'date': '2026-10-15', 'dateLabel': 'октябрь 2026', 'kind': 'other', 'title': 'Дом Фонда реновации значится в каталогах в линейке «Московские кварталы»', 'certainty': 'fact'})
        bits = [f'Жилой дом Московского фонда реновации по адресу {p["address"].replace("Москва, ", "")}.']
        b = p.get('buildings') or ''
        fl = re.search(r'(?:до )?(\d+(?:–\d+)?) эт', b); fl = fl.group(0).replace(' эт', '') if fl else None
        ap = re.search(r'(\d[\d\s]*) квартир', b); ap = ap.group(1).replace(' ', '').replace('\u00a0', '') if ap else None
        if fl or ap: bits.append('По данным каталога — ' + ', '.join(x for x in [f'{ap} {pl(int(ap), "квартира", "квартиры", "квартир")}' if ap else None, f'{fl} этажей' if fl else None] if x) + '.')
        bits.append('Часть квартир фонд продаёт на открытом рынке под брендом «Московские кварталы».' if p.get('open_market') == 'confirmed' else 'Каталоги относят дом к линейке «Московские кварталы»; продажа квартир самим фондом на дату проверки не подтверждена.')
        d = {'_readme': 'Ручное досье (15.10.2026) по карточкам каталогов: ' + ', '.join(p['sources'][:3]), 'slug': slug, 'name': zu, 'zu': zu,
             'aliases': [p['name'], f'Московские кварталы, {zu}'], 'region': 'moscow', 'district': p.get('district') or DISTRICT.get(zu), 'stage': p.get('stage'),
             'developer': 'fond-renovatsii', 'summary': ' '.join(bits), 'timeline': sorted(tl, key=lambda t: t['date'])}
        if not d['district']: d.pop('district')
        json.dump(d, open(f'{ROOT}/content/objects/dossiers/{slug}.json', 'w'), ensure_ascii=False, indent=2)
        made.append(slug)
    cl = CLS.get((p.get('class') or '').split(' ')[0])
    if cl: classes.append({'slug': slug, 'class': cl, 'basis': 'catalog', 'source': p['sources'][0], 'evidence': f'класс в карточке каталога: {p["class"]}'})
    if p.get('open_market') == 'confirmed' and p.get('price_from_mln'):
        o = F['objects'].setdefault(slug, {})
        o.update({'priceFrom': round(p['price_from_mln'], 1), 'priceAsOf': 'октябрь 2026', 'priceSource': 'Яндекс Недвижимость, лоты застройщика'})
    if p.get('completion') and re.search(r'кв\. 20\d\d', p['completion']) and p.get('stage') != 'completed':
        F['objects'].setdefault(slug, {})['completion'] = re.search(r'(\d) кв\. (20\d\d)', p['completion']).expand(r'\g<1> кв. \2').replace('1 кв', 'I кв').replace('2 кв', 'II кв').replace('3 кв', 'III кв').replace('4 кв', 'IV кв')
# подтверждённые операторы КРТ из проверки наших объектов
for r in json.load(open(f'{ROOT}/pipeline/mk/our-objects-out.json')):
    if r.get('developer') == 'fond-renovatsii' and r.get('source'):
        c = C.setdefault(r['slug'], {}); c.update({'developer': 'fond-renovatsii', 'developerName': 'Фонд реновации'})
        c['note'] = (c.get('note', '') + f'; Фонд реновации — {r.get("role") or "оператор"} по {r["source"]}').strip('; ')
json.dump(C, open(f'{ROOT}/content/objects/corrections.json', 'w'), ensure_ascii=False, indent=1)
json.dump(F, open(f'{ROOT}/content/objects/facts.json', 'w'), ensure_ascii=False, indent=1)
json.dump(classes, open(f'{ROOT}/pipeline/classes/out-mk.json', 'w'), ensure_ascii=False, indent=1)
print('досье:', len(made), 'классов:', len(classes))
