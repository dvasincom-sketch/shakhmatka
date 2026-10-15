"""
Авто-досье из разметки архива: registry.json → ../objects/archive-dossiers.json
  python3 build-dossiers.py
Берёт объекты Москвы и области с ≥3 событиями (без прогнозов), собирает карточку, хронологию с пометками
«факт / сигнал», стадию по достигнутым событиям, застройщика и район. Ручные досье не трогает:
для них только дописывается хронология, если в базе она пустая (см. MANUAL).
"""
import unicodedata, json, re, os, difflib, collections
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, 'registry.json')))
M = {int(k): v for k, v in json.load(open(os.path.join(HERE, 'notes_marked.json'))).items()}
ND = {int(k): v for k, v in json.load(open(os.path.join(HERE, 'note-dates.json'))).items()}
DISP = json.load(open(os.path.join(HERE, 'key-display.json')))
MIN_EVENTS = 3
MIN_EVENTS_RECENT = 2
RECENT_FROM = '2025-01-01'

# ручные досье: ключ участка → slug в базе
MANUAL = {
    '1-й грайвороновский, 3': 'volzhskiy-park', 'ленинградский, 57': 'severnyy-port',
    'автозаводская, 22': 'danilovskiy-ot-granel', '3-й силикатный, 1': 'silika', 'большая ордынка, 25': 'bolshaya-ordynka-25',
}

TR = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя', ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya']))
def slugify(s):
    # латиница с ударением → без (ГАЛÁ → ГАЛА); кириллицу не трогаем (й, ё)
    s = ''.join(ch if '\u0400' <= ch <= '\u04ff' else ''.join(c for c in unicodedata.normalize('NFD', ch) if not unicodedata.combining(c)) for ch in s)
    s = ''.join(TR.get(ch, ch) for ch in s.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:70].strip('-')

# ---------- районы Москвы: название → (ключ, округ) ----------
OKRUGS = {
    'ЦАО': 'Арбат Басманный Замоскворечье Красносельский Мещанский Пресненский Таганский Тверской Хамовники Якиманка',
    'САО': 'Аэропорт Беговой Бескудниковский Войковский Восточное_Дегунино Головинский Дмитровский Западное_Дегунино Коптево Левобережный Молжаниновский Савёловский Сокол Тимирязевский Ховрино Хорошёвский',
    'СВАО': 'Алексеевский Алтуфьевский Бабушкинский Бибирево Бутырский Лианозово Лосиноостровский Марфино Марьина_Роща Останкинский Отрадное Ростокино Свиблово Северное_Медведково Северный Южное_Медведково Ярославский',
    'ВАО': 'Богородское Вешняки Восточное_Измайлово Восточный Гольяново Ивановское Измайлово Косино-Ухтомский Метрогородок Новогиреево Новокосино Перово Преображенское Северное_Измайлово Соколиная_Гора Сокольники',
    'ЮВАО': 'Выхино-Жулебино Капотня Кузьминки Лефортово Люблино Марьино Некрасовка Нижегородский Печатники Рязанский Текстильщики Южнопортовый',
    'ЮАО': 'Бирюлёво_Восточное Бирюлёво_Западное Братеево Даниловский Донской Зябликово Москворечье-Сабурово Нагатино-Садовники Нагатинский_Затон Нагорный Орехово-Борисово_Северное Орехово-Борисово_Южное Царицыно Чертаново_Северное Чертаново_Центральное Чертаново_Южное',
    'ЮЗАО': 'Академический Гагаринский Зюзино Коньково Котловка Ломоносовский Обручевский Северное_Бутово Тёплый_Стан Черёмушки Южное_Бутово Ясенево',
    'ЗАО': 'Внуково Дорогомилово Крылатское Кунцево Можайский Ново-Переделкино Очаково-Матвеевское Проспект_Вернадского Раменки Солнцево Тропарёво-Никулино Филёвский_Парк Фили-Давыдково',
    'СЗАО': 'Куркино Митино Покровское-Стрешнево Северное_Тушино Строгино Хорошёво-Мнёвники Щукино Южное_Тушино',
    'ЗелАО': 'Матушкино Савёлки Старое_Крюково Силино Крюково',
    'НАО': 'Сосенское Московский Щербинка Внуковское Десёновское Филимонковское Воскресенское Мосрентген Рязановское Кокошкино Марушкинское',
    'ТАО': 'Троицк Киевский Новофёдоровское Первомайское Вороновское Краснопахорское Михайлово-Ярцевское Щаповское Кленовское Роговское',
}
KEEP_KEYS = {'Замоскворечье': 'zamoskvorechye'}  # ключи, уже живущие в базе
DIST = {}
for ok, names in OKRUGS.items():
    for n in names.split():
        n = n.replace('_', ' ')
        DIST[n] = (KEEP_KEYS.get(n) or slugify(n), ok)
