"""
«Говорили раньше всех»: пакет ежемесячного материала по сигналам досье.
  python3 content/archive/build-signals-digest.py --month 2026-10 [--since 2026-01]
Сбылось: сигналы, подтверждение которых пришлось на окно (по умолчанию — месяц выпуска и два предыдущих; для первого выпуска --since).
Не подтвердилось: сигналы с пометкой outcome, проверенные в окне. Свежие сигналы месяца — только числом (на сайте они на /signaly/).
Пишет pipeline/signals-digest/<month>/pack.json. Статья: content/articles/signaly-<month>-<slug>.md (бриф pipeline/signals-digest/BRIEF.md).
"""
import json, os, argparse, glob, re
from datetime import date
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..'))
ap = argparse.ArgumentParser(); ap.add_argument('--month', required=True); ap.add_argument('--since'); A = ap.parse_args()
y, m = map(int, A.month.split('-'))
def shift(y, m, k):
    m += k
    while m < 1: m += 12; y -= 1
    while m > 12: m -= 12; y += 1
    return f'{y}-{m:02d}'
since = A.since or shift(y, m, -2)
N = {int(k): v for k, v in json.load(open(os.path.join(ROOT, '..', 'pipeline', 'notes-text.json'))).items()}
ARCH = json.load(open(os.path.join(ROOT, 'objects', 'archive-dossiers.json')))
DEV = {d['slug']: d['name'] for d in ARCH['developers']}
def months(a, b): return round((date.fromisoformat(b[:10]) - date.fromisoformat(a[:10])).days / 30.44)
conf, unconf, fresh = [], [], 0
for o in ARCH['objects']:
    for t in o['timeline']:
        if t.get('certainty') != 'signal': continue
        if t['date'][:7] == A.month or (t['date'][:7] == shift(y, m, -1)): fresh += t['date'][:7] == shift(y, m, -1)
        card = {'object': o.get('name') or o['slug'], 'slug': o['slug'], 'url': f"/obekty/{o['slug']}/", 'developer': DEV.get(o.get('developer')),
                'signal_date': t['date'][:10], 'signal': t['title'], 'note_text': N.get(int(t['sourceNote']), {}).get('text', '')[:900]}
        if t.get('confirmedOn') and since <= t['confirmedOn'][:7] <= A.month:
            card['confirmed_on_by_archive'] = t['confirmedOn'][:10]; card['lead_months'] = months(t['date'], t['confirmedOn'])
            # что подтвердило — последующие события досье после сигнала
            card['later_events'] = [{'date': x['date'][:10], 'title': x['title'], 'certainty': x['certainty']} for x in o['timeline'] if x['date'] > t['date']][:6]
            conf.append(card)
        if t.get('outcome') and since <= (t.get('checkedOn') or '')[:7] <= A.month:
            card['outcome'] = t['outcome']; unconf.append(card)
conf.sort(key=lambda c: c['confirmed_on_by_archive'], reverse=True)
articles = {}
for f in glob.glob(os.path.join(ROOT, 'articles', '*.md')):
    s = open(f, encoding='utf-8').read()
    mm = re.search(r'^slug:\s*"?([\w-]+)"?', s, re.M); tt = re.search(r'^title:\s*"?(.+?)"?\s*$', s, re.M)
    if mm and 'status: skip' not in s[:3000]: articles[mm.group(1)] = tt.group(1) if tt else ''
total_sig = sum(1 for o in ARCH['objects'] for t in o['timeline'] if t.get('certainty') == 'signal')
total_conf = sum(1 for o in ARCH['objects'] for t in o['timeline'] if t.get('certainty') == 'signal' and t.get('confirmedOn'))
pack = {'month': A.month, 'window': [since, A.month], 'date_published': date.today().isoformat(), 'date_modified': date.today().isoformat(),
        'stats': {'signals_total': total_sig, 'confirmed_total': total_conf, 'fresh_prev_month': fresh, 'confirmed_in_window': len(conf), 'unconfirmed_in_window': len(unconf)},
        'confirmed': conf, 'unconfirmed': unconf[:40],
        'links_allowed': {'dossiers': sorted({c['url'] for c in conf + unconf[:40]}), 'pages': ['/signaly/', '/krt/', '/ceny-na-starte/', '/novostroyki/', '/zastroyshchiki/'],
                          'topics': ['/temy/signaly/', '/temy/rynok/'], 'articles': [{'url': f'/novosti/{s}/', 'title': t} for s, t in articles.items()]}}
out = os.path.join(ROOT, '..', 'pipeline', 'signals-digest', A.month); os.makedirs(out, exist_ok=True)
json.dump(pack, open(os.path.join(out, 'pack.json'), 'w'), ensure_ascii=False, indent=1)
print(pack['stats'], 'окно', since, '—', A.month)
