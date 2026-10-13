#!/usr/bin/env python3
"""Разбор экспорта заметок (markdown + frontmatter) в один JSON.

Использование:
    python3 scripts/parse_notes.py <папка_с_заметками> data/notes.json

Чистит подпись канала, ссылки на t.me/max.ru, считает фото, внутренние ссылки,
извлекает адреса ЗУ и КРТ. Дубликаты файлов с одинаковым id склеиваются.
"""
import glob, json, os, re, sys

SIGNATURE = re.compile(r'_«Недвижимость инсайды»_.*', re.S)
CHANNEL = 't.me/propertyinsider/'

def views(v):
    m = re.match(r'([\d.]+)([KM]?)', v.strip('"'))
    if not m:
        return None
    return int(float(m.group(1)) * {'': 1, 'K': 1e3, 'M': 1e6}[m.group(2)])

def parse(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'---\n(.*?)\n---\n(.*)', raw, re.S)
    if not m:
        return None
    meta = dict(l.split(': ', 1) for l in m.group(1).split('\n') if ': ' in l)
    body = m.group(2)
    images = re.findall(r'!\[\]\((media/[^)]+)\)', body)
    text = SIGNATURE.sub('', re.sub(r'!\[\]\(media/[^)]+\)', '', body))
    links = re.findall(r'\]\((https?://[^)]+)\)', text)
    plain = re.sub(r'\[([^\]]*)\]\([^)]+\)', r'\1', text).replace('_', '').strip()
    reply = meta.get('reply_to', '').strip()
    return {
        'id': int(meta['id']),
        'date': meta['date'][:10],
        'views': views(meta.get('views', '0')),
        'reply_to': int(reply.rsplit('/', 1)[-1]) if reply.rsplit('/', 1)[-1].isdigit() else None,
        'images': images,
        'refs': sorted({int(l.rsplit('/', 1)[-1]) for l in links if CHANNEL in l and l.rsplit('/', 1)[-1].isdigit()}),
        'ext_links': [l for l in links if 't.me/' not in l and 'max.ru' not in l and 'telegram.me' not in l],
        'zu': sorted(set(a.strip() for a in re.findall(r'ЗУ\s*«([^»]+)»', plain))),
        'krt': sorted(set(a.strip() for a in re.findall(r'КРТ\s*«([^»]+)»', plain))),
        'text': plain,
        'chars': len(plain),
        'file': os.path.basename(path),
    }

def main(src, dst):
    notes = {}
    for f in sorted(glob.glob(os.path.join(src, '*.md'))):
        n = parse(f)
        if not n:
            continue
        if n['id'] in notes:  # альбом: склеиваем фото и текст
            old = notes[n['id']]
            old['images'] += [i for i in n['images'] if i not in old['images']]
            if n['chars'] > old['chars']:
                n['images'] = old['images']; notes[n['id']] = n
        else:
            notes[n['id']] = n
    out = sorted(notes.values(), key=lambda x: x['id'])
    os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
    json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(out)} заметок → {dst}')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'data/notes.json')
