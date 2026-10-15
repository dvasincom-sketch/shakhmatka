import type { CollectionConfig } from 'payload'
import { admins } from '../access'

/**
 * Читатели — подписчики «Следить». Не путать с сотрудниками (users): вход по ссылке из письма, без пароля,
 * своя cookie (lib/reader.ts). Публичного API нет: всё через маршруты /akkaunt/….
 */
export const Readers: CollectionConfig = {
  slug: 'readers',
  labels: { singular: 'Читатель', plural: 'Читатели' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'confirmed', 'frequency', 'follows', 'createdAt'], group: 'Читатели' },
  access: { read: admins, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true, unique: true, index: true },
    { name: 'confirmed', label: 'Подтвердил email', type: 'checkbox', defaultValue: false },
    {
      name: 'frequency', label: 'Рассылка', type: 'select', defaultValue: 'weekly',
      options: [{ label: 'Раз в неделю', value: 'weekly' }, { label: 'Каждый день', value: 'daily' }, { label: 'Не присылать', value: 'off' }],
    },
    { name: 'follows', label: 'Подписок', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'lastDigestAt', label: 'Последнее письмо', type: 'date', admin: { readOnly: true } },
    { name: 'source', label: 'Откуда пришёл', type: 'text', admin: { readOnly: true, description: 'Страница, где нажал «Следить» впервые' } },
    { name: 'loginTokenHash', type: 'text', hidden: true },
    { name: 'loginTokenExpires', type: 'date', hidden: true },
    { name: 'unsubscribeKey', type: 'text', hidden: true, index: true },
  ],
}
