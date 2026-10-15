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

/**
 * «Срез рынка»: сигнал о цене или темпе продаж на конкретную дату. Прайсы и темпы застройщики задним числом не публикуют,
 * поэтому такие сигналы почти никогда не подтверждаются открытыми источниками — но и не становятся от этого слухом:
 * это зафиксированная картина рынка на дату. Прогнозы («выйдет по…», «планируют») сюда не относятся.
 */
const SNAP_NUM = /(\d[\d\s,.]*\s*(тыс|млн|млрд)|₽|руб|в месяц|темп|лот)/i
const SNAP_FUTURE = /(возможн|планир|ожида|будет|будут|могут|может|собира|выйд|выход проекта|прогноз)/i
export function isSnapshot(t: { kind?: string | null; title?: string | null; outcome?: string | null }): boolean {
  if (t.outcome !== 'unconfirmed' || !t.title) return false
  if (SNAP_FUTURE.test(t.title)) return false
  return t.kind === 'price' || (t.kind === 'sales' && SNAP_NUM.test(t.title))
}

/** Подпись итога проверки сигнала для бейджа */
export function outcomeLabel(t: { kind?: string | null; title?: string | null; outcome?: string | null; date?: string | null }): string {
  if (isSnapshot(t)) return 'срез на дату'
  return t.outcome === 'refuted' ? 'опровергнуто' : 'не подтвердилось'
}
