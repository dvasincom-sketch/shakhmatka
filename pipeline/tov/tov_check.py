"""
Проверка переписанной статьи против оригинала (pipeline/tov/orig/<файл>):
голос меняется, факты — нет.
  python3 pipeline/tov/tov_check.py content/articles/<файл>.md
Ошибки (ERR) нужно исправить; предупреждения (WARN) — посмотреть.
"""
import re, sys, os, yaml

HERE = os.path.dirname(os.path.abspath(__file__))
path = sys.argv[1]
orig_path = os.path.join(HERE, 'orig', os.path.basename(path))

def load(p):
    s = open(p, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n?(.*)$', s, re.S)
    return yaml.safe_load(m.group(1)), m.group(2)

fm0, b0 = load(orig_path)
fm1, b1 = load(path)
err, warn = [], []

# 1. шапка: меняются только тексты
FREE = {'title', 'title_alts', 'lead', 'seo', 'faq', 'h1'}
for k in set(fm0) | set(fm1):
    if k in FREE: continue
    if fm0.get(k) != fm1.get(k): err.append(f'поле шапки «{k}» изменено — его трогать нельзя')
s0, s1 = fm0.get('seo') or {}, fm1.get('seo') or {}
for k in set(s0) | set(s1):
    if k in ('title', 'description'): continue
    if s0.get(k) != s1.get(k): err.append(f'seo.{k} изменено — менять можно только seo.title и seo.description')
if s1.get('title') and len(s1['title']) > 60: err.append(f"seo.title {len(s1['title'])} знаков (нужно ≤ 60)")
if s1.get('description') and not 130 <= len(s1['description']) <= 165: err.append(f"seo.description {len(s1['description'])} знаков (нужно 140–160)")
if len(fm0.get('faq') or []) != len(fm1.get('faq') or []): err.append('число вопросов в faq изменилось')

def text_of(fm, body):
    faq = ' '.join(f"{x.get('q', '')} {x.get('a', '')}" for x in (fm.get('faq') or []))
    return f"{fm.get('title', '')} {' '.join(fm.get('title_alts') or [])} {fm.get('lead', '')} {faq} {body}"
t0, t1 = text_of(fm0, b0), text_of(fm1, b1)

# 2. цифры: новых быть не должно
def nums(t):
    t = re.sub(r'\]\([^)]*\)', ']', t)  # без адресов ссылок
    t = re.sub(r'(?<=\d)[  ](?=\d{3}\b)', '', t)  # 1 200 → 1200
    return set(re.findall(r'\d+(?:[.,]\d+)?', t))
n0, n1 = nums(t0), nums(t1)
added = sorted(n1 - n0, key=lambda x: float(x.replace(',', '.')))
if added: err.append(f'новые числа, которых не было в оригинале: {", ".join(added[:15])} — если это перестановка (например «2025-го»), перепиши без новой цифры')
lost = n0 - n1
if n0 and len(lost) / len(n0) > 0.25: warn.append(f'пропало {len(lost)} из {len(n0)} чисел оригинала: {", ".join(sorted(lost)[:12])} — факты не терять')

# 3. ссылки и картинки
links = lambda b: set(re.findall(r'\]\(([^)\s]+)', b))
l0, l1 = links(b0), links(b1)
if l1 - l0: err.append(f'новые ссылки: {", ".join(sorted(l1 - l0))}')
lost_l = {x for x in l0 - l1 if not x.startswith('media/')}
if lost_l: warn.append(f'пропали ссылки: {", ".join(sorted(lost_l))}')
img0 = re.findall(r'!\[[^\]]*\]\((media/[^)]+)\)', b0); img1 = re.findall(r'!\[[^\]]*\]\((media/[^)]+)\)', b1)
if sorted(img0) != sorted(img1): err.append('набор картинок в тексте изменился')

# 4. обязательные разделы
for h in ['## Источники', '## Карточка объекта', '## Вопросы и ответы']:
    if h in b0 and h not in b1: err.append(f'пропал раздел «{h}»')
if 'Материал не является инвестиционной рекомендацией' in b0 and 'Материал не является инвестиционной рекомендацией' not in b1: err.append('пропала строка про инвестиционную рекомендацию')
if len(re.findall(r'^# ', b1, re.M)) != 1: err.append('в тексте должен быть ровно один H1')

# 5. длина
r = len(b1) / max(1, len(b0))
if r < 0.7: err.append(f'текст стал короче на {round((1 - r) * 100)}% — не выбрасывай факты')
if r > 1.35: warn.append(f'текст стал длиннее на {round((r - 1) * 100)}% — не раздувай')

# 6. запрещённое
BAN = [r'в заметке', r'по заметке', r'заметк[аеиуы]\b', r'подтвердить не удалось', r'не удалось подтвердить', r'мы не нашли', r'не нашли подтвержд',
       r'редакция провер', r'в открытых источниках (нет|не)', r'\bканал(?!\s+им)', r'telegram', r'телеграм', r't\.me', r'max\.ru', r'инсайд',
       r'осуществля', r'\bявляется\b', r'\bданн(ый|ая|ое|ого|ой)\b', r'на сегодняшний день', r'в рамках реализации', r'уникальн']
src_body = re.split(r'^## Источники', b1, flags=re.M)[0]
hay = f"{fm1.get('lead', '')} {src_body}"
for b in BAN:
    for m in re.finditer(b, hay, re.I):
        ctx = hay[max(0, m.start() - 30):m.end() + 30]
        if 'уникальн' in b and '«' in ctx: continue  # цитата застройщика в кавычках
        err.append(f'запрещённое «{m.group(0)}»: …{ctx.strip()}…'); break

print(f'{os.path.basename(path)}: ' + ('OK' if not err else 'ERR'))
for e in err: print('  ERR', e)
for w in warn: print('  WARN', w)
sys.exit(1 if err else 0)