def dnorm(s): return s.lower().replace('ё', 'е').replace('  ', ' ').strip()
DIST_N = {dnorm(k): k for k in DIST}
DIST_ALIAS = {
    'выхино': 'Выхино-Жулебино', 'хорошево-мневники': 'Хорошёво-Мнёвники', 'филевский парк': 'Филёвский Парк',
    'южное чертаново': 'Чертаново Южное', 'северное чертаново': 'Чертаново Северное', 'западное бирюлево': 'Бирюлёво Западное',
    'бирюлево западное': 'Бирюлёво Западное', 'бирюлево восточное': 'Бирюлёво Восточное', 'черемушки': 'Черёмушки',
    'теплый стан': 'Тёплый Стан', 'савеловский': 'Савёловский', 'октябрьское поле': None, 'саларьево': 'Московский',
}
MO_TOWNS = {'химки', 'люберцы', 'одинцово', 'одинцовский район', 'красногорск', 'мытищи', 'котельники', 'пушкино', 'нахабино', 'балашиха', 'подольск', 'реутов', 'долгопрудный', 'видное', 'лобня', 'дзержинский'}
def district_of(raw):
    n = dnorm(raw)
    if n in DIST_ALIAS:
        v = DIST_ALIAS[n]; return v
    return DIST_N.get(n)
def name_in(n):
    special = {'Хамовники': 'в Хамовниках', 'Раменки': 'в Раменках', 'Сокольники': 'в Сокольниках', 'Текстильщики': 'в Текстильщиках',
               'Лефортово': 'в Лефортове', 'Замоскворечье': 'в Замоскворечье', 'Кузьминки': 'в Кузьминках', 'Печатники': 'в Печатниках',
               'Арбат': 'на Арбате', 'Якиманка': 'на Якиманке', 'Щукино': 'в Щукине', 'Митино': 'в Митине', 'Строгино': 'в Строгине',
               'Марьина Роща': 'в Марьиной Роще', 'Крылатское': 'в Крылатском', 'Богородское': 'в Богородском', 'Отрадное': 'в Отрадном',
               'Троицк': 'в Троицке', 'Московский': 'в поселении Московский', 'Сосенское': 'в поселении Сосенское', 'Щербинка': 'в Щербинке', 'Зюзино': 'в Зюзине', 'Перово': 'в Перове', 'Люблино': 'в Люблине', 'Марьино': 'в Марьине'}
    if n in special: return special[n]
    if ' ' not in n and '-' not in n and re.search(r'(ий|ый|ой)$', n): return 'в ' + re.sub(r'(ий|ый|ой)$', 'ом', n) + ' районе'
    return f'в районе {n}'

# ---------- застройщики ----------
DEV_ALIAS = {
    'Капитал Групп': 'Capital Group', '.SENSE': 'Sense', 'Домарф': 'ДОМ.РФ', 'Легенда': 'LEGENDA', 'Страна Девелопмент': 'Страна',
    'St. Michael': 'St Michael', 'Севен Санс': 'Seven Suns Development', 'GRAVION': 'Gravion', 'ВМС Девелопмент': 'BMS Development',
    'Сити-XXI век': 'Сити-XXI век', 'Upside Development': 'Upside', 'Град': 'Град', 'Самолет': 'Самолёт', 'Forma': 'Forma', 'ФОРМА': 'Forma', 'Level': 'Level Group', 'Левел': 'Level Group',
    'МР Груп': 'MR Group', 'MR': 'MR Group', 'Донстрой': 'Донстрой',
}
DEV_SLUG = {'ПИК': 'pik', 'Гранель': 'granel', 'Sezar Group': 'sezar-group', 'Эталон': 'etalon', 'Glorax': 'glorax', 'LEGENDA': 'legenda', 'АФК Система': 'afk-sistema'}
BAD_DEV = {'Москва', 'Правительство Москвы', 'город', 'мэрия', 'Росимущество', 'ДГИ', 'Москомархитектура', 'Капитал', 'Регионы', 'ЭК', 'ЦИ'}
def dev_norm(d):
    d = (d or '').strip(' «»"')
    return DEV_ALIAS.get(d, d)
