import type { CollectionConfig } from 'payload'
import { admins, staff } from '../access'

/**
 * Журнал поиска для аналитики: что ищут, сколько нашлось и куда перешли. Без IP и личных данных.
 * search — запрос на странице /poisk/; click — переход по результату; suggest — сессия подсказок в шапке (url — если выбрали подсказку).
 * Отчёт — /kabinet/poisk/.
 */
export const SearchEvents: CollectionConfig = {
  slug: 'search-events',
  labels: { singular: 'Событие поиска', plural: 'Журнал поиска' },
  admin: { group: 'Поиск', useAsTitle: 'q', defaultColumns: ['kind', 'q', 'hits', 'url', 'createdAt'] },
  access: { read: staff, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'kind', label: 'Событие', type: 'select', required: true, index: true, options: [{ label: 'Поиск', value: 'search' }, { label: 'Переход из результатов', value: 'click' }, { label: 'Подсказки в шапке', value: 'suggest' }] },
    { name: 'q', label: 'Запрос', type: 'text', required: true, index: true },
    { name: 'tab', label: 'Вкладка', type: 'text' },
    { name: 'hits', label: 'Нашлось', type: 'number' },
    { name: 'url', label: 'Куда перешли', type: 'text' },
    { name: 'position', label: 'Позиция', type: 'number' },
  ],
}
