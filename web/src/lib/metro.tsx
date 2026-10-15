/**
 * Станции метро и МЦК: официальные цвета линий, адреса страниц станций внутри района (/novostroyki/<район>/<станция>/)
 * и подбор проектов у станции по досье.
 */
import Link from 'next/link'
import { DISTRICT_STATS, LINE_NAMES, type Station } from './district-stats'

/** Цвета линий по схеме Московского метрополитена */
export const LINE_COLORS: Record<string, string> = {
  '1': '#EF161E', '2': '#2DBE2C', '3': '#0078BE', '4': '#00BFFF', '5': '#8D5B2D', '6': '#ED9121', '7': '#800080', '8': '#FFD702', '8А': '#FFD702',
  '9': '#999999', '10': '#99CC00', '11': '#82C0C0', '12': '#A1B3D4', '14': '#FFFFFF', '15': '#DE64A1', '16': '#03795F', '17': '#B0B0B0',
}
const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }
export const stationSlug = (name: string) => name.toLowerCase().replace(/[а-яё]/g, (c) => TR[c] ?? c).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export type StationRow = { name: string; slug: string; lines: string[]; mck: boolean }
/** Станции района без повторов (пересадочный узел с одним названием — одна станция с несколькими линиями) */
export function districtStations(key: string): StationRow[] {
  const m = new Map<string, StationRow>()
  for (const st of DISTRICT_STATS[key]?.stations || []) {
    const r = m.get(st.name) || { name: st.name, slug: stationSlug(st.name), lines: [], mck: false }
    for (const l of st.lines) if (!r.lines.includes(l)) r.lines.push(l)
    if (st.system === 'mck') r.mck = true
    m.set(st.name, r)
  }
  return [...m.values()]
}
export const lineName = (l: string) => (l === '14' ? 'МЦК' : LINE_NAMES[l] || l)

/** Кружок цвета линии; у МЦК — белый с красной обводкой, как на схеме */
export function LineDot({ line, size = 10 }: { line: string; size?: number }) {
  const c = LINE_COLORS[line] || '#bbb'
  return <i className="ln-dot" title={lineName(line)} aria-label={lineName(line)} style={{ width: size, height: size, background: c, boxShadow: line === '14' ? 'inset 0 0 0 2px #EF161E' : undefined }} />
}

/** Список станций района: кружки линий + ссылка на страницу станции */
export function StationLinks({ district, stations }: { district: string; stations: StationRow[] }) {
  return (
    <ul className="st-links">
      {stations.map((s) => (
        <li key={s.slug}><Link href={`/novostroyki/${district}/${s.slug}/`}><span className="ln-dots">{s.lines.map((l) => <LineDot key={l} line={l} />)}</span>{s.name}</Link></li>
      ))}
    </ul>
  )
}

/** Упоминание станции в тексте досье: «у метро Автозаводская», «МЦК ЗИЛ», «Автозаводская ул.» */
export function mentionsStation(text: string, name: string): boolean {
  const words = name.split(/\s+/)
  const last = words[words.length - 1]
  const stem = last.length > 6 ? last.slice(0, -2) : last
  const re = new RegExp(`(^|[^а-яёa-z])${[...words.slice(0, -1), stem].map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')}`, 'i')
  return re.test(text)
}
export type { Station }