def dev_slug(d): return DEV_SLUG.get(d) or slugify(d) or None

# ---------- чистка формулировок ----------
CLEAN = [
    (r',?\s*по (данным|информации|сведениям) (нашего )?канала,?\s*', ' '), (r'^По (данным|информации|сообщениям) каналов?,?\s*', ''),
    (r',?\s*по данным инсайдеров,?', ', по данным источников,'), (r'канал ждёт', 'редакция ждёт'), (r'\s*ø+', ''),
    (r'\s+,', ','), (r'\s{2,}', ' '),
]
def clean(t):
    t = t.strip()
    for a, b in CLEAN: t = re.sub(a, b, t, flags=re.I)
    t = t.strip(' ,')
    return t[:1].upper() + t[1:]

MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
def ev_date(e):
    nd = ND.get(e['note'])
    d = e.get('date') or nd
    try:
        y, m, *rest = [int(x) for x in str(d)[:10].split('-')]
        dd = rest[0] if rest else 1
        date(y, m, dd)
        # событие «в будущем» (план, срок ввода) ставим на дату заметки: в хронологии — когда об этом стало известно
        if y < 1990 or (nd and f'{y:04d}-{m:02d}-{dd:02d}' > nd): raise ValueError
    except Exception:
        d = nd; y, m, dd = [int(x) for x in d.split('-')]
        return f'{y:04d}-{m:02d}-{dd:02d}', None
    p = e.get('date_precision') or 'note'
    label = None
    if p == 'month': label = f'{MONTHS[m-1]} {y}'
    elif p == 'year': label = str(y); m, dd = 12, 31
    return f'{y:04d}-{m:02d}-{dd:02d}', label

STAGE_ORDER = ['land', 'concept', 'architecture', 'permit', 'sales', 'completed']
TYPE_STAGE = {'land': 'land', 'krt': 'land', 'tender': 'land', 'concept': 'concept', 'architecture': 'architecture', 'permit': 'permit', 'sales': 'sales', 'price': 'sales'}
def stage_of(events):
    best = -1
    for e in events:
        if e['certainty'] != 'fact': continue
        s = TYPE_STAGE.get(e['type'])
        if e['type'] == 'construction' and re.search(r'\b(ввод|введ|ввёл|ввел|сдан|сдал|ЗОС|заключени[ея] о соответствии)', e['title'], re.I): s = 'completed'
        if e['type'] == 'sales' and re.search(r'офис продаж|готовит|планиру|перенос|отлож', e['title'], re.I): s = None
        if s: best = max(best, STAGE_ORDER.index(s))
    return STAGE_ORDER[best] if best >= 0 else None

# ---------- подтверждения: заметка B подтверждает слух из заметки A ----------
confirmed_by = {}  # note A -> дата B
for nid, r in M.items():
    for a in r.get('confirms') or []:
        if a in ND and nid in ND and ND[nid] > ND[a]:
            confirmed_by[a] = min(confirmed_by.get(a, ND[nid]), ND[nid])

def plural(n, one, few, many):
    a, b = n % 10, n % 100
    return one if a == 1 and b != 11 else few if 2 <= a <= 4 and not 12 <= b <= 14 else many


# второй проход: один проект под разными написаниями — «Luzhniki Collection» = «Collection Luzhniki» = «Коллекция Лужники»,
# «Лужнецкая набережная, 2/4» = «Лужнецкая, 2/4». Склеиваем, только если застройщик совпадает или у одной из записей не указан.
STREET = r'\b(улица|ул|набережная|наб|проезд|пр-д|переулок|пер|шоссе|ш|проспект|пр-т|просп|бульвар|б-р|площадь|пл|тупик|аллея|вал)\b\.?'
STOP = {'zhk', 'kvartal', 'kompleks', 'zhiloy', 'residence', 'rezidents'}
def name_key(n):
    t = slugify(n).split('-')
    t = [x for x in t if len(x) > 1 and x not in STOP]
    return ' '.join(sorted(t)) if len(t) >= 1 and not any(x.isdigit() for x in t) else None
