"""
Новые заметки архива → конвейер «Шахматки».

Шаг 1 (этот скрипт, без сети):
  python3 pipeline/ingest/ingest-notes.py <папка с .md выгрузки tg_parser> [--media <папка media>]
  - берёт заметки с id больше последнего в pipeline/notes-text.json;
  - добавляет их в notes-text.json (тот же формат: date, views, reply, text, links, media);
  - копирует их фото в pipeline/ingest/media/;
  - пишет pipeline/ingest/to-mark-<id_от>-<id_до>.jsonl — вход для разметки по content/archive/SPEC.md.
Шаг 2 — разметка (субагент по SPEC.md): to-mark-*.jsonl → marked-*.jsonl.
Шаг 3:
  python3 pipeline/ingest/ingest-notes.py --merge pipeline/ingest/marked-<...>.jsonl
  - добавляет разметку в content/archive/notes_marked.json;
  дальше обычная цепочка: build-dossiers.py → (отсев новых кандидатов) → build-article-packs.py.
"""
import json, os, re, sys, glob, shutil, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
NOTES = os.path.join(ROOT, 'pipeline', 'notes-text.json')
MARKED = os.path.join(ROOT, 'content', 'archive', 'notes_marked.json')

ap = argparse.ArgumentParser()
ap.add_argument('src', nargs='?', help='папка с .md выгрузки (YYYY-MM-DD_<id>_<slug>.md)')
ap.add_argument('--media', help='папка с фото (<id>_<n>.jpg); по умолчанию <src>/media')
ap.add_argument('--merge', help='JSONL с разметкой новых заметок')
A = ap.parse_args()

def views(v):
    if v is None: return None
    s = str(v).strip().strip('"').upper().replace(',', '.')
    m = re.match(r'([\d.]+)\s*([KM]?)', s)
    if not m: return None
    return float(m.group(1)) * {'': 1, 'K': 1e3, 'M': 1e6}[m.group(2)]

def parse(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
    if not m: return None
    fm = dict(re.findall(r'^(\w+):\s*(.*)$', m.group(1), re.M))
    body = m.group(2)
    body = re.sub(r'^!\[\]\(media/[^)]+\)\s*$', '', body, flags=re.M)  # картинки — отдельно, числом
    body = re.sub(r'\n?_«[^»]+»_ \[_в Telegram_\].*$', '', body, flags=re.M)  # подпись канала
    body = re.sub(r'\n{3,}', '\n\n', body).strip()
    nid = int(fm['id'])
    rep = re.search(r'/(\d+)\s*$', fm.get('reply_to', '') or '')
    links = [int(x) for x in re.findall(r't\.me/propertyinsider/(\d+)', body)]
    return nid, {'date': fm['date'][:10], 'views': views(fm.get('views')), 'reply': int(rep.group(1)) if rep else None,
                 'text': body, 'links': list(dict.fromkeys(links))}

if A.merge:
    M = json.load(open(MARKED))
    n = 0
    for line in open(A.merge, encoding='utf-8'):
        line = line.strip()
        if not line: continue
        r = json.loads(line)
        M[str(r['id'])] = r; n += 1
    json.dump(M, open(MARKED, 'w'), ensure_ascii=False)
    print(f'разметка добавлена: {n}, всего {len(M)}')
    sys.exit()

N = json.load(open(NOTES))
last = max(map(int, N))
media_dir = A.media or os.path.join(A.src, 'media')
os.makedirs(os.path.join(HERE, 'media'), exist_ok=True)
new = {}
for f in sorted(glob.glob(os.path.join(A.src, '*.md'))):
    m = re.match(r'\d{4}-\d{2}-\d{2}_(\d+)_', os.path.basename(f))
    if not m or int(m.group(1)) <= last: continue
    p = parse(f)
    if not p: continue
    nid, rec = p
    imgs = sorted(glob.glob(os.path.join(media_dir, f'{nid}_*.jpg')))
    rec['media'] = len(imgs)
    for im in imgs: shutil.copy(im, os.path.join(HERE, 'media', os.path.basename(im)))
    if len(rec['text']) < 40 and not imgs: continue  # пустые служебные посты
    new[nid] = rec
if not new:
    print(f'новых заметок нет (последняя в архиве — {last})'); sys.exit()
for k, v in new.items(): N[str(k)] = v
json.dump(N, open(NOTES, 'w'), ensure_ascii=False)
lo, hi = min(new), max(new)
out = os.path.join(HERE, f'to-mark-{lo}-{hi}.jsonl')
with open(out, 'w', encoding='utf-8') as fh:
    for k in sorted(new):
        fh.write(json.dumps({'id': k, 'date': new[k]['date'], 'reply_to': new[k]['reply'], 'text': new[k]['text']}, ensure_ascii=False) + '\n')
print(f'новых заметок: {len(new)} ({lo}–{hi}), фото: {sum(v["media"] for v in new.values())}; на разметку: {out}')
