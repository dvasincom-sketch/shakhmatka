import type { CollectionConfig } from 'payload'
import { admins, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
  auth: { tokenExpiration: 60 * 60 * 24 * 30 },
  access: {
    read: ({ req }) => (isAdmin(req.user as never) ? true : req.user ? { id: { equals: req.user.id } } : false),
    create: admins,
    update: ({ req }) => (isAdmin(req.user as never) ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: admins,
  },
  hooks: {
    // первый пользователь в пустой базе — всегда администратор
    beforeChange: [async ({ data, operation, req }) => {
      if (operation === 'create') {
        const { totalDocs } = await req.payload.count({ collection: 'users' })
        if (!totalDocs) data.role = 'admin'
      }
      return data
    }],
  },
  fields: [
    { name: 'name', label: 'Имя', type: 'text' },
    {
      name: 'role', label: 'Роль', type: 'select', defaultValue: 'editor', saveToJWT: true,
      options: [{ label: 'Администратор — всё, включая пользователей', value: 'admin' }, { label: 'Редактор — досье и фото', value: 'editor' }],
      access: { update: ({ req }) => isAdmin(req.user as never) },
    },
  ],
}
