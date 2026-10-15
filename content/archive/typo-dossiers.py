"""
Типографика ручных досье (content/objects/dossiers/*.json) по «Справочнику издателя и автора» Мильчина и Чельцовой:
названия застройщиков и проектов кириллицей — в ёлочках, вложенные — в «лапках», адреса без кавычек, тире вместо дефиса.
Идемпотентно: повторный запуск ничего не меняет.  python3 content/archive/typo-dossiers.py
"""
import json, glob, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from typo_ru import qn, quote_names, tidy
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
AD = json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))
DEVN = {d['slug']: d['name'] for d in AD['developers']}
SKIPN = {'Атлас', 'Град', 'Рост', 'Родина', 'Север', 'Среда', 'Страна', 'Стена', 'Спартак', 'Черноголовка', 'Киевская площадь', 'Яндекс', 'Сумма', 'Консоль', 'Единство', 'Отрада', 'Остров Мечты', 'Новая Жизнь', 'Новая Эра', 'Капиталист', 'Капиталисты', 'Монарх', 'Атриум', 'Абсолют', 'Тач', 'Русич', 'Догма', 'Доходный Дом', 'Первый девелопер', 'Центр Инвеста', 'Кроста', 'Мосинжпроект'}
GLOBAL = [n for n in DEVN.values() if n not in SKIPN] + ['Мортон', 'Ведис']
n = 0
for f in sorted(glob.glob(f'{ROOT}/content/objects/dossiers/*.json')):
    raw = open(f).read(); d = json.loads(raw)
    dev = DEVN.get(d.get('developer') or '')
    name = re.sub(r'^ЖК\s+', '', d.get('name') or '')
    s = d.get('summary') or ''
    # шаблон каталога: «Жилой комплекс ПИК по адресу …» → «Жилой комплекс «Влюблино» застройщика ПИК по адресу …»
    if dev and s.startswith(f'Жилой комплекс {dev}'):
        s = f'Жилой комплекс {qn(name)} застройщика {qn(dev)}' + s[len(f'Жилой комплекс {dev}'):]
    own = [x for x in [name] + list(d.get('aliases') or []) if x and not re.search(r'[\d,]', x) and x != d.get('zu') and len(x) >= 4]
    names = ([dev] if dev else []) + GLOBAL + own
    d['summary'] = tidy(quote_names(s, names))
    for t in d.get('timeline') or []:
        if t.get('title'): t['title'] = tidy(quote_names(t['title'], names))
        if t.get('text'): t['text'] = tidy(quote_names(t['text'], names))
    new = json.dumps(d, ensure_ascii=False, indent=2)
    if new.strip() != raw.strip():
        open(f, 'w').write(new + '\n'); n += 1
print('исправлено досье:', n)
