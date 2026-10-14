"""
Цена на старте продаж и сейчас: pipeline/start-prices/out/*.json (проверка по источникам) → content/objects/start-prices.json
и web/src/lib/start-prices.ts для страницы /ceny-na-starte/.
  python3 content/archive/build-start-prices.py
Сравниваем минимальную цену квартиры («бюджет входа»): на старте — по публикации о старте, сейчас — по каталогу на дату проверки.
В подборку идут только жилые проекты, где обе цены подтверждены; исключения — EXCLUDE с причиной.
"""
import json, glob, os, re
from datetime import date
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = sorted(glob.glob(os.path.join(ROOT, 'pipeline', 'start-prices', 'out', '*.json')))
A = json.load(open(os.path.join(ROOT, 'content', 'objects', 'archive-dossiers.json')))
OBJ = {o['slug']: o for o in A['objects']}
DEV = {d['slug']: d['name'] for d in A['developers']}
src = open(os.path.join(ROOT, 'web', 'src', 'lib', 'districts.ts'), encoding='utf-8').read()
DIST = {k: (n, o) for k, n, o in re.findall(r"'([\w-]+)': \{ name: '([^']+)', okrug: '([^']+)' \}", src)}
EXCLUDE = {
    'biznes-park-ostankino': 'офисы', 'khodynka': 'офисы', 'stone-savelovskaya': 'коммерция', 'stone-towers': 'коммерция',
    'level-baumanskaya': 'дом сдан, в продаже остатки — крупные лоты, сравнение некорректно',
    'slava': 'на старте известен не минимальный лот, а апартамент 40,4 м²',
    'polar': 'минимальная цена сейчас не опубликована',
    'ice-tower': 'цена сейчас — из неактуального объявления',
    'nizhegorodskaya': 'цена сейчас — из неактуального объявления',
    'prichalnyy': 'дом сдан, в продаже остатки — крупные лоты', 'bolshaya-akademicheskaya-85': 'дома сданы, остатки — 3-комнатные',
    'intonatsiya': 'в продаже остатки — крупные лоты', 'nikolskie-luga': 'в продаже 6 квартир-остатков',
    'kashirskiy-dvor-2': 'в продаже остались только крупные лоты', 'dom56': 'источники расходятся в цене старта (23 и 13,5 млн ₽)',
    's5': 'публикация о старте — без года и про начало стройки', 'rodina-park': 'на старте известна только цена 2-комнатной',
    'otkrytyy-park': 'карточка «2-й Иртышский» сопоставлена с проектом косвенно', 'preobrazhenskaya-ploshchad': 'на старте — цена 1-комнатной, сейчас — студии',
    'sobytie': 'на старте — квартира от 44 м², сейчас — студия',
    'dom-dau': 'на старте — евро-1 50,9 м², сейчас — 1-комнатная 31,5 м²', 'filit': 'дом сдан, в продаже остатки',
    'kolskaya-8': 'дом сдан, остатки — 3-комнатные', 'stories': 'цена сейчас — со страницы без даты',
}
def ym(s):
    p = [int(x) for x in str(s).split('-')[:3]] + [15]
    return date(p[0], p[1], p[2] if len(p) > 2 and len(str(s)) > 7 else 15)
