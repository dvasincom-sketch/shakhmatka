"""
Районы для ручных досье из content/objects/districts-override.json (там же основание: адрес и способ — геокодирование OSM,
проверка редакцией или исследование). Пустой район заполняется, заполненный не трогаем. Объект не в Москве получает регион.
  python3 content/archive/apply-districts.py
"""
import json, glob, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OVR = json.load(open(f'{ROOT}/content/objects/districts-override.json'))
n = 0
for f in sorted(glob.glob(f'{ROOT}/content/objects/dossiers/*.json')):
    d = json.load(open(f)); v = OVR.get(d.get('slug'))
    if not v or d.get('region') != 'moscow' or d.get('district'): continue
    if v.get('region'): d['region'] = v['region']
    elif v.get('district'): d['district'] = v['district']
    else: continue
    json.dump(d, open(f, 'w'), ensure_ascii=False, indent=2); open(f, 'a').write('\n'); n += 1
print('досье с новым районом:', n)
