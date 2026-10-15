import re,sys,os
root=sys.argv[1]
p=os.path.join(root,'web/src/app/(frontend)/page.tsx'); s=open(p).read()
old_data="""  const devs = (await payload.find({ collection: 'developers', limit: 100 })).docs
  const counts = new Map<string | number, number>()
  docs.forEach((a) => (a.developers || []).forEach((d) => { const id = typeof d === 'object' ? d.id : d; counts.set(id, (counts.get(id) || 0) + 1) }))
  const topDevs = devs.filter((d) => counts.get(d.id)).sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0)).slice(0, 8)
"""
new_data="""  const topDevs = await developerBoard(payload)
"""
assert old_data in s; s=s.replace(old_data,new_data)
i=s.index("      {topDevs.length ? (")
j=s.index("      ) : null}\n",i)+len("      ) : null}\n")
s=s[:i]+"""      {topDevs.length ? (
        <section className="sec" aria-labelledby="h-dev">
          <div className="sec-h"><h2 id="h-dev" className="tt">Застройщики<span>в досье и материалах</span></h2><Link className="more" href="/zastroyshchiki/">Все застройщики</Link></div>
          <div className="dev-grid">
            {topDevs.map((d) => (
              <Link key={d.id} className="dcard card" href={`/zastroyshchiki/${d.slug}/`}>
                <div className="dc-top">
                  <span className="mono" aria-hidden="true">{initials(d.name)}</span>
                  <span className="dc-name"><b>{devName(d.name)}</b><small>{plural(d.projects, 'проект', 'проекта', 'проектов')} · {plural(d.articles, 'материал', 'материала', 'материалов')}</small></span>
                </div>
                {d.projects ? (
                  <>
                    <span className="dbar" role="img" aria-label={`Проекты по стадиям: в подготовке ${d.prep}, в продаже ${d.sales}, сдано ${d.done}`}>
                      {d.prep ? <i className="s-prep" style={{ flexGrow: d.prep }} /> : null}
                      {d.sales ? <i className="s-sales" style={{ flexGrow: d.sales }} /> : null}
                      {d.done ? <i className="s-done" style={{ flexGrow: d.done }} /> : null}
                    </span>
                    <span className="dleg">
                      {d.sales ? <span><i className="s-sales" />в продаже {d.sales}</span> : null}
                      {d.prep ? <span><i className="s-prep" />готовятся {d.prep}</span> : null}
                      {d.done ? <span><i className="s-done" />сдано {d.done}</span> : null}
                    </span>
                  </>
                ) : null}
                {d.last ? <span className="dlast"><time dateTime={d.last.date || undefined}>{ruDate(d.last.date)}</time>{typo(d.last.title)}</span> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
"""+s[j:]
s+="""
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return `${n} ${m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many}`
}
const initials = (name?: string | null) => {
  const w = devName(name).replace(/^(ГК|ПАО|АО|ООО|СЗ)\\s+/i, '').replace(/[«»"]/g, '').split(/[\\s-]+/).filter(Boolean)
  return (w.length > 1 && w[1][0] && /[A-ZА-ЯЁ]/.test(w[1][0]) ? w[0][0] + w[1][0] : w[0]?.slice(0, 2) || '').toUpperCase()
}

type DevRow = { id: number | string; slug: string; name: string; projects: number; prep: number; sales: number; done: number; articles: number; last?: { title: string; date?: string | null } }

/** Застройщики для главной: сколько проектов в досье и по каким стадиям, сколько материалов и последний из них */
async function developerBoard(payload: Awaited<ReturnType<typeof getPayload>>): Promise<DevRow[]> {
  const [devs, objs, arts] = await Promise.all([
    payload.find({ collection: 'developers', limit: 5000, pagination: false, depth: 0, select: { name: true, slug: true } }),
    payload.find({ collection: 'objects', limit: 10000, pagination: false, depth: 0, select: { developer: true, stage: true } }),
    payload.find({ collection: 'articles', where: pub(), limit: 5000, pagination: false, depth: 0, sort: '-datePublished', select: { title: true, datePublished: true, developers: true } }),
  ])
  const rows = new Map<string | number, DevRow>()
  for (const d of devs.docs) rows.set(d.id, { id: d.id, slug: d.slug as string, name: d.name as string, projects: 0, prep: 0, sales: 0, done: 0, articles: 0 })
  for (const o of objs.docs) {
    const r = rows.get((o.developer && typeof o.developer === 'object' ? o.developer.id : o.developer) as number)
    if (!r) continue
    r.projects++
    if (o.stage === 'sales') r.sales++
    else if (o.stage === 'completed') r.done++
    else r.prep++
  }
  for (const a of arts.docs) for (const d of a.developers || []) {
    const r = rows.get(typeof d === 'object' ? d.id : d)
    if (!r) continue
    r.articles++
    if (!r.last) r.last = { title: a.title as string, date: a.datePublished }
  }
  return [...rows.values()]
    .filter((r) => r.articles && r.projects >= 2)
    .sort((a, b) => b.articles * 2 + b.projects - (a.articles * 2 + a.projects))
    .slice(0, 8)
}
"""
open(p,'w').write(s)
c=os.path.join(root,'web/src/app/(frontend)/styles.css'); css=open(c).read()
old=re.search(r"\.dcard \{.*?\n\.dcard small \{[^\n]*\n",css,re.S).group(0)
css=css.replace(old,""".dcard { display: flex; flex-direction: column; gap: 12px; padding: 16px; text-decoration: none; transition: box-shadow .2s; min-width: 0; }
.dcard .dc-top { display: flex; gap: 12px; align-items: center; min-width: 0; }
.dcard .mono { width: 42px; height: 42px; flex: none; border-radius: 50%; background: var(--soft); display: grid; place-items: center; font-family: var(--f-display); font-weight: 500; font-size: 12px; }
.dcard .dc-name { min-width: 0; }
.dcard b { display: block; font-weight: 600; font-size: var(--s0); line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dcard small { color: var(--muted); font-size: var(--s-1); }
.dbar { display: flex; gap: 3px; height: 8px; }
.dbar i { display: block; min-width: 8px; border-radius: 4px; }
.s-prep { background: var(--line); } .s-sales { background: var(--sun); } .s-done { background: var(--ok); }
.dleg { display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); font-size: var(--s-2); }
.dleg span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.dleg i { width: 8px; height: 8px; border-radius: 2px; }
.dlast { border-top: 1px solid var(--line); padding-top: 10px; margin-top: auto; font-size: var(--s-1); line-height: 1.4; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.dlast time { display: block; color: var(--muted); font-size: var(--s-2); margin-bottom: 2px; }
""")
css=css.replace(".dev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",".dev-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }")
css=css.replace("  .dev-grid { grid-template-columns: repeat(3, 1fr); }","  .dev-grid { grid-template-columns: repeat(2, 1fr); }")
open(c,'w').write(css)
# entrypoint: media restore always
e=os.path.join(root,'web/docker-entrypoint.sh'); es=open(e).read()
es=es.replace('''if [ "$SEED_ON_START" = "1" ]; then''','''if [ "$SEED_ON_START" = "1" ]; then''')
es=es.replace('''      && echo "✓ импорт контента завершён" || echo "✗ импорт контента завершился с ошибкой"
  ) &
fi''','''      && echo "✓ импорт контента завершён" || echo "✗ импорт контента завершился с ошибкой"
    npm run media:restore || echo "✗ проверка фото завершилась с ошибкой"
  ) &
else
  # фото: если записи в базе есть, а файлов в хранилище нет (контейнер пересоздан) — дозагрузить из content/
  ( sleep 5; npm run media:restore || echo "✗ проверка фото завершилась с ошибкой" ) &
fi''')
open(e,'w').write(es)
pj=os.path.join(root,'web/package.json'); ps=open(pj).read()
if 'media:restore' not in ps:
    ps=ps.replace('"seed:photos":','"media:restore": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/media-restore.ts",\n    "seed:photos":')
    open(pj,'w').write(ps)
print('patched')
