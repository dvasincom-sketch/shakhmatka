"""display_name Nominatim → ключ района из web/src/lib/districts.ts."""
import re
KEYS = [l.split('\t') for l in open('/home/claude/pipeline/geo/district-keys.txt').read().splitlines()]
NAME2KEY = {n.replace('ё', 'е').lower(): k for k, n in KEYS}
def norm(s): return s.replace('ё', 'е').lower().strip()
def district_of(display):
    for part in [p.strip() for p in display.split(',')]:
        p = norm(part)
        p2 = re.sub(r'^(район|поселение|муниципальный округ|городской округ|посёлок|поселок)\s+|\s+(район|поселение)$', '', p).strip()
        if re.search(r'район|поселение|муниципальный округ|городской округ', p) and p2 in NAME2KEY: return NAME2KEY[p2]
    for part in [p.strip() for p in display.split(',')]:  # Троицк, Щербинка — городские округа
        p2 = norm(part)
        if p2 in NAME2KEY and p2 in ('троицк', 'щербинка', 'зеленоград'): return NAME2KEY[p2]
    return None
