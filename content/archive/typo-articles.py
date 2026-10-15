"""
Ёлочки вокруг названий застройщиков в статьях (тело, title, lead) по правилам typo_ru.py.
  python3 content/archive/typo-articles.py [--dry]
Ссылки markdown, картинки, код и YAML-ключи не трогаем; правится только текст.
"""
import json, glob, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from typo_ru import quote_names
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
AD = json.load(open(f'{ROOT}/content/objects/archive-dossiers.json'))
exec(open(f'{HERE}/typo-dossiers.py').read().split('SKIPN = ')[1].split('\n')[0].join(['SKIPN = ', '']))
NAMES = [d['name'] for d in AD['developers'] if d['name'] not in SKIPN] + ['Мортон', 'Ведис']
dry = '--dry' in sys.argv
SPLIT = re.compile(r'(\]\([^)]*\)|!\[[^\]]*\]\([^)]*\)|`[^`]*`|https?://\S+)')
def fix(text):
    out = []
    for part in SPLIT.split(text):
        out.append(part if SPLIT.fullmatch(part or '') else quote_names(part, NAMES))
    return ''.join(out)
# «Основа проекта», «Эталон для» — нарицательные в начале фразы: не трогаем, если следом идёт строчное слово-не-глагол
FALSE = re.compile(r'«(Основ[аы]|Эталон[ау]?)» (проекта|для|всего|подхода|рынка|концепции|стратегии|района|бизнеса|— досье|— данные|— реестр|такой)')
n = 0
for f in sorted(glob.glob(f'{ROOT}/content/articles/*.md')):
    raw = open(f).read()
    if not raw.startswith('---'): continue
    _, fm, body = raw.split('---', 2)
    fm2 = re.sub(r'^(title|lead): (.*)$', lambda m: f'{m.group(1)}: {fix(m.group(2))}', fm, flags=re.M)
    body2 = fix(body)
    new = FALSE.sub(r'\1 \2', f'---{fm2}---{body2}')
    if new != raw:
        n += 1
        if dry:
            for a, b in zip(raw.splitlines(), new.splitlines()):
                if a != b: print(os.path.basename(f)[:40], '|', b[:200])
        else: open(f, 'w').write(new)
print('статей с правками:', n)
