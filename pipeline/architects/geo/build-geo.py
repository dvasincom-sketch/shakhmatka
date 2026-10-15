"""Город и страна архбюро для плашек /arhitektory/: справки profiles + geo/out-*.json → web/src/lib/bureau-geo.ts"""
import json, re, os
ROOT = '/home/claude/web/src/lib'
s = open(f'{ROOT}/architect-profiles.ts').read(); k = 'Record<string, BureauProfile> = '
P = json.loads(s[s.index(k) + len(k):].strip().rstrip(';'))
CITY_CC = {'Москва': 'RU', 'Санкт-Петербург': 'RU', 'Екатеринбург': 'RU', 'Краснодар': 'RU', 'Пенза': 'RU', 'Ростов-на-Дону': 'RU', 'Роттердам': 'NL', 'Амстердам': 'NL', 'Делфт': 'NL',
           'Токио': 'JP', 'Нью-Йорк': 'US', 'Чикаго': 'US', 'Лондон': 'GB', 'Манчестер': 'GB', 'Берлин': 'DE', 'Париж': 'FR', 'Стамбул': 'TR', 'Пекин': 'CN', 'Киев': 'UA', 'Лидс': 'GB', 'Базель': 'CH', 'Вена': 'AT'}
COUNTRY = {'Нидерланды': 'NL', 'Япония': 'JP', 'Великобритания': 'GB', 'США': 'US', 'Германия': 'DE', 'Швеция': 'SE'}
out = {}
for key, p in P.items():
    c = (p.get('city') or '').strip()
    if not c: continue
    first = re.split(r'[,(;]', c)[0].strip()
    cc = CITY_CC.get(first) or next((v for n, v in COUNTRY.items() if n in c), None)
    city = first if first in CITY_CC else None
    if cc: out[key] = {'cc': cc, 'city': city, 'founded': p.get('founded')}
for f in ('geo/out-0.json', 'geo/out-1.json'):
    for r in json.load(open(f)):
        if not r.get('city') or r.get('confidence') == 'low' or not r.get('country'): continue
        out.setdefault(r['key'], {'cc': r['country'].upper(), 'city': r['city'], 'founded': r.get('founded')})
FLAG = lambda cc: ''.join(chr(0x1F1E6 + ord(ch) - 65) for ch in cc)
NAME = {'RU': 'Россия', 'GB': 'Великобритания', 'US': 'США', 'NL': 'Нидерланды', 'DE': 'Германия', 'FR': 'Франция', 'JP': 'Япония', 'TR': 'Турция', 'CN': 'Китай', 'UA': 'Украина', 'SE': 'Швеция', 'CH': 'Швейцария', 'AT': 'Австрия', 'IT': 'Италия', 'ES': 'Испания', 'DK': 'Дания', 'AE': 'ОАЭ'}
for v in out.values(): v['flag'] = FLAG(v['cc']); v['country'] = NAME.get(v['cc'], v['cc'])
open(f'{ROOT}/bureau-geo.ts', 'w').write('// Сгенерировано pipeline/architects/geo/build-geo.py: страна и город головного офиса бюро (справки + проверка по сайтам и энциклопедиям). Не править руками.\n'
    'export type BureauGeo = { cc: string; flag: string; country: string; city: string | null; founded?: number | null }\n'
    f'export const BUREAU_GEO: Record<string, BureauGeo> = {json.dumps(out, ensure_ascii=False)}\n')
import collections; print(len(out), collections.Counter(v['cc'] for v in out.values()))