def addr_key(k):
    s = re.sub(STREET, ' ', k.replace('ё', 'е'))
    s = re.sub(r'\s+', ' ', s).strip(' ,')
    s = re.sub(r',\s*(вл|влд|владение|д|дом)\.?\s*(?=\d)', ', ', s)  # «Вернадского, вл. 8А» = «Вернадского, 8А»
    m = re.match(r'^(.+?),\s*([\d][\w/-]*)', s)
    return f'{m.group(1).strip()}|{m.group(2)}' if m else None
def top_dev(o):
    for d, _ in o['devs']:
        d = dev_norm(d)
        if d and d not in BAD_DEV: return d
    return None
parent = {k: k for k in R}
def find(k):
    while parent[k] != k: parent[k] = parent[parent[k]]; k = parent[k]
    return k
# у компоненты — множества адресов и застройщиков: две записи с разными адресами или застройщиками не склеиваем,
# даже через общее название («Союз» Родины на Сельскохозяйственной ≠ завод «Союз» на Лужнецкой)
comp_addr = {k: ({addr_key(k)} - {None}) if not R[k]['byname'] else set() for k in R}
comp_dev = {k: ({top_dev(R[k])} - {None}) if R[k]['devs'] and R[k]['devs'][0][1] >= 2 else set() for k in R}  # застройщик из одного упоминания не в счёт
buckets = collections.defaultdict(list)
for k, o in R.items():
    if not o['byname']:
        a = addr_key(k)
        if a: buckets['a:' + a].append(k)
    for i, (n, c) in enumerate(o['names'][:2]):
        nk = name_key(n)
        if nk and (i == 0 or c >= 2): buckets['n:' + nk].append(k)
def try_union(a, c, b):
    a, c = find(a), find(c)
    if a == c: return True
    # один адрес — один объект, даже если застройщик сменился; по одному названию — только при общем застройщике
    if b.startswith('n:') and comp_dev[a] and comp_dev[c] and not (comp_dev[a] & comp_dev[c]): return False
    # разные адреса допустимы на одной улице (очереди проекта: «Союз» на Сельскохозяйственной, 4 / 12Б / 26)
    streets = lambda S: {x.split('|')[0] for x in S}
    if b.startswith('n:') and comp_addr[a] and comp_addr[c] and not (streets(comp_addr[a]) & streets(comp_addr[c])): return False
    parent[c] = a
    comp_addr[a] |= comp_addr[c]; comp_dev[a] |= comp_dev[c]
    return True
for b, ks in sorted(buckets.items(), key=lambda x: not x[0].startswith('a:')):  # сначала адреса, потом названия
    for i, k in enumerate(ks[1:], 1):
        for j in ks[:i]:
            if try_union(j, k, b): break
fused = collections.defaultdict(list)
for k in R: fused[find(k)].append(k)
merged2 = 0
for root, ks in fused.items():
    if len(ks) < 2: continue
    ks.sort(key=lambda k: (k in MANUAL and -1 or 0, R[k]['byname'], -len(R[k]['events'])))
    head = R[ks[0]]
    for k in ks[1:]:
        o = R.pop(k)
        seen = {(e['note'], e['title']) for e in head['events']}
        head['events'] += [e for e in o['events'] if (e['note'], e['title']) not in seen]
        head['notes'] = sorted(set(head['notes']) | set(o['notes']))
        if not o['byname'] and k != ks[0]:
            head['aliases'] = head['aliases'] + [[DISP.get(k, k), 1]]
        for f in ('names', 'aliases', 'devs', 'districts', 'cities'):
            c = collections.Counter(dict((a, b) for a, b in head[f])); c.update(dict((a, b) for a, b in o[f])); head[f] = c.most_common()
        merged2 += 1
print('слито записей по написанию и адресу', merged2)

