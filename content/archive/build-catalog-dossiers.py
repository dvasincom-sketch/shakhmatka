"""
Недостающие проекты застройщика из открытых каталогов → ручные досье.
Вход: pipeline/dev-catalog/<застройщик>.json (бриф pipeline/dev-catalog/BRIEF.md); берутся проекты без our_slug, у которых есть стадия.
Выход: content/objects/dossiers/<застройщик>-<slug>.json, цены — content/objects/facts.json, классы — pipeline/classes/out-cat-<застройщик>.json.
  python3 content/archive/build-catalog-dossiers.py pik
"""
import json, re, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
dev = sys.argv[1]
P = json.load(open(f'{ROOT}/pipeline/dev-catalog/{dev}.json'))
DISTRICT_FIX = {'Черняховского, 19': 'aeroport'}  # улица целиком в одном районе
DEVNAME = {d['slug']: d['name'] for d in json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))['developers']}.get(dev, dev)
def translit(s):
    t = str.maketrans({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'})
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower().translate(t))).strip('-')
CLS = {'комфорт': 'comfort', 'бизнес': 'business', 'премиум': 'premium', 'элитный': 'deluxe', 'делюкс': 'deluxe'}
F = json.load(open(f'{ROOT}/content/objects/facts.json'))
made, classes = [], []
for p in P['projects']:
    if p.get('our_slug') or p.get('stage') not in ('sales', 'completed', 'permit'): continue
    name = p['name']; zu = p.get('zu') or name
    slug = f'{dev}-' + translit(re.sub(r'^ЖК\s+', '', name))
    tl = []
    comp = p.get('completion') or ''
    years = re.findall(r'(20\d\d)', comp)
    if p['stage'] == 'completed':
        if years: tl.append({'date': f'{years[-1]}-12-31', 'dateLabel': f'{years[-1]} год' if len(years) == 1 else f'{years[0]}–{years[-1]} годы', 'kind': 'construction', 'title': 'Дома проекта введены в эксплуатацию' if len(years) > 1 else 'Проект сдан', 'certainty': 'fact'})
        # год сдачи неизвестен — без события: иначе сданный дом выглядел бы свежей новостью в лентах и рассылке
    else:
        price = f', от {str(p["price_from_mln"]).replace(".", ",")} млн ₽' if p.get('price_from_mln') else ''
        tl.append({'date': '2026-10-15', 'dateLabel': 'октябрь 2026', 'kind': 'sales', 'title': f'Идут продажи{price}', 'certainty': 'fact'})
    bits = [f'Жилой комплекс {DEVNAME}' + (f' по адресу {p["address"].split(" (")[0]}' if p.get('address') and not p['address'].startswith('м.') else '') + '.']
    if p.get('buildings'): bits.append(f'По данным каталогов: {re.sub(r"\s*\(.*?\)", "", p["buildings"])}.')
    bits.append({'completed': 'Проект сдан.', 'sales': 'Продажи идут.', 'permit': 'Получено разрешение на строительство.'}[p['stage']])
    d = {'_readme': f'Ручное досье (15.10.2026) по каталогам новостроек: {", ".join(p.get("sources") or [])}. Добавлено, чтобы портфель застройщика в базе был полным; в архиве редакции о проекте не писали.',
         'slug': slug, 'name': name, 'zu': zu, 'aliases': [a for a in {p.get('zu'), f'ЖК {name}'} if a and a != name], 'region': 'moscow',
         'district': p.get('district') or DISTRICT_FIX.get(zu), 'stage': p['stage'], 'developer': dev, 'summary': ' '.join(bits), 'timeline': tl}
    if not d['district']: d.pop('district')
    json.dump(d, open(f'{ROOT}/content/objects/dossiers/{slug}.json', 'w'), ensure_ascii=False, indent=2)
    made.append(slug)
    cl = CLS.get((p.get('class') or '').lower().split(' ')[0])
    if cl and p.get('sources'): classes.append({'slug': slug, 'class': cl, 'basis': 'catalog', 'source': p['sources'][0], 'evidence': f'класс в каталоге: {p["class"]}'})
    if p['stage'] == 'sales' and p.get('price_from_mln'):
        F['objects'].setdefault(slug, {}).update({'priceFrom': p['price_from_mln'], 'priceAsOf': p.get('price_as_of') or 'октябрь 2026', 'priceSource': 'каталог новостроек'})
json.dump(F, open(f'{ROOT}/content/objects/facts.json', 'w'), ensure_ascii=False, indent=1)
json.dump(classes, open(f'{ROOT}/pipeline/classes/out-cat-{dev}.json', 'w'), ensure_ascii=False, indent=1)
print(f'{dev}: досье {len(made)} — {", ".join(made)}; классов {len(classes)}')