DISPLAY = {'life-varshavskaya': '«LIFE-Варшавская»', 'salarevo-park': '«Саларьево парк»', 'prioriti-basmannyy': 'MYPRIORITY Basmanny',
           'injoy': 'Injoy', 'wave': 'Wave', 'pik': '«Плеханова, 11» (ПИК+)', 'era': 'ERA', 'yuzhnyy-port': 'Ultima City',
           'strana-zarechnaya': '«Страна.Заречная»', 'zareche': '«Графика на воде»', 'ogorodnyy-20': 'Квартал «Монс»',
           'staropetrovskiy-atrium': 'Level Войковская', 'shift': 'Shift', 'mnevniki': 'MYPRIORITY Mnevniki',
           'losinoostrovskiy-park': '«Лосиноостровский парк»', 'amurskiy-park': '«Амурский парк»', 'narvin': '«Нарвин» (бывш. «Кронштадтский, 14»)',
           'perets': '«Перец» (апартаменты)', 'moskvoreche': '«Москворечье»', 'petrovskiy-park': '«Петровский парк II»', 'vishnevaya-7': 'Cityzen',
           'buninskaya-naberezhnaya': '«Бунинская набережная»', 'novaya-11': '«Новая, 11»', '1-y-nagatinskiy': '«1-й Нагатинский»',
           'nagatino-i-land': 'Nagatino i-Land', 'hideout': 'hideOUT', 'shlyuzovaya-2': '«Монблан»', 'svet': '«Свет»',
           'mayprioriti-paveletskaya': 'MYPRIORITY Paveletskaya', 'marilnn-park': 'Mariinn Park', 'sokolinn-park': 'Sokolinn Park',
           'arkhitektor': '«Архитектор»', 'chistye-prudy': '«Чистые пруды»', 'dd-oo-mm': 'DD OO MM', 'irtyshskiy-park': '«2-й Иртышский»', 'tate': 'Tate'}
# короткие подписи лотов для сайта (редактура полей агентов)
LOTS = {
 'life-varshavskaya': (None, 'студия 35,5 м²'), 'salarevo-park': (None, 'студия 21,2 м² — от 13,4 млн ₽'),
 'prioriti-basmannyy': (None, '2-комнатная от 59,3 м² — студий в продаже нет'), 'injoy': ('1-комнатная', None),
 'wave': (None, 'студия 22,1 м²'), 'pik': ('квартиры с отделкой от 20,2 м²', 'студия 19,4 м²'),
 'era': (None, 'вторая очередь — сдача во II кв. 2029'), 'yuzhnyy-port': ('студии от 28,3 м²', '1-комнатная 28,3 м²'),
 'strana-zarechnaya': (None, 'по карточке проекта'), 'zareche': ('1-комнатная 32,7 м²', '1-комнатная 29,5 м²'),
 'ogorodnyy-20': ('студия 27,6 м²', 'та же студия 27,6 м²'), 'staropetrovskiy-atrium': ('лоты от 28,9 м²', 'студия 29,9 м²'),
 'shift': (None, '2-комнатная 46,5 м²'), 'mnevniki': ('лот 28,2 м²', None),
 'losinoostrovskiy-park': ('квартиры от 20 м²', 'студия 28,1 м²'), 'amurskiy-park': (None, None), 'narvin': ('квартиры от 20 м²', None),
 'perets': ('апартаменты', 'апартаменты'), 'moskvoreche': (None, 'студия 19,1 м²'), 'petrovskiy-park': ('студии от 23,9 м²', 'студия 24,4 м²'),
 'vishnevaya-7': (None, 'студия 20,8 м²'), 'buninskaya-naberezhnaya': (None, None), 'novaya-11': ('лоты от 28 м²', None),
 '1-y-nagatinskiy': ('студия 30,3 м²', None), 'nagatino-i-land': ('первая очередь', None), 'hideout': ('1 спальня, 38,6 м²', '1-комнатная 36,2 м²'),
 'shlyuzovaya-2': ('лоты от 48 м²', '1-комнатная от 48 м²'), 'svet': (None, 'студия 30,9 м²'), 'mayprioriti-paveletskaya': ('студии от 30 м²', 'студия 26,5 м²'),
 'marilnn-park': ('1-комнатная 43,5 м²', 'та же 1-комнатная 43,5 м²'), 'sokolinn-park': ('студия 29 м²', '1-комнатная 28,1 м²'),
 'arkhitektor': (None, '2-комнатная 43,3 м² — студий в продаже нет'), 'chistye-prudy': (None, '2-комнатная 113,5 м²'),
 'dd-oo-mm': ('студия 28,5 м²', 'студия 30 м²'), 'irtyshskiy-park': (None, None), 'tate': ('лоты от 28,8 м²', 'студия 30,3 м²'),
}
rows, skipped = [], []
for f in OUT:
    d = json.load(open(f)); s, n = d.get('start') or {}, d.get('now') or {}
    slug = d['slug']
    if slug in EXCLUDE: skipped.append((slug, EXCLUDE[slug])); continue
    if not (s.get('lot_from') and n.get('lot_from') and s.get('date') and n.get('as_of') and s.get('source', {}).get('url') and n.get('source', {}).get('url')):
        skipped.append((slug, d.get('status'))); continue
    o = OBJ.get(slug, {})
    dist = DIST.get(o.get('district') or '')
    yrs = max((ym(n['as_of']) - ym(s['date'])).days / 365.25, 0.1)
    chg = n['lot_from'] / s['lot_from'] - 1
    rows.append({
        'slug': slug, 'name': DISPLAY.get(slug) or d.get('project') or o.get('name'), 'dossier': o.get('name'), 'project': d.get('project'),
        'district': o.get('district'), 'districtName': dist[0] if dist else None, 'okrug': dist[1] if dist else None,
        'developer': DEV.get(o.get('developer'), o.get('developer')),
        'start': {k: s.get(k) for k in ('date', 'lot_from', 'lot_desc', 'price_m2', 'price_m2_kind', 'source')},
        'now': {k: n.get(k) for k in ('as_of', 'lot_from', 'lot_desc', 'price_m2', 'price_m2_kind', 'selling', 'source')},
        'changePct': round(chg * 100, 1), 'years': round(yrs, 1), 'perYearPct': round(((1 + chg) ** (1 / yrs) - 1) * 100, 1),
        'note': d.get('note') or '',
    })
    if slug in LOTS: rows[-1]['start']['lot_desc'], rows[-1]['now']['lot_desc'] = LOTS[slug]