# ручное разделение склеенных проектов: события по regex уходят в отдельные досье (corrections.json → split)
CORR = json.load(open(os.path.join(HERE, '..', 'objects', 'corrections.json')))
FORCE = {}  # ключ реестра → {slug, name, zu, developer}
for src_slug, c in CORR.items():
    if not isinstance(c, dict) or not c.get('split'): continue
    src_key = next((k for k, o in R.items() if o['names'] and dnorm(o['names'][0][0]) == dnorm(c['matchName'])), None)
    if not src_key: print('split: не найден', src_slug); continue
    src = R[src_key]; FORCE[src_key] = {'slug': src_slug, 'name': c.get('name'), 'zu': c.get('zu'), 'aliases': c.get('aliases')}
    for part in c['split']:
        rx = re.compile(part['match'], re.I)
        moved = [e for e in src['events'] if rx.search(e['title'])]
        src['events'] = [e for e in src['events'] if not rx.search(e['title'])]
        nk = 'split:' + part['slug']
        R[nk] = {'key': None, 'byname': True, 'notes': sorted({e['note'] for e in moved}), 'events': moved,
                 'names': [[part['name'], 9]], 'aliases': [[a, 1] for a in part.get('aliases', [])], 'devs': [], 'districts': src['districts'],
                 'cities': src['cities'], 'main': len(moved)}
        FORCE[nk] = {'slug': part['slug'], 'name': part['name'], 'zu': part.get('zu'), 'aliases': part.get('aliases')}

objects, devs, places, used_slugs = [], {}, {}, set()
skipped = collections.Counter()
for key, o in R.items():
    evs = [e for e in o['events'] if e['certainty'] != 'forecast' and M.get(e['note'], {}).get('kind') != 'promo']
    # свежие проекты (событие с 2025 года) берём и с двумя событиями: о новом проекте в архиве ещё мало заметок
    recent = max((ev_date(e)[0] for e in evs), default='') >= RECENT_FROM
    if len(evs) < (MIN_EVENTS_RECENT if recent else MIN_EVENTS): continue
    city = o['cities'][0][0] if o['cities'] else 'Москва'
    draw = o['districts'][0][0] if o['districts'] else None
    region = {'Москва': 'moscow', 'Московская область': 'moskovskaya-oblast'}.get(city)
    if draw and dnorm(draw) in MO_TOWNS: region = 'moskovskaya-oblast'
    if not region: skipped['другой регион'] += 1; continue
    dname = district_of(draw) if (draw and region == 'moscow') else None

    addr = None if o['byname'] else DISP.get(key, key)
    names = [n for n, _ in o['names'] if n]
    name = names[0] if names and (o['byname'] or o['names'][0][1] >= 2 or len(o['names']) == 1) else addr
    if not name: skipped['без имени'] += 1; continue
    aliases = []
    for n, _ in o['names'] + o['aliases']:
        n = n.strip(' «»"')
        if n and n != name and n != addr and n not in aliases and len(aliases) < 6: aliases.append(n)
    dev = None
    for d, _ in o['devs']:
        d = dev_norm(d)
        if d and d not in BAD_DEV: dev = d; break

    # хронология: по дате, без дублей (тот же тип в тот же месяц и похожий текст)
    tl = []
    for e in sorted(evs, key=lambda e: (ev_date(e)[0], e['note'])):
        d, label = ev_date(e)
        title = clean(e['title'])
        if len(title) < 12: continue
        if any(t['kind'] == e['type'] and t['date'][:7] == d[:7] and difflib.SequenceMatcher(None, t['title'], title).ratio() > 0.55 for t in tl[-6:]):
            continue
        item = {'date': d, 'kind': e['type'], 'title': title, 'certainty': e['certainty'], 'sourceNote': e['note']}
        if label: item['dateLabel'] = label
        if e['certainty'] == 'signal' and e['note'] in confirmed_by: item['confirmedOn'] = confirmed_by[e['note']]
        tl.append(item)
    if len(tl) < (MIN_EVENTS_RECENT if recent else MIN_EVENTS): skipped['мало после чистки'] += 1; continue

    manual = MANUAL.get(key)
    if key in FORCE:
        f = FORCE[key]; name = f.get('name') or name; addr = f.get('zu') or addr
        if f.get('aliases') is not None: aliases = f['aliases']
    slug = manual or (FORCE[key]['slug'] if key in FORCE else slugify(name))
    if not manual and (slug in used_slugs or slug in MANUAL.values()):
        slug = slugify(f'{name} {addr}') if addr and addr != name else f'{slug}-{tl[0]["sourceNote"]}'
    if slug in used_slugs: slug = f'{slug}-{tl[0]["sourceNote"]}'
    used_slugs.add(slug)

    stage = stage_of(evs)
    y0, y1 = tl[0]['date'][:4], tl[-1]['date'][:4]
    nsig = sum(1 for t in tl if t['certainty'] == 'signal')
    where = f'район {dname}' if dname else ('Москва' if region == 'moscow' else 'Московская область')
    bits = [f'«{name}»' + (f' — проект застройщика {dev}' if dev else '') + (f' на участке «{addr}»' if addr and addr != name else '') + f' ({where}).']
    bits.append(f'В досье {len(tl)} {plural(len(tl), "событие", "события", "событий")} ' + (f'с {y0} по {y1} год' if y0 != y1 else f'{y0} года') + (f', из них {nsig} — {plural(nsig, "сигнал", "сигнала", "сигналов")} до официальных новостей' if nsig else '') + '.')
    rec = {'slug': slug, 'name': name, 'zu': addr, 'aliases': aliases, 'region': region, 'stage': stage, 'summary': ' '.join(bits), 'timeline': tl, 'notes': sorted(o['notes'])}
    if dname: rec['district'] = DIST[dname][0]
    if dev:
        rec['developer'] = dev_slug(dev); devs.setdefault(rec['developer'], dev)
    if dname:
        k, ok = DIST[dname]
        places.setdefault(k, {'key': k, 'slug': k, 'kind': 'district', 'name': dname, 'nameIn': name_in(dname), 'okrug': ok})
    if manual: rec = {'slug': manual, 'manual': True, 'timeline': tl, 'notes': rec['notes']}
    objects.append(rec)

