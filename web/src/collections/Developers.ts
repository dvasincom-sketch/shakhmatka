import type { CollectionConfig } from 'payload'

export const Developers: CollectionConfig = {
  slug: 'developers',
  labels: { singular: 'Застройщик', plural: 'Застройщики' },
  access: { read: () => true },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'updatedAt'] },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'slug', label: 'Slug (URL)', type: 'text', required: true, unique: true, index: true, admin: { description: '/zastroyshchiki/<slug>/' } },
    { name: 'legalNames', label: 'Юрлица', type: 'array', fields: [{ name: 'value', label: 'Юрлицо / ИНН', type: 'text' }] },
    { name: 'about', label: 'Коротко о компании', type: 'textarea' },
  ],
}
