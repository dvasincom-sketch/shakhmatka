/**
 * Адреса страниц сигналов: /signaly/<объект>-<ГГГГ-ММ-ДД>/ (если в один день у объекта два сигнала — суффикс -2, -3).
 * Адрес строится из slug объекта и даты сигнала, поэтому не меняется при повторном импорте досье.
 */
type TL = { id?: string | null; date: string; certainty?: string | null }

export function signalSlugs(objSlug: string, timeline: TL[] | null | undefined): Map<string, string> {
  const out = new Map<string, string>()
  const seen = new Map<string, number>()
  const sigs = [...(timeline || [])].filter((t) => t.certainty === 'signal').sort((a, b) => +new Date(a.date) - +new Date(b.date))
  for (const t of sigs) {
    const day = t.date.slice(0, 10)
    const n = (seen.get(day) || 0) + 1
    seen.set(day, n)
    if (t.id) out.set(t.id, `${objSlug}-${day}${n > 1 ? `-${n}` : ''}`)
  }
  return out
}

/** Разбор адреса сигнала: slug объекта и дата (суффикс -2 и т. д. остаётся в полном адресе) */
export function parseSignalSlug(slug: string): { obj: string; day: string } | null {
  const m = decodeURIComponent(slug).match(/^(.+)-(\d{4}-\d{2}-\d{2})(?:-\d+)?$/)
  return m ? { obj: m[1], day: m[2] } : null
}

export const signalHref = (s: string) => `/signaly/${s}/`