# ручные поправки по итогам фактчекинга статей
DIST_BY_KEY = {k: n for n, (k, ok) in DIST.items()}
def make_summary(rec):
    tl = rec['timeline']; y0, y1 = tl[0]['date'][:4], tl[-1]['date'][:4]
    nsig = sum(1 for t in tl if t['certainty'] == 'signal')
    dn = DIST_BY_KEY.get(rec.get('district') or '')
    where = f'район {dn}' if dn else ('Москва' if rec['region'] == 'moscow' else 'Московская область')
    dev = devs.get(rec.get('developer') or '')
    addr = rec.get('zu')
    head = f"«{rec['name']}»" + (f' — проект застройщика {dev}' if dev else '') + (f' на участке «{addr}»' if addr and addr != rec['name'] else '') + f' ({where}).'
    tail = f'В досье {len(tl)} {plural(len(tl), "событие", "события", "событий")} ' + (f'с {y0} по {y1} год' if y0 != y1 else f'{y0} года') + (f', из них {nsig} — {plural(nsig, "сигнал", "сигнала", "сигналов")} до официальных новостей' if nsig else '') + '.'
    return head + ' ' + tail

DIST_BY_KEY = {k: n for n, (k, ok) in DIST.items()}
CORR_ALL = {k: v for k, v in CORR.items() if isinstance(v, dict)}
for c in list(CORR_ALL.values()):
    for part in c.get('split', []): CORR_ALL[part['slug']] = part
for rec in objects:
    c = CORR_ALL.get(rec['slug'])
    if not c: continue
    if c.get('owners'):
        # история собственников: [{developer, since, until, how, source}] — застройщики создаются при импорте
        rec['owners'] = c['owners']
        for ow in c['owners']: devs.setdefault(ow['developer'], ow.get('name') or ow['developer'])
    if rec.get('manual'): continue
    if c.get('developer'):
        rec['developer'] = c['developer']; devs.setdefault(c['developer'], c.get('developerName') or c['developer'])
    if c.get('previousDevelopers'): rec['previousDevelopers'] = c['previousDevelopers']
    if c.get('district'):
        rec['district'] = c['district']; n = DIST_BY_KEY.get(c['district'])
        if n: places.setdefault(c['district'], {'key': c['district'], 'slug': c['district'], 'kind': 'district', 'name': n, 'nameIn': name_in(n), 'okrug': DIST[n][1]})
    if c.get('region'): rec['region'] = c['region']  # объект не в Москве (ошибка разметки)
    if c.get('stage'): rec['stage'] = c['stage']  # стадия по проверке (наш.дом.рф и т. п.)
    if c.get('zu') and not rec.get('zu'): rec['zu'] = c['zu']
    rec['summary'] = make_summary(rec)

