/**
 * Импорт только новых и изменённых статей из content/articles — для обычного старта контейнера (быстро, без полного прогона).
 * npm run seed:changed
 */
export {}
process.env.IMPORT_CHANGED_ONLY = '1'
await import('./import-articles')
