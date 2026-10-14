"""
«Как менялся проект»: пакеты для статей-историй проекта (было → стало) по событиям архитектуры и концепции в досье.
  python3 content/archive/build-evolution-packs.py --size 18
Берёт досье Москвы с ≥ 4 событиями architecture/concept за ≥ 2 года, без уже написанной истории.
Пакет совместим с pipeline/check_article.py: unit = заметка последнего события архитектуры (её дата — дата публикации),
notes = все заметки об архитектуре и концепции (с фото), dossier/links_allowed — как в build-article-packs.py.
Пишет pipeline/evolution/packs/<unit>.json и pipeline/evolution/plan.json.
"""
import json, os, re, glob, argparse, collections
from datetime import date
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..'))
ap = argparse.ArgumentParser(); ap.add_argument('--size', type=int, default=18); A_ = ap.parse_args()
N = {int(k): v for k, v in json.load(open(os.path.join(ROOT, '..', 'pipeline', 'notes-text.json'))).items()}
ARCH = json.load(open(os.path.join(ROOT, 'objects', 'archive-dossiers.json')))
D = {o['slug']: o for o in ARCH['objects']}
DEV = {d['slug']: d['name'] for d in ARCH['developers']}
PLACES = {p['key']: p for p in ARCH['places']}
for p in json.load(open(os.path.join(ROOT, 'places', 'places.json')))['places']: PLACES.setdefault(p['key'], p)
TERMS = [t['slug'] for t in json.load(open(os.path.join(ROOT, 'terms', 'terms.json')))['terms']]
articles, done_obj = {}, set()
for f in glob.glob(os.path.join(ROOT, 'articles', '*.md')):
    s = open(f, encoding='utf-8').read()
    m = re.search(r'^slug:\s*"?([\w-]+)"?', s, re.M); t = re.search(r'^title:\s*"?(.+?)"?\s*$', s, re.M)
    if m and 'status: skip' not in s[:3000]: articles[m.group(1)] = t.group(1) if t else ''
    if re.search(r'^series:\s*evolution', s, re.M):
        mo = re.search(r'objects:\s*\[\{id:\s*([\w-]+)', s) or re.search(r'objects:\s*\n-\s*id:\s*([\w-]+)', s)
        if mo: done_obj.add(mo.group(1))
cands = []
for o in ARCH['objects']:
    if o.get('region') != 'moscow' or o.get('manual') or o['slug'] in done_obj: continue
    ev = [t for t in o['timeline'] if t.get('kind') in ('architecture', 'concept') and int(t['sourceNote']) in N]
    if len(ev) < 4: continue
    if int(ev[-1]['date'][:4]) - int(ev[0]['date'][:4]) < 2: continue
    imgs = sum(int(float(N[int(t['sourceNote'])].get('media') or 0)) for t in ev)
    cands.append((len(ev) + min(imgs, 10) / 5, o['slug'], ev))
cands.sort(reverse=True)
per_dev = collections.Counter(); pick = []
for w, slug, ev in cands:
    dev = D[slug].get('developer')
    if dev and per_dev[dev] >= 2: continue
    pick.append((slug, ev)); per_dev[dev] += 1
    if len(pick) >= A_.size: break
out = os.path.join(ROOT, '..', 'pipeline', 'evolution'); os.makedirs(os.path.join(out, 'packs'), exist_ok=True)
def note(i):
    n = N[i]; return {'id': i, 'date': n['date'], 'text': n['text'], 'images': [f'media/{i}_{k}.jpg' for k in range(1, int(float(n.get('media') or 0)) + 1)]}
plan = []
for slug, ev in pick:
    o = D[slug]; ids = []
    for t in ev:
        i = int(t['sourceNote'])
        if i not in ids: ids.append(i)
    unit = ids[-1]; dev = o.get('developer'); place = PLACES.get(o.get('district') or o.get('region') or '')
    pack = {
        'unit': unit, 'series': 'evolution', 'notes': [note(i) for i in ids], 'date_published': N[unit]['date'], 'date_modified': date.today().isoformat(),
        'earlier_notes': [],
        'dossier': {
            'url': f'/obekty/{slug}/', 'slug': slug, 'name': o.get('name'), 'zu': o.get('zu'), 'aliases': o.get('aliases'),
            'developer': {'slug': dev, 'name': DEV.get(dev), 'url': f'/zastroyshchiki/{dev}/'} if dev else None,
            'region': o.get('region'), 'district': place and {'name': place['name'], 'url': f"/novostroyki/{place['slug']}/"},
            'stage': o.get('stage'),
            'timeline': [{'date': t['date'], 'kind': t['kind'], 'certainty': t['certainty'], 'title': t['title'], 'note': t['sourceNote']} for t in o['timeline']],
        },
        'other_objects': [],
        'links_allowed': {
            'terms': [f'/slovar/{t}/' for t in TERMS], 'topics': ['/temy/arhitektura/', '/temy/ceny/', '/temy/rynok/', '/temy/premium/', '/temy/krt/'],
            'landings': ['/novostroyki/moskva/', '/novostroyki/premium-klass/', '/novostroyki/biznes-klass/', '/novostroyki/komfort-klass/', '/novostroyki/budushchie-proekty/', '/novostroyki/razreshenie-na-stroitelstvo/', '/novostroyki/sdannye/', '/ceny-na-starte/'],
            'articles': [{'url': f'/novosti/{s}/', 'title': t} for s, t in articles.items()],
        },
    }
    json.dump(pack, open(os.path.join(out, 'packs', f'{unit}.json'), 'w'), ensure_ascii=False, indent=1)
    plan.append({'unit': unit, 'dossier': slug, 'developer': dev, 'events': len(ev), 'notes': ids, 'images': sum(len(note(i)['images']) for i in ids)})
json.dump({'series': 'evolution', 'units': plan}, open(os.path.join(out, 'plan.json'), 'w'), ensure_ascii=False, indent=1)
print(f'кандидатов {len(cands)}, в пакете {len(plan)}')
for p in plan: print(p['unit'], p['dossier'], p['developer'], 'событий', p['events'], 'фото', p['images'])
