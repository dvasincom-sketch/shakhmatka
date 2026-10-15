"""
Бэклог подтверждения сигналов: самые старые сигналы досье без итога (нет confirmedOn и outcome) → пакеты для авторов.
  python3 content/archive/build-signal-confirm-packs.py --wave 1 --size 18
Пакет — в формате партий (pipeline/batch-*/packs), плюс поле signals: какие именно сигналы заметки проверяем.
Выход: pipeline/signal-confirm/wave-NN/packs/<note>.json и plan.json. Бриф — pipeline/signal-confirm/BRIEF.md.
"""
import argparse, collections, glob, json, os, re
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
ap = argparse.ArgumentParser()
ap.add_argument('--wave', type=int, required=True)
ap.add_argument('--size', type=int, default=18)
A = ap.parse_args()

N = {int(k): v for k, v in json.load(open(os.path.join(ROOT, '..', 'pipeline', 'notes-text.json'))).items()}
ARCH = json.load(open(os.path.join(ROOT, 'objects', 'archive-dossiers.json')))
D = {o['slug']: o for o in ARCH['objects']}
DEV = {d['slug']: d['name'] for d in ARCH['developers']}
PLACES = {p['key']: p for p in ARCH['places']}
for p in json.load(open(os.path.join(ROOT, 'places', 'places.json')))['places']: PLACES.setdefault(p['key'], p)
TERMS = [t['slug'] for t in json.load(open(os.path.join(ROOT, 'terms', 'terms.json')))['terms']]
done = set()
for f in glob.glob(os.path.join(ROOT, 'articles', '*.md')):
    m = re.match(r'(\d+)-', os.path.basename(f))
    if m: done.add(int(m.group(1)))
for f in glob.glob(os.path.join(ROOT, '..', 'pipeline', 'signal-confirm', 'wave-*', 'plan.json')):
    _pl = json.load(open(f))
    for u in _pl['units'] + _pl.get('excluded', []): done.add(u['unit'])
articles = {}
for f in glob.glob(os.path.join(ROOT, 'articles', '*.md')):
    s = open(f, encoding='utf-8').read()
    m = re.search(r'^slug:\s*"?([\w-]+)"?', s, re.M); t = re.search(r'^title:\s*"?(.+?)"?\s*$', s, re.M)
    if m: articles[m.group(1)] = t.group(1) if t else ''

by_note = collections.defaultdict(list)
for o in D.values():
    for t in o['timeline']:
        if t.get('certainty') == 'signal' and not t.get('confirmedOn') and not t.get('outcome') and t['sourceNote'] not in done and t['sourceNote'] in N:
            by_note[t['sourceNote']].append((o['slug'], t))
order = sorted(by_note, key=lambda n: N[n]['date'])[:A.size]

out = os.path.join(ROOT, '..', 'pipeline', 'signal-confirm', f'wave-{A.wave:02d}')
os.makedirs(os.path.join(out, 'packs'), exist_ok=True)
plan = []
for nid in order:
    sigs = by_note[nid]
    slug = collections.Counter(s for s, _ in sigs).most_common(1)[0][0]
    o = D[slug]; dev = o.get('developer'); place = PLACES.get(o.get('district') or o.get('region') or '')
    n = N[nid]
    pack = {
        'unit': nid,
        'notes': [{'id': nid, 'date': n['date'], 'text': n['text'], 'images': []}],
        'date_published': n['date'], 'date_modified': date.today().isoformat(), 'earlier_notes': [],
        'signals': [{'object': s, 'object_name': D[s].get('name', s), 'date': t['date'], 'kind': t['kind'], 'title': t['title']} for s, t in sigs],
        'dossier': {
            'url': f'/obekty/{slug}/', 'slug': slug, 'name': o.get('name'), 'zu': o.get('zu'), 'aliases': o.get('aliases'),
            'developer': {'slug': dev, 'name': DEV.get(dev), 'url': f'/zastroyshchiki/{dev}/'} if dev else None,
            'region': o.get('region'), 'district': place and {'name': place['name'], 'url': f"/novostroyki/{place['slug']}/"},
            'stage': o.get('stage'),
            'timeline': [{'date': t['date'], 'kind': t['kind'], 'certainty': t['certainty'], 'title': t['title'], 'note': t['sourceNote']} for t in o['timeline']],
        },
        'other_objects': [{'url': f'/obekty/{s}/', 'slug': s, 'name': D[s].get('name', s), 'zu': D[s].get('zu')} for s in dict.fromkeys(s for s, _ in sigs) if s != slug],
        'links_allowed': {
            'terms': [f'/slovar/{t}/' for t in TERMS], 'topics': ['/temy/ceny/', '/temy/rynok/', '/temy/regulirovanie/', '/temy/ipoteka/', '/temy/premium/', '/temy/krt/', '/temy/signaly/'],
            'landings': ['/novostroyki/moskva/', '/novostroyki/start-prodazh/', '/novostroyki/budushchie-proekty/'],
            'articles': [{'url': f'/novosti/{s}/', 'title': t} for s, t in articles.items()],
        },
    }
    json.dump(pack, open(os.path.join(out, 'packs', f'{nid}.json'), 'w'), ensure_ascii=False, indent=1)
    plan.append({'unit': nid, 'notes': [nid], 'dossier': slug, 'date': n['date'], 'signals': len(sigs)})
json.dump({'wave': A.wave, 'units': plan}, open(os.path.join(out, 'plan.json'), 'w'), ensure_ascii=False, indent=1)
print(f'сигналов без итога: {sum(len(v) for v in by_note.values())} в {len(by_note)} заметках; в волне {len(plan)}')
for p in plan: print(p['unit'], p['date'], p['dossier'], p['signals'])
