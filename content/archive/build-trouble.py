"""
Проблемные проекты и бывшие долгострои: pipeline/trouble/out-*.json (бриф pipeline/trouble/BRIEF.md) →
content/objects/trouble.json и web/src/lib/trouble.ts.
Статусы на сайте: problem — проблема сейчас; rescue — был заморожен/банкрот, достраивает новый инвестор, дом ещё не сдан;
resolved — бывший долгострой: сдан, снесён или продан под новый проект.
  python3 content/archive/build-trouble.py
"""
import glob, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
# ручные уточнения статуса поверх разметки (проверено редакцией по фактам из out-*.json)
OVERRIDE = {
    'stantsiya-l': {'status': 'rescue', 'label': 'Банкротство застройщика'},   # Seven Suns банкрот, достраивают Capital Group и ПИК, дом не сдан
    'skazochnyy-les': {'status': 'rescue'},                                     # та же история Seven Suns, ввод не подтверждён
    'saltykovskaya-8': {'status': 'rescue', 'label': 'Банкротство застройщика'},  # «Косинское» банкрот с 2017, компенсационный дом не сдан
    'tankovyy-4': {'status': None},
    'neskuchnyy': {'status': 'rescue'},       # стройка встала в 2018, застройщик банкрот (2020), проект у городского Фонда защиты дольщиков с 2021, ввод не подтверждён
    'domashniy': {'status': 'rescue', 'label': 'Банкротство застройщика'},  # ПСН («Прогресс-Н») в наблюдении с 2023, 5 из 10 корпусов введены, остальное достраивает «Самолёт»
    'dmitriya-donskogo-17': {'status': None},  # продажа недостроя частному инвестору 2018 года, дальнейшее не подтверждено — уверенность низкая                                             # запрет на 18 участков в Танковом проезде, но привязки к дому 4 в источнике нет
}
rows = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'pipeline', 'trouble', 'out-*.json'))):
    data = json.load(open(f, encoding='utf-8'))
    for r in (data['objects'] if isinstance(data, dict) else data):
        r = {**r, **OVERRIDE.get(r['slug'], {})}
        if not r.get('status'): continue
        facts = sorted([x for x in r.get('facts') or [] if x.get('source')], key=lambda x: str(x['date']))
        rows[r['slug']] = {'status': r['status'], 'label': r.get('label') or 'Долгострой', 'since': str(r.get('since') or '')[:7] or None,
                           'resolvedOn': str(r.get('resolved_on') or '')[:7] or None, 'summary': r.get('summary') or '',
                           'facts': [{'date': str(x['date'])[:10], 'text': x['text'], 'source': x['source']} for x in facts], 'checked': '2026-10-15'}
json.dump({'_readme': 'Сгенерировано build-trouble.py. Статус проблемности проекта по открытым источникам.', 'objects': rows},
          open(os.path.join(ROOT, 'content', 'objects', 'trouble.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, 'web', 'src', 'lib', 'trouble.ts'), 'w', encoding='utf-8').write(
    '// Сгенерировано content/archive/build-trouble.py — не править руками.\n'
    "export type TroubleStatus = 'problem' | 'rescue' | 'resolved'\n"
    'export type Trouble = { status: TroubleStatus; label: string; since: string | null; resolvedOn: string | null; summary: string; facts: { date: string; text: string; source: string }[]; checked: string }\n'
    f'export const TROUBLE: Record<string, Trouble> = {json.dumps(rows, ensure_ascii=False)}\n'
    "export const troubleOf = (slug: string): Trouble | undefined => TROUBLE[slug]\n"
    "export const TROUBLE_BADGE: Record<TroubleStatus, string> = { problem: 'Проблемный проект', rescue: 'Проблемный · идёт достройка', resolved: 'Бывший долгострой' }\n")
from collections import Counter
print(Counter(v['status'] for v in rows.values()), len(rows))
