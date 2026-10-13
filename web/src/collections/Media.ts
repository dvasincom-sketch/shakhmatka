import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиа' },
  access: { read: () => true },
  admin: { useAsTitle: 'alt' },
  fields: [
    { name: 'alt', label: 'Alt (что на изображении)', type: 'text', required: true, maxLength: 125 },
    { name: 'caption', label: 'Подпись', type: 'text' },
    { name: 'credit', label: 'Источник / правообладатель', type: 'text' },
  ],
  upload: { mimeTypes: ['image/*'] },
}
