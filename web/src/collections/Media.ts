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
    imageSizes: [
      { name: 'card', width: 480, height: 360, position: 'centre', formatOptions: { format: 'webp', options: { quality: 72 } } },
      // копия для статьи и галереи: вписывается в 1440×1440, webp. Исходники из открытых архивов бывают 1920–3000 px и 1–2 МБ,
      // а колонка текста — до 720 px, обложка — до 1240 px. Если исходник меньше 1440 px по обеим сторонам, копия не создаётся и показывается он.
      { name: 'wide', width: 1440, height: 1440, fit: 'inside', formatOptions: { format: 'webp', options: { quality: 74 } } },
    ],
  },
}
