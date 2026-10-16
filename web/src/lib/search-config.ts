/**
 * Настройки поиска, которые редакция правит в админке (глобал «Настройки поиска»):
 * синонимы, стоп-слова, допуск опечаток. Здесь — значения по умолчанию и перевод в формат Meilisearch.
 */
export type SynonymRow = { words?: string | null; mode?: 'both' | 'one' | null }
export type SearchSettingsDoc = { synonyms?: SynonymRow[] | null; stopWords?: string | null; typoOne?: number | null; typoTwo?: number | null }

const fold = (s: string) => s.replace(/ё/g, 'е').replace(/Ё/g, 'Е').toLowerCase().trim()

/** Группы взаимных синонимов: любое слово группы находит остальные */
export const DEFAULT_SYNONYMS: SynonymRow[] = [
  'крт, комплексное развитие территорий',
  'рнс, разрешение на строительство',
  'рнв, разрешение на ввод',
  'гзк, градостроительно-земельная комиссия',
  'агр, архитектурно-градостроительное решение',
  'гпзу, градостроительный план земельного участка',
  'дду, ддо, договор долевого участия',
  'мфк, многофункциональный комплекс',
  'тпу, транспортно-пересадочный узел',
  'окн, объект культурного наследия',
  'мпт, места приложения труда',
  'апарты, апартаменты',
  'новостройка, новостройки, жилой комплекс',
  'сити, москва-сити',
  'левел, level, level group',
  'мр, mr, mr group',
  'пионер, pioneer',
  'сминекс, sminex',
  'донстрой, donstroy',
  'эталон, etalon',
  'гранель, granel',
  'колди, coldy',
  'капитал груп, capital group',
  'интерьер, дизайн интерьера',
  'студия, квартира-студия',
  'евродвушка, евро-двушка, евро2',
].map((words) => ({ words, mode: 'both' as const }))

/** Служебные слова, которые не влияют на поиск: «жк на Лужнецкой» = «Лужнецкой» */
export const DEFAULT_STOP_WORDS = 'в, во, на, и, у, по, с, со, к, ко, о, об, от, до, из, за, для, при, под, над, около, жк, ул, улица, пр, пр-т, пер, д'

const words = (s?: string | null) => (s || '').split(/[,\n;]+/).map(fold).filter(Boolean)

/** Синонимы в формате Meilisearch: { слово: [замены] }; mode one — первое слово ищет остальные, но не наоборот */
export function toMeiliSynonyms(rows: SynonymRow[]): Record<string, string[]> {
  const out: Record<string, Set<string>> = {}
  const add = (k: string, vs: string[]) => { const set = (out[k] ||= new Set()); vs.forEach((v) => v !== k && set.add(v)) }
  for (const r of rows) {
    const g = [...new Set(words(r.words))]
    if (g.length < 2) continue
    if (r.mode === 'one') add(g[0], g.slice(1))
    else g.forEach((w) => add(w, g))
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]))
}

/** Часть настроек индекса, которую задаёт редакция (остальное — в lib/search.ts) */
export function editorialSettings(doc?: SearchSettingsDoc | null) {
  const rows = doc?.synonyms?.length ? doc.synonyms : DEFAULT_SYNONYMS
  const stop = doc?.stopWords != null && doc.stopWords.trim() !== '' ? doc.stopWords : DEFAULT_STOP_WORDS
  const one = Math.max(1, Number(doc?.typoOne) || 5)
  const two = Math.max(one + 1, Number(doc?.typoTwo) || 9)
  return {
    synonyms: toMeiliSynonyms(rows),
    stopWords: words(stop),
    typoTolerance: { minWordSizeForTypos: { oneTypo: one, twoTypos: two } },
  }
}
