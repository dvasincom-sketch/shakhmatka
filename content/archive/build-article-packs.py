"""
Конвейер статей, шаг 1: отбор заметок и пакеты входных данных для авторов.
  python3 build-article-packs.py --batch 1 --size 30 [--notes N.json]
Берёт заметки value=article, у которых есть событие в досье объекта; одна статья = кластер заметок
об одном объекте в пределах 30 дней. Пишет pipeline/batch-NN/packs/<id>.json и pipeline/batch-NN/plan.json.
Уже написанные статьи (content/articles/<id>-*.md) и заметки из прошлых пакетов не берёт.
"""
import json, os, re, sys, glob, argparse, collections
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--batch', type=int, required=True)
ap.add_argument('--size', type=int, default=30)
ap.add_argument('--notes', default=os.path.join(HERE, '..', '..', 'pipeline', 'notes-text.json'), help='тексты заметок: {id: {date, text, links, media}}')
ap.add_argument('--no-triage', action='store_true', help='не применять отсев pipeline/triage')
ap.add_argument('--since', default='2024-01-01', help='сначала берём свежие кластеры')
A = ap.parse_args()

M = {int(k): v for k, v in json.load(open(os.path.join(HERE, 'notes_marked.json'))).items()}
N = {int(k): v for k, v in json.load(open(A.notes)).items()}
ARCH = json.load(open(os.path.join(ROOT, 'objects', 'archive-dossiers.json')))
D = {o['slug']: o for o in ARCH['objects']}
# ручные досье живут в базе: подтягиваем карточку из локальной SQLite, если она есть
try:
    import sqlite3
    db = sqlite3.connect(os.path.join(ROOT, '..', 'web', 'shakhmatka.db'))
    devs_db = dict(db.execute('select id, slug from developers').fetchall())
    for slug, name, zu, region, district, stage, dev in db.execute('select slug, name, zu, region, district, stage, developer_id from objects'):
        if slug in D and D[slug].get('manual'):
            D[slug].update({'name': name, 'zu': zu, 'region': region, 'district': district, 'stage': stage, 'developer': devs_db.get(dev)})
except Exception as e:
    print('нет локальной базы для ручных досье:', e)
DEV = {d['slug']: d['name'] for d in ARCH['developers']}
DEV.update({'legenda': 'LEGENDA', 'granel': 'Гранель', 'pik': 'ПИК', 'sezar-group': 'Sezar Group', 'etalon': 'Эталон', 'glorax': 'GloraX', 'konsol': 'Консоль'})
PLACES = {p['key']: p for p in ARCH['places']}
for p in json.load(open(os.path.join(ROOT, 'places', 'places.json')))['places']:
    PLACES.setdefault(p['key'], p)
TERMS = [t['slug'] for t in json.load(open(os.path.join(ROOT, 'terms', 'terms.json')))['terms']] if os.path.exists(os.path.join(ROOT, 'terms', 'terms.json')) else []

# уже есть статьи по этим заметкам
done = set()
for f in glob.glob(os.path.join(ROOT, 'articles', '*.md')):
    m = re.match(r'(\d+)-', os.path.basename(f))
    if m: done.add(int(m.group(1)))
for f in glob.glob(os.path.join(ROOT, '..', 'pipeline', 'batch-*', 'plan.json')) + glob.glob(os.path.join(ROOT, '..', 'pipeline', 'evolution', 'plan*.json')):
    for u in json.load(open(f))['units']: done.update(u['notes'])
articles = {}
for f in glob.glob(os.path.join(ROOT, 'articles', '*.md')):
    s = open(f, encoding='utf-8').read()
    m = re.search(r'^slug:\s*"?([\w-]+)"?', s, re.M); t = re.search(r'^title:\s*"?(.+?)"?\s*$', s, re.M)
    if m: articles[m.group(1)] = t.group(1) if t else ''

# заметка → досье, в хронологию которых она попала; главное досье — где у заметки больше событий
note_dossiers = collections.defaultdict(collections.Counter)
for o in D.values():
    for t in o['timeline']: note_dossiers[t['sourceNote']][o['slug']] += 1
def main_dossier(nid):
    c = note_dossiers.get(nid)
    if not c: return None
    return max(c, key=lambda s: (c[s], len(D[s]['timeline'])))

def dd(s): y, m, d = map(int, s[:10].split('-')); return date(y, m, d)
cands = [i for i, r in M.items() if r['value'] == 'article' and r['kind'] != 'promo' and i in N and i not in done and main_dossier(i)]
by = collections.defaultdict(list)
for i in cands: by[main_dossier(i)].append(i)
units = []
for slug, ids in by.items():
    ids.sort(key=lambda i: N[i]['date']); cur = []
    for i in ids:
        if cur and (dd(N[i]['date']) - dd(N[cur[-1]]['date'])).days > 30: units.append((slug, cur)); cur = []
        cur.append(i)
    if cur: units.append((slug, cur))

# порядок: важные досье (события + сигналы), свежие кластеры, не больше трёх статей на застройщика и одной на досье в пакете
def weight(u):
    o = D[u[0]]; sig = sum(1 for t in o['timeline'] if t['certainty'] == 'signal')
    fresh = N[u[1][-1]]['date'] >= A.since
    return (fresh, len(o['timeline']) + 2 * sig + 3 * len(u[1]))