rows.sort(key=lambda r: -r['changePct'])
json.dump({'_readme': 'Цена на старте продаж и сейчас — минимальная цена квартиры по источникам (pipeline/start-prices). Генерирует content/archive/build-start-prices.py.',
           'checkedOn': '2026-10-14', 'rows': rows}, open(os.path.join(ROOT, 'content', 'objects', 'start-prices.json'), 'w'), ensure_ascii=False, indent=1)
ts = ['// Сгенерировано content/archive/build-start-prices.py из content/objects/start-prices.json. Не править руками.',
      'export type PriceSource = { title?: string | null; url: string; date?: string | null }',
      'export type StartPriceRow = { slug: string; name: string; dossier?: string | null; project?: string | null; district?: string | null; districtName?: string | null; okrug?: string | null; developer?: string | null;',
      '  start: { date: string; lot_from: number; lot_desc?: string | null; price_m2?: number | null; price_m2_kind?: string | null; source: PriceSource }',
      '  now: { as_of: string; lot_from: number; lot_desc?: string | null; price_m2?: number | null; price_m2_kind?: string | null; selling?: boolean | null; source: PriceSource }',
      '  changePct: number; years: number; perYearPct: number; note: string }',
      "export const START_PRICES_CHECKED = '2026-10-14'",
      f'export const START_PRICES: StartPriceRow[] = {json.dumps(rows, ensure_ascii=False, indent=1)}', '']
open(os.path.join(ROOT, 'web', 'src', 'lib', 'start-prices.ts'), 'w', encoding='utf-8').write('\n'.join(ts))
print(len(rows), 'в подборке;', len(skipped), 'не вошли')
for r in rows[:0]: print(f"{r['name']:28} {r['start']['date']} {r['start']['lot_from']:>6} → {r['now']['lot_from']:>6}  {r['changePct']:+.0f}%  {r['perYearPct']:+.1f}%/год")
