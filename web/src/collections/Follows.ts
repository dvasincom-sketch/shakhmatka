import type { CollectionConfig } from 'payload'
import { admins } from '../access'

export const FOLLOW_KINDS = [
  { label: 'Объект', value: 'object' },
  { label: 'Застройщик', value: 'developer' },
  { label: 'Район / регион', value: 'place' },
  { label: 'Архитектурное бюро', value: 'bureau' },
  { label: 'Все сигналы', value: 'signals' },
] as const

/** Подписки «Следить»: кто, на что, откуда. pending — email указан, но ссылка из письма ещё не открыта (это тоже интерес). */
export const Follows: CollectionConfig = {
  slug: 'follows',
  labels: { singular: 'Подписка', plural: 'Подписки' },
  admin: { useAsTitle: 'label', defaultColumns: ['label', 'kind', 'status', 'reader', 'createdAt'], group: 'Читатели' },
  access: { read: admins, create: admins, update: admins, delete: admins },
  indexes: [{ fields: ['reader', 'kind', 'key'], unique: true }],
  fields: [
    { name: 'reader', label: 'Читатель', type: 'relationship', relationTo: 'readers', required: true, index: true },
    { name: 'kind', label: 'На что', type: 'select', required: true, options: [...FOLLOW_KINDS], index: true },
    { name: 'key', label: 'Ключ (slug)', type: 'text', required: true, index: true },
    { name: 'label', label: 'Название', type: 'text' },
    { name: 'status', label: 'Статус', type: 'select', defaultValue: 'pending', options: [{ label: 'Ждёт подтверждения email', value: 'pending' }, { label: 'Активна', value: 'active' }], index: true },
    { name: 'page', label: 'Страница', type: 'text' },
  ],
}
