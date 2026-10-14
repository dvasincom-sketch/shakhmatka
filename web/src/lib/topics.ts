/** Темы материалов: /temy/<slug>/. Значения — из поля «Темы» статьи. */
export const TOPICS: Record<string, { label: string; subject: string }> = {
  ceny: { label: 'Цены', subject: 'Цены на новостройки' },
  rynok: { label: 'Рынок', subject: 'Рынок новостроек' },
  regulirovanie: { label: 'Регулирование', subject: 'Законы и регулирование' },
  ipoteka: { label: 'Ипотека', subject: 'Ипотека на новостройки' },
  premium: { label: 'Премиум', subject: 'Премиальные новостройки' },
  krt: { label: 'КРТ', subject: 'Комплексное развитие территорий' },
  arhitektura: { label: 'Архитектура', subject: 'Как менялись проекты новостроек' },
  signaly: { label: 'Сигналы', subject: 'Говорили раньше всех: сигналы рынка и что подтвердилось' },
}
export const topicLabel = (s: string) => TOPICS[s]?.label || s.charAt(0).toUpperCase() + s.slice(1)
export const topicSubject = (s: string) => TOPICS[s]?.subject || topicLabel(s)
