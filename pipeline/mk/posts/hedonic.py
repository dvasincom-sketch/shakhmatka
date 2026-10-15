"""
Сопоставимые цены «Московских кварталов»: гедонический индекс с фиксированными эффектами домов.
log(₽/м²) = эффект дома + эффект месяца + β·log(площадь) + этаж (1-й, 2–3, верхние) + комнаты + аукцион + ε
Месячный индекс выделяется по домам, квартиры которых выставлялись в разные месяцы. Сопоставимая цена дома —
прогноз модели для «стандартной» квартиры (2 комнаты, 55 м², средний этаж, не аукцион) в последнем месяце наблюдений.
Выход: hedonic.json {index: {month: коэффициент к базовому месяцу}, houses: {url: {std, n, se}}, r2, n}
"""
import json, numpy as np, collections, math
H = json.load(open('/home/claude/pipeline/mk/posts/houses.json'))
F = [(h['url'], f['date'][:7], f['ppm'], f['area'], f.get('floor') or 0, str(f.get('rooms') or ''), bool(f.get('auction'))) for h in H for f in h['flats'] if f.get('ppm') and f.get('area')]
# месяц, в котором нет ни одного дома, выставлявшегося и в другие месяцы, индекс не определяет — сливаем с предыдущим
def link_ok(F):
    bym = collections.defaultdict(set); byh = collections.defaultdict(set)
    for x in F: bym[x[1]].add(x[0]); byh[x[0]].add(x[1])
    return {m: any(len(byh[h]) > 1 for h in hs) for m, hs in bym.items()}
MERGE = {}
while True:
    ok = link_ok(F); bad = [m for m in sorted(ok) if not ok[m] and m != min(ok)]
    if not bad: break
    m = bad[-1]; prev = max(x for x in ok if x < m); MERGE[m] = prev
    F = [(a, prev if b == m else b, *rest) for a, b, *rest in F]
houses = sorted({x[0] for x in F}); months = sorted({x[1] for x in F})
hi = {h: i for i, h in enumerate(houses)}; mi = {m: i for i, m in enumerate(months)}
ROOMS = ['1', '2', '3', '4']  # студии/прочее — базовая
def row(h, m, area, floor, rooms, auction):
    x = np.zeros(len(houses) + len(months) - 1 + 1 + 2 + len(ROOMS) + 1)
    x[hi[h]] = 1
    if mi[m] > 0: x[len(houses) + mi[m] - 1] = 1
    k = len(houses) + len(months) - 1
    x[k] = math.log(area); k += 1
    x[k] = 1 if floor == 1 else 0; x[k + 1] = 1 if floor >= 15 else 0; k += 2
    for j, r in enumerate(ROOMS): x[k + j] = 1 if rooms.startswith(r) else 0
    k += len(ROOMS); x[k] = 1 if auction else 0
    return x
X = np.array([row(*f[:2], f[3], f[4], f[5], f[6]) for f in F]); y = np.log([f[2] for f in F])
beta, *_ = np.linalg.lstsq(X, y, rcond=None)
res = y - X @ beta; n, p = X.shape; s2 = (res @ res) / (n - p)
r2 = 1 - (res @ res) / ((y - y.mean()) @ (y - y.mean()))
cov = s2 * np.linalg.pinv(X.T @ X)
idx = {months[0]: 1.0, **{m: math.exp(beta[len(houses) + i - 1]) for m, i in mi.items() if i > 0}}
idx_se = {m: (float(math.sqrt(cov[len(houses) + i - 1, len(houses) + i - 1])) if i > 0 else 0.0) for m, i in mi.items()}
last = months[-1]
out = {}
cnt = collections.Counter(x[0] for x in F)
for h in houses:
    x = row(h, last, 55.0, 8, '2', False)
    v = float(x @ beta); se = float(math.sqrt(x @ cov @ x))
    out[h] = {'std': round(math.exp(v)), 'n': cnt[h], 'se': round(se, 3)}
json.dump({'merged': MERGE, 'base': months[0], 'to': last, 'index': {m: round(v, 4) for m, v in idx.items()}, 'index_se': {m: round(v, 4) for m, v in idx_se.items()}, 'houses': out, 'r2': round(float(r2), 3), 'n': n, 'houses_n': len(houses),
           'beta_area': round(float(beta[len(houses) + len(months) - 1]), 3)}, open('/home/claude/pipeline/mk/posts/hedonic.json', 'w'), ensure_ascii=False, indent=1)
print('n', n, 'R2', round(r2, 3), 'β log(area)', round(beta[len(houses)+len(months)-1], 3))
for m in months: print(m, round(idx[m], 3), '±', round(1.96 * idx_se[m], 3))