# не подтвердилось: заметки, статьи по которым отклонены фактчекингом (skip: unverifiable). Событие остаётся в хронологии
# как мнение рынка на ту дату — с пометкой, что к дате проверки подтверждения нет.
import glob as _glob
UNCONF = {}
for f in _glob.glob(os.path.join(HERE, '..', 'articles', '*.md')):
    head = open(f, encoding='utf-8').read().split('\n---', 1)[0]
    m = re.match(r'(\d+)-', os.path.basename(f))
    if m and re.search(r'^status:\s*skip', head, re.M) and re.search(r'^skip_reason:\s*unverifiable', head, re.M):
        d = re.search(r'^date_modified:\s*[\'"]?(\d{4}-\d{2}-\d{2})', head, re.M)
        UNCONF[int(m.group(1))] = d.group(1) if d else '2026-10-13'
# статья пишется по кластеру заметок: пометка — всем заметкам кластера (pipeline/batch-*/plan.json)
for pf in _glob.glob(os.path.join(HERE, '..', '..', 'pipeline', 'batch-*', 'plan.json')):
    for u in json.load(open(pf))['units']:
        if u['unit'] in UNCONF:
            for nid in u['notes']: UNCONF.setdefault(nid, UNCONF[u['unit']])
for nid in CORR.get('_unconfirmed', []): UNCONF.setdefault(int(nid), '2026-10-13')
REFUTED = {int(x) for x in CORR.get('_refuted', [])}  # не просто не подтвердилось, а опровергнуто источником
n_unc = 0
for rec in objects:
    for t in rec['timeline']:
        if t['sourceNote'] in UNCONF and not t.get('confirmedOn'):
            t['certainty'] = 'signal'; t['outcome'] = 'refuted' if t['sourceNote'] in REFUTED else 'unconfirmed'; t['checkedOn'] = UNCONF[t['sourceNote']]; n_unc += 1
print('не подтвердилось (пометка в хронологии):', n_unc)

out = {
    '_readme': 'Сгенерировано content/archive/build-dossiers.py из разметки архива. Не править руками: правки — в админке (досье с auto=false не перезаписываются) или в ручных файлах dossiers/*.json.',
    'developers': [{'slug': s, 'name': n} for s, n in sorted(devs.items())],
    'places': sorted(places.values(), key=lambda p: p['name']),
    'objects': objects,
}
json.dump(out, open(os.path.join(HERE, '..', 'objects', 'archive-dossiers.json'), 'w'), ensure_ascii=False, indent=1)
st = collections.Counter(o.get('stage') for o in objects)
print(f'объектов {len(objects)} (ручных {sum(1 for o in objects if o.get("manual"))}), событий {sum(len(o["timeline"]) for o in objects)}, '
      f'сигналов {sum(1 for o in objects for t in o["timeline"] if t["certainty"]=="signal")}, подтверждённых {sum(1 for o in objects for t in o["timeline"] if t.get("confirmedOn"))}')
print('застройщиков', len(devs), 'районов', len(places), 'пропущено', dict(skipped), 'стадии', dict(st))

# названия районов для сайта (geo.ts → DISTRICTS)
web = os.path.join(HERE, '..', '..', 'web', 'src', 'lib', 'districts.ts')
if os.path.isdir(os.path.dirname(web)):
    rows = ',\n'.join(f"  '{k}': {{ name: '{n}', okrug: '{ok}' }}" for n, (k, ok) in sorted(DIST.items(), key=lambda x: x[1][0]))
    open(web, 'w').write('// Сгенерировано content/archive/build-dossiers.py — районы Москвы: ключ → название и округ.\n'
                         f'export const MOSCOW_DISTRICTS: Record<string, {{ name: string; okrug: string }}> = {{\n{rows},\n}}\n')
    print('districts.ts записан')
