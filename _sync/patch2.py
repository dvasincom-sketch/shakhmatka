import os,sys,re
root=sys.argv[1]; W=os.path.join(root,'web/src')
# список сигналов: ссылки на страницы
p=os.path.join(W,'app/(frontend)/signaly/page.tsx'); s=open(p).read()
s=s.replace("import type { Object as Obj } from '@/payload-types'","import type { Object as Obj } from '@/payload-types'\nimport { signalHref, signalSlugs } from '@/lib/signals'")
s=s.replace("type Sig = { id: string;","type Sig = { id: string; href: string;")
s=s.replace("""  const all: Sig[] = objs.flatMap((o) => (o.timeline || []).filter((t) => t.certainty === 'signal').map((t) => ({ id: t.id!, date: t.date, title: t.title, confirmedOn: t.confirmedOn, outcome: t.outcome, o })))""","""  const all: Sig[] = objs.flatMap((o) => {
    const slugs = signalSlugs(o.slug, o.timeline)
    return (o.timeline || []).filter((t) => t.certainty === 'signal').map((t) => ({ id: t.id!, href: signalHref(slugs.get(t.id!) || ''), date: t.date, title: t.title, confirmedOn: t.confirmedOn, outcome: t.outcome, o }))
  })""")
s=s.replace("name: s.title, url: `${SITE}/obekty/${s.o.slug}/` }","name: s.title, url: `${SITE}${s.href}` }")
s=s.replace("""                  <p className="sig-t">{typo(s.title)}</p>""","""                  <p className="sig-t"><Link href={s.href}>{typo(s.title)}</Link></p>""")
s=s.replace("""                      <p className="tl-t">{typo(s.title)}</p>""","""                      <p className="tl-t"><Link href={s.href}>{typo(s.title)}</Link></p>""")
assert s.count('s.href')>=3, s.count('s.href')
open(p,'w').write(s)
# досье: сигналы в хронологии — ссылки
p=os.path.join(W,'app/(frontend)/obekty/[slug]/page.tsx'); s=open(p).read()
s=s.replace("import { GalleryEditor } from '@/lib/staff'","import { GalleryEditor } from '@/lib/staff'\nimport { signalHref, signalSlugs } from '@/lib/signals'")
s=s.replace("  const signals = timeline.filter((t) => t.certainty === 'signal')","  const signals = timeline.filter((t) => t.certainty === 'signal')\n  const sigSlugs = signalSlugs(o.slug, o.timeline)")
old="""                          <p className="tl-t">{t.outcome ? <span className="tl-said">Участники рынка говорили: </span> : null}{typo(t.title)}</p>"""
new="""                          <p className="tl-t">{t.outcome ? <span className="tl-said">Участники рынка говорили: </span> : null}{t.certainty === 'signal' && t.id && sigSlugs.get(t.id) ? <Link href={signalHref(sigSlugs.get(t.id)!)}>{typo(t.title)}</Link> : typo(t.title)}</p>"""
assert old in s; s=s.replace(old,new); open(p,'w').write(s)
# sitemap
p=os.path.join(W,'app/sitemap.ts'); s=open(p).read()
s=s.replace("import { pub } from '@/lib/public'","import { pub } from '@/lib/public'\nimport { signalHref, signalSlugs } from '@/lib/signals'")
s=s.replace("""  const land = landings""","""  const sigObjs = (await payload.find({ collection: 'objects', where: { signalCount: { greater_than: 0 } }, limit: 50000, depth: 0, pagination: false, select: { slug: true, timeline: true } })).docs
  const sigs = sigObjs.flatMap((o) => {
    const m = signalSlugs(o.slug as string, o.timeline as never)
    return ((o.timeline || []) as { id?: string | null; certainty?: string | null; outcome?: string | null; confirmedOn?: string | null }[])
      .filter((t) => t.certainty === 'signal' && !t.outcome && t.id && m.get(t.id))
      .map((t) => ({ url: `${ORIGIN}${signalHref(m.get(t.id!)!)}`, lastModified: t.confirmedOn ? new Date(t.confirmedOn) : undefined, changeFrequency: 'monthly' as const, priority: 0.4 }))
  })
  const land = landings""")
s=s.replace("""    ...devs.docs.map((x) =>""","""    ...sigs,
    ...devs.docs.map((x) =>""")
open(p,'w').write(s)
# стили
p=os.path.join(W,'app/(frontend)/styles.css'); c=open(p).read()
if '.sig-page' not in c:
    c+="""
/* страница сигнала */
.sig-page { display: grid; gap: 18px; max-width: 820px; margin-top: 8px; }
.sig-page .sig-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; color: var(--muted); font-size: var(--s-1); }
.sig-h { font-family: var(--f-display); font-weight: 500; font-size: clamp(22px, 3.2vw, 34px); line-height: var(--lh-head); letter-spacing: var(--ls-m); }
.sig-lead { font-size: var(--s1); line-height: var(--lh-text); }
.sig-status { padding: 16px 18px; display: grid; gap: 6px; border-left: 4px solid var(--grey); }
.sig-status b { font-weight: 600; }
.sig-status p { color: var(--muted); line-height: 1.5; }
.sig-status.st-confirmed { border-left-color: var(--ok); background: var(--ok-soft); }
.sig-status.st-unconfirmed { border-left-color: var(--coral); background: var(--coral-soft); }
.sig-status.st-pending { border-left-color: var(--sun); }
.sig-obj { padding: 16px 18px; display: grid; gap: 4px; text-decoration: none; transition: box-shadow .2s; }
.sig-obj:hover { box-shadow: var(--shadow-h); }
.sig-obj .st { color: var(--muted); font-size: var(--s-2); display: flex; align-items: center; gap: 8px; }
.sig-obj b { font-size: var(--s1); font-weight: 600; }
.sig-obj small { color: var(--muted); font-size: var(--s-1); }
.sig-obj .more-l { font-size: var(--s-1); font-weight: 500; margin-top: 4px; }
.sig-ctx .is-here .tl-t { font-weight: 600; }
.sig-t a, .tl-t a { color: inherit; text-decoration: none; background-image: linear-gradient(currentColor, currentColor); background-size: 0 1px; background-repeat: no-repeat; background-position: 0 100%; transition: background-size .2s; }
.sig-t a:hover, .tl-t a:hover { background-size: 100% 1px; }
"""
    open(p,'w').write(c)
print('ok')
