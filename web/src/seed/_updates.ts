/**
 * Логика применения content/objects/updates.json к объектам: новые события хронологии, стадия, район, псевдонимы, описание.
 * Вынесена отдельно от запуска (object-updates.ts), чтобы её можно было проверить без базы.
 *
 * Формат записи (ключ — slug объекта, ключи на «_» пропускаются):
 *   { checked: "2026-10-16",                      — когда проверяли
 *     stage?: "completed" | null,                 — новая стадия; null — не менять
 *     district?: "chertanovo-yuzhnoe",            — исправить район (ключ из places)
 *     aliases?: ["Расцветай в Люблино"],          — дописать другие названия
 *     summary?: "…",                              — начало описания вместо автоматического (хвост «В досье N событий…» допишется сам)
 *     events: [{ date: "YYYY-MM-DD", dateLabel?, kind, title, source, weak? }],
 *     note?: "…" }                                — для редакции, в базу не пишется
 * source и weak (источник слабый: агрегатор, форум) остаются в файле, на сайте не показываются.
 */

export type UpdEvent = { date: string; dateLabel?: string; kind: string; title: string; source?: string; weak?: boolean; certainty?: 'fact' | 'signal' }
export type Upd = { checked?: string; stage?: string | null; district?: string; aliases?: string[]; summary?: string; events?: UpdEvent[]; note?: string }

export type TL = { id?: string | null; date: string; dateLabel?: string | null; kind?: string | null; title: string; certainty?: string | null; [k: string]: unknown }
export type Obj = { id: number | string; slug: string; name: string; stage?: string | null; district?: string | null; summary?: string | null; aliases?: { id?: string | null; value?: string | null }[] | null; timeline?: TL[] | null }

const day = (d: string) => String(d).slice(0, 10)
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[«»"„“”.,:;!?()\-–—\s]+/g, ' ').trim()
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many
}
const AUTO_TAIL = /\s*В досье \d+ событ[^]*$/

/** Хвост описания в том же виде, что пишет content/archive/build-dossiers.py (make_summary) */
export function summaryTail(tl: TL[]): string {
  const ds = tl.map((t) => day(t.date)).sort()
  if (!ds.length) return ''
  const y0 = ds[0].slice(0, 4), y1 = ds[ds.length - 1].slice(0, 4)
  const nsig = tl.filter((t) => t.certainty === 'signal').length
  return `В досье ${tl.length} ${plural(tl.length, 'событие', 'события', 'событий')} ` + (y0 !== y1 ? `с ${y0} по ${y1} год` : `${y0} года`)
    + (nsig ? `, из них ${nsig} — ${plural(nsig, 'сигнал', 'сигнала', 'сигналов')} до официальных новостей` : '') + '.'
}

/** Такое событие уже есть: тот же день и тот же заголовок или тот же тип (заголовок могли поправить в админке) */
export function isDup(tl: TL[], e: UpdEvent): boolean {
  return tl.some((t) => day(t.date) === e.date && (norm(t.title) === norm(e.title) || t.kind === e.kind))
}

export type Plan = { data: Record<string, unknown>; added: UpdEvent[]; skipped: UpdEvent[]; changes: string[] }

/** Что поменять в объекте. Пустой data — менять нечего (повторный запуск). */
export function planUpdate(o: Obj, u: Upd): Plan {
  const tl = [...(o.timeline || [])]
  const added: UpdEvent[] = [], skipped: UpdEvent[] = [], changes: string[] = []
  const data: Record<string, unknown> = {}

  for (const e of u.events || []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error(`${o.slug}: дата «${e.date}» не в формате ГГГГ-ММ-ДД`)
    if (isDup(tl, e)) { skipped.push(e); continue }
    tl.push({ date: e.date, dateLabel: e.dateLabel || null, kind: e.kind, title: e.title, certainty: e.certainty || 'fact', verified: false })
    added.push(e)
  }
  if (added.length) {
    tl.sort((a, b) => day(a.date).localeCompare(day(b.date)))
    data.timeline = tl
    changes.push(`+${added.length} ${plural(added.length, 'событие', 'события', 'событий')}`)
  }

  if (u.stage && u.stage !== o.stage) { data.stage = u.stage; changes.push(`стадия ${o.stage || '—'} → ${u.stage}`) }
  if (u.district && u.district !== o.district) { data.district = u.district; changes.push(`район ${o.district || '—'} → ${u.district}`) }

  const have = new Set((o.aliases || []).map((a) => norm(a.value || '')))
  const newAliases = (u.aliases || []).filter((a) => !have.has(norm(a)) && norm(a) !== norm(o.name))
  if (newAliases.length) {
    data.aliases = [...(o.aliases || []), ...newAliases.map((value) => ({ value }))]
    changes.push(`псевдонимы +${newAliases.join(', ')}`)
  }

  // описание: пересобираем, только если в объекте что-то поменялось и оно автоматическое (с хвостом «В досье N событий…») или задано в файле
  const cur = o.summary || ''
  if (changes.length && (u.summary || AUTO_TAIL.test(cur))) {
    const head = (u.summary || cur.replace(AUTO_TAIL, '')).trim()
    const stage = (data.stage as string) || o.stage
    const done = stage === 'completed' && !/сдан|введ[её]н/i.test(head) ? ' Проект сдан.' : ''
    const next = `${head}${done} ${summaryTail(tl)}`.trim()
    if (next !== cur) { data.summary = next; changes.push('описание') }
  }
  return { data, added, skipped, changes }
}
