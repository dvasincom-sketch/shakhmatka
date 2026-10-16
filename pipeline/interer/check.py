import sys, yaml, json, re
f = sys.argv[1]; s = open(f, encoding='utf-8').read()
errs = []
if not s.startswith('---\n'): errs.append('нет шапки')
head, body = s[4:].split('\n---\n', 1)
fm = yaml.safe_load(head)
for k in ['source','status','type','title','slug','lead','topics','images','seo','faq','schema','factcheck','date_published','date_modified','author']:
    if k not in fm: errs.append('нет поля ' + k)
if fm.get('type') != 'interior': errs.append('type должен быть interior')
if 'interer' not in (fm.get('topics') or []): errs.append('topics: interer')
if not re.match(r'^interer-2026-10-' + re.escape(str(fm.get('slug'))) + r'\.md$', f.split('/')[-1]): errs.append('имя файла != interer-2026-10-<slug>.md')
seo = fm.get('seo') or {}
if len(seo.get('title','')) > 60: errs.append(f"seo.title {len(seo.get('title',''))} > 60")
d = len(seo.get('description',''))
if not 140 <= d <= 160: errs.append(f'seo.description {d}, нужно 140–160')
try: json.loads(fm.get('schema') or '')
except Exception as e: errs.append('schema не JSON: ' + str(e))
imgs = fm.get('images') or []
if not 3 <= len(imgs) <= 10: errs.append(f'фото {len(imgs)}, нужно 3–8')
for im in imgs:
    if not str(im.get('source_url','')).startswith('https://cdn.prod.website-files.com/'): errs.append('source_url не с CDN: ' + str(im.get('file')))
    if not re.match(r'^media/ntsm-[a-z0-9-]+\.webp$', str(im.get('file',''))): errs.append('file не media/ntsm-*.webp: ' + str(im.get('file')))
    if im['file'] not in body: errs.append('фото не вставлено в текст: ' + im['file'])
if len(fm.get('faq') or []) < 3: errs.append('faq < 3')
n = len(re.sub(r'\s+', ' ', body))
if not 5000 <= n <= 16000: errs.append(f'текст {n} знаков, нужно 6–12 тыс.')
if 'разрешения правообладателя' in body: errs.append('в конце статьи не нужна строка о правообладателе — источник и так в «Источниках»')
for bad in ['t.me', 'max.ru', 'телеграм', 'Telegram']:
    if bad.lower() in s.lower(): errs.append('запрещено: ' + bad)
for need in ['## Коротко', '## Вопросы и ответы', '## Источники', '/temy/interer/']:
    if need not in body: errs.append('нет: ' + need)
if not re.search(r'Для Москвы|Как повторить', body): errs.append('нет блоков «Для Москвы»/«Как повторить»')
print('OK' if not errs else 'ОШИБКИ:\n- ' + '\n- '.join(errs))
