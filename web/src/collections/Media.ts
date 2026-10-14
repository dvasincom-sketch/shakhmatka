import type { CollectionConfig } from 'payload'
import { admins, staff } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиа' },
  access: { read: () => true, create: staff, update: staff, delete: admins },
  admin: { useAsTitle: 'alt' },
  fields: [
    { name: 'alt', label: 'Alt (что на изображении)', type: 'text', required: true, maxLength: 125 },
    { name: 'caption', label: 'Подпись', type: 'text' },
    { name: 'credit', label: 'Источник / правообладатель', type: 'text' },
  ],
  upload: {
    mimeTypes: ['image/*'],
    // уменьшенная копия для карточек каталога и подборок: исходники до 1200 px тяжёлые для ленты на телефоне
    imageSizes: [{ name: 'card', width: 480, height: 360, position: 'centre', formatOptions: { format: 'webp', options: { quality: 72 } } }],
  },
}