units.sort(key=weight, reverse=True)
# отсев (pipeline/triage/out-*.json): C — почти наверняка не подтвердится (закрытые цены, рассылки, «говорят»), в партии не берём; A — вперёд
TRI = {}
for f in glob.glob(os.path.join(ROOT, '..', 'pipeline', 'triage', 'out-*.json')):
    for r in json.load(open(f)): TRI[r['unit']] = r['grade']
def grade(u): return next((TRI[i] for i in u[1] if i in TRI), 'B')
if TRI and not A.no_triage:
    dropped = [u for u in units if grade(u) == 'C']
    units = [u for u in units if grade(u) != 'C']
    units.sort(key=lambda u: grade(u) != 'A')  # устойчивая сортировка: внутри A/B порядок по весу
    print(f'отсев: убрано C {len(dropped)}, A {sum(grade(u) == "A" for u in units)}, B {sum(grade(u) == "B" for u in units)}')
pick, per_dev, per_obj = [], collections.Counter(), set()
for u in units:
    o = D[u[0]]
    if u[0] in per_obj or (o.get('developer') and per_dev[o['developer']] >= 3): continue
    pick.append(u); per_obj.add(u[0]); per_dev[o.get('developer')] += 1
    if len(pick) >= A.size: break

out = os.path.join(ROOT, '..', 'pipeline', f'batch-{A.batch:02d}')
os.makedirs(os.path.join(out, 'packs'), exist_ok=True)
def note(i, full=True):
    n = N[i]; t = n['text']
    return {'id': i, 'date': n['date'], 'text': t if full else t[:1500], 'images': [f'media/{i}_{k}.jpg' for k in range(1, int(float(n.get('media') or 0)) + 1)]}

def link_card(slug):
    o = D.get(slug)
    if not o: return {'url': f'/obekty/{slug}/'}
    return {'url': f'/obekty/{slug}/', 'name': o['name'], 'zu': o.get('zu')}

plan = []
for slug, ids in pick:
    o = D[slug]; primary = max(ids, key=lambda i: len(N[i]['text']))
    refs = []
    for i in ids:
        for r in M[i].get('refs_earlier') or []:
            if r in N and r not in ids and r not in refs: refs.append(r)
    others = collections.Counter()
    for i in ids:
        for s, c in note_dossiers.get(i, {}).items():
            if s != slug: others[s] += c
    dev = o.get('developer')
    place = PLACES.get(o.get('district') or o.get('region') or '')
    pack = {
        'unit': primary, 'notes': [note(i) for i in ids], 'date_published': N[ids[0]]['date'], 'date_modified': date.today().isoformat(),
        'earlier_notes': [note(r, full=False) for r in refs[:6]],
        'dossier': {
            'url': f'/obekty/{slug}/', 'slug': slug, 'name': o.get('name'), 'zu': o.get('zu'), 'aliases': o.get('aliases'),
            'developer': {'slug': dev, 'name': DEV.get(dev), 'url': f'/zastroyshchiki/{dev}/'} if dev else None,
            'region': o.get('region'), 'district': place and {'name': place['name'], 'url': f"/novostroyki/{place['slug']}/"},
            'stage': o.get('stage'),
            'timeline': [{'date': t['date'], 'kind': t['kind'], 'certainty': t['certainty'], 'title': t['title'], 'note': t['sourceNote']} for t in o['timeline']],
        },
        'other_objects': [dict(link_card(s), slug=s) for s, _ in others.most_common(5)],
        'links_allowed': {
            'terms': [f'/slovar/{t}/' for t in TERMS], 'topics': ['/temy/ceny/', '/temy/rynok/', '/temy/regulirovanie/', '/temy/ipoteka/', '/temy/premium/', '/temy/krt/'],
            'landings': ['/novostroyki/moskva/', '/novostroyki/moskovskaya-oblast/', '/novostroyki/start-prodazh/', '/novostroyki/premium-klass/', '/novostroyki/biznes-klass/', '/novostroyki/komfort-klass/', '/novostroyki/budushchie-proekty/', '/novostroyki/razreshenie-na-stroitelstvo/', '/novostroyki/sdannye/'],
            'articles': [{'url': f'/novosti/{s}/', 'title': t} for s, t in articles.items()],
        },
    }
    json.dump(pack, open(os.path.join(out, 'packs', f'{primary}.json'), 'w'), ensure_ascii=False, indent=1)
    plan.append({'unit': primary, 'notes': ids, 'dossier': slug, 'developer': dev, 'date': N[ids[0]]['date'], 'images': sum(len(note(i)['images']) for i in ids)})
json.dump({'batch': A.batch, 'units': plan}, open(os.path.join(out, 'plan.json'), 'w'), ensure_ascii=False, indent=1)
print(f'кандидатов-кластеров {len(units)}, в пакете {len(plan)}, фото {sum(p["images"] for p in plan)}')
for p in plan: print(p['unit'], p['date'], p['dossier'], p['developer'], len(p['notes']), 'фото', p['images'])
