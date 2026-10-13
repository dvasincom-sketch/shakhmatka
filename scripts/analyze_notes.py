#!/usr/bin/env python3
"""Сводка по заметкам: темы, застройщики, участки, цепочки.

    python3 scripts/analyze_notes.py data/notes.json
"""
import json, re, sys
from collections import Counter

DEVELOPERS = {
    'mr-group': r'\bMR\b|МР Груп', 'pik': r'\bПИК\w*', 'sminex': r'Sminex|Сминекс',
    'stone': r'\bStone\b|Стоун', 'granel': r'Гранел', 'fsk': r'\bФСК\b|1-й ДСК',
    'pioneer': r'Пионер', 'etalon': r'Эталон|AURIX', 'samolet': r'Самол[её]т',
    'level': r'\bLevel\b|Левел', 'lsr': r'\bЛСР', 'akvilon': r'Аквилон', 'a101': r'А101|A101',
    'sezar': r'Sezar|Сезар', 'glorax': r'Глоракс|GloraX|Glorax', 'gals': r'Галс',
    'tekta': r'Текта|Tekta', 'donstroy': r'Донстро', 'brusnika': r'Брусник',
}
TOPICS = {
    'земля и сделки': r'ЗУ «|участ|аукцион|купил|продал|сделк|торги|банкрот|суд',
    'архитектура': r'фасад|архитектур|бюро|концепци|АГР|визуализ',
    'регулирование': r'МПТ|ВРИ|ГЗК|ППТ|постановлен|КРТ|льгот',
    'старты и цены': r'старт продаж|вывел|прайс|бронирован|тыс\. руб\./кв\. м|ключи',
    'рынок': r'ДДУ|регистрац|ипотек|ЦБ|ключев|итоги',
    'компании и люди': r'назначен|руководител|перестановк|директор|выручк|акционер',
}

def main(path):
    N = json.load(open(path, encoding='utf-8'))
    print(f'Заметок: {len(N)}, период {N[0]["date"]} — {N[-1]["date"]}')
    for name, p in TOPICS.items():
        print(f'  {name}: {sum(1 for o in N if re.search(p, o["text"]))}')
    dev = Counter({d: sum(1 for o in N if re.search(p, o['text'])) for d, p in DEVELOPERS.items()})
    print('Застройщики:', dev.most_common(12))
    zu = Counter(z for o in N for z in o['zu'])
    print(f'Участков: {len(zu)}, упомянуты ≥2 раз: {sum(1 for v in zu.values() if v > 1)}')
    print('Топ участков:', zu.most_common(10))

if __name__ == '__main__':
    main(sys.argv[1])
