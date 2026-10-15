#!/usr/bin/env python3
"""profiles/out-*.json → web/src/lib/architect-profiles.ts (только справки с фактами)."""
import json, glob
SKIP = {'osa'}  # найденное бюро — екатеринбургское, совпадение с московским не подтверждено
P = {}
for f in sorted(glob.glob('/home/claude/pipeline/architects/profiles/out-*.json')):
    for x in json.load(open(f)):
        if x['key'] in SKIP: continue
        keep = {k: x.get(k) for k in ('founded', 'founders', 'city', 'website', 'about', 'notable', 'awards', 'staff', 'sources', 'confidence')}
        if not (keep.get('about') or keep.get('founded') or keep.get('founders')): continue
        P[x['key']] = keep
open('/home/claude/web/src/lib/architect-profiles.ts', 'w').write('''// Сгенерировано pipeline/architects/build-profiles.py из profiles/out-*.json (бриф PROFILE-BRIEF.md) — справка о бюро с источниками. Не править руками.
type Item = string | { name?: string; project?: string; title?: string; award?: string; year?: number | string | null }
export type BureauProfile = { founded?: number | null; founders?: string[] | null; city?: string | null; website?: string | null; about?: string | null; notable?: Item[] | null; awards?: Item[] | null; staff?: string | number | null; sources?: string[] | null; confidence?: string }
export const BUREAU_PROFILES: Record<string, BureauProfile> = ''' + json.dumps(P, ensure_ascii=False, indent=0) + '\n')
print(len(P), 'справок')
