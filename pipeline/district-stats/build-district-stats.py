#!/usr/bin/env python3
"""Собирает web/src/lib/district-stats.ts из выгрузок pipeline/district-stats:
population-wiki.tsv  — районы Москвы: название|округ|площадь км²|население на 1.01.2025 (Росстат, через ru.wikipedia «Районы Москвы»)
settlements-wiki.tsv — бывшие поселения ТиНАО: название|площадь км² (2012)|население на 1.01.2024|в какой район вошли (ru.wikipedia «Поселения Москвы»)
stations-metro.txt   — станции метро и МЦК по районам: Район:Станция/линии;… (координаты станций — ru.wikipedia «Список станций Московского метрополитена», район — по границам районов OpenStreetMap)
"""
import json, re, pathlib
D = pathlib.Path(__file__).parent
ROOT = D.parent.parent
keys = {}
for line in (D.parent / 'districts-fill/districts-list.txt').read_text().splitlines():
    for name, key in re.findall(r'([А-ЯЁа-яё \-]+?) = ([a-z0-9-]+)', line.split(':', 1)[1]):
        keys[name.strip()] = key
norm = lambda s: s.replace('ё', 'е').replace('Ё', 'Е').lower()
nk = {norm(k): v for k, v in keys.items()}

ROSSTAT25 = 'https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx'
WIKI_R = 'https://ru.wikipedia.org/wiki/Районы_Москвы'
WIKI_P = 'https://ru.wikipedia.org/wiki/Поселения_Москвы'
STATIONS_SRC = 'https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена'
SKIP_NEW = {'Внуково', 'Коммунарка', 'Филимонковский', 'Щербинка', 'Троицк', 'Бекасово', 'Вороново', 'Краснопахорский'}  # районы ТиНАО с 2024 года: у нас ключи — прежние поселения

out = {}
for l in (D / 'population-wiki.tsv').read_text().splitlines():
    name, okrug, area, pop = l.split('|')
    if okrug in ('НАО', 'ТАО'):
        continue  # новые районы ТиНАО — для поселений ниже
    k = nk.get(norm(name))
    if not k:
        print('нет ключа', name); continue
    if k == 'vnukovo':
        continue  # район Внуково в 2024 году объединён с поселениями — старых границ нет
    out[k] = {'population': int(pop), 'populationYear': 'на 1 января 2025 года, Росстат', 'populationSource': ROSSTAT25,
              'areaKm2': float(area.replace(',', '.')), 'areaSource': WIKI_R}
for l in (D / 'settlements-wiki.tsv').read_text().splitlines():
    name, area, pop, into = l.split('|')
    k = nk.get(norm(name)) or nk.get(norm(name.replace('Клёновское', 'Кленовское')))
    if not k:
        print('нет ключа', name); continue
    out[k] = {'population': int(pop), 'populationYear': 'на 1 января 2024 года, Росстат', 'populationSource': WIKI_P,
              'areaKm2': float(area.replace(',', '.')), 'areaSource': WIKI_P,
              'note': f'Поселение упразднено 8 мая 2024 года и вошло в {"район" if "," not in into else "районы"} {into}.' if into != name else f'С 8 мая 2024 года — центр района {into}, в который вошли и соседние поселения.' }
LINE_NAMES = {'1': 'Сокольническая', '2': 'Замоскворецкая', '3': 'Арбатско-Покровская', '4': 'Филёвская', '5': 'Кольцевая', '6': 'Калужско-Рижская',
              '7': 'Таганско-Краснопресненская', '8': 'Калининская', '8А': 'Солнцевская', '9': 'Серпуховско-Тимирязевская', '10': 'Люблинско-Дмитровская',
              '11': 'Большая кольцевая', '12': 'Бутовская', '14': 'МЦК', '15': 'Некрасовская', '16': 'Троицкая', '17': 'Рублёво-Архангельская'}
for l in (D / 'stations-metro.txt').read_text().splitlines():
    dname, rest = l.split(':', 1)
    if dname in SKIP_NEW:
        continue
    k = nk.get(norm(dname))
    if not k:
        print('нет ключа (станции)', dname); continue
    sts = []
    for item in rest.split(';'):
        n, ls = item.rsplit('/', 1)
        lines = ls.split(',')
        metro = [x for x in lines if x != '14']
        if metro: sts.append({'name': n, 'system': 'metro', 'lines': metro})
        if '14' in lines: sts.append({'name': n, 'system': 'mck', 'lines': ['14']})
    out.setdefault(k, {})['stations'] = sts
    out[k]['stationsSource'] = STATIONS_SRC
ts = f'''/**
 * Справка о районах: население, площадь, станции метро и МЦК. СГЕНЕРИРОВАНО pipeline/district-stats/build-district-stats.py — руками не править.
 * Население — Росстат (районы: на 1.01.2025; бывшие поселения ТиНАО: на 1.01.2024). Станции — по координатам станций и границам районов OpenStreetMap, октябрь 2026.
 * МЦД пока не размечены.
 */
export type Station = {{ name: string; system: 'metro' | 'mck' | 'mcd'; lines: string[] }}
export type DistrictStats = {{ population?: number; populationYear?: string; populationSource?: string; areaKm2?: number; areaSource?: string; note?: string; stations?: Station[]; stationsSource?: string }}
export const LINE_NAMES: Record<string, string> = {json.dumps(LINE_NAMES, ensure_ascii=False)}
export const DISTRICT_STATS: Record<string, DistrictStats> = {json.dumps(out, ensure_ascii=False, indent=0)}
'''
(ROOT / 'web/src/lib/district-stats.ts').write_text(ts)
missing = [k for k in keys.values() if k not in out]
print(len(out), 'районов; с населением', sum(1 for v in out.values() if 'population' in v), '; со станциями', sum(1 for v in out.values() if v.get('stations')), '; без данных:', missing)
