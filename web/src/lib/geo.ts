import { MOSCOW_DISTRICTS } from './districts'
/** Подписи для регионов, районов и классов. Неизвестный slug показываем как есть, с заглавной. */
export const REGIONS: Record<string, string> = {
  moscow: 'Москва', 'moskovskaya-oblast': 'Московская область', 'sankt-peterburg': 'Санкт-Петербург', 'omskaya-oblast': 'Омская область',
}
export const DISTRICTS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(MOSCOW_DISTRICTS).map(([k, v]) => [k, v.name])),
  danilovskiy: 'Даниловский', tekstilshchiki: 'Текстильщики', 'khoroshevo-mnevniki': 'Хорошёво-Мнёвники', zamoskvorechye: 'Замоскворечье', levoberezhnyy: 'Левобережный',
}
export const CLASS_LABELS: Record<string, string> = { comfort: 'Комфорт', business: 'Бизнес', premium: 'Премиум', deluxe: 'Делюкс' }

const cap = (s: string) => s.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())
export const regionName = (s?: string | null) => (s ? REGIONS[s] || cap(s) : '')
export const districtName = (s?: string | null) => (s ? DISTRICTS[s] || cap(s) : '')

const n1 = (x: number) => x.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
/** «от 17,6 млн ₽» или «от 3,2 млн ₽/м²» */
export function priceText(o: { priceFrom?: number | null; priceM2From?: number | null }) {
  if (o.priceFrom) return `от ${n1(o.priceFrom)} млн ₽`
  if (o.priceM2From) return o.priceM2From >= 1000 ? `от ${n1(o.priceM2From / 1000)} млн ₽/м²` : `от ${n1(o.priceM2From)} тыс. ₽/м²`
  return ''
}
export const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many
}
