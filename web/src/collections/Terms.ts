import { removeDoc, syncDoc } from '../lib/search'
import type { CollectionConfig } from 'payload'

/** Словарь терминов: /slovar/<slug>/. На сайте только опубликованные; ссылки на неопубликованные термины показываются простым текстом. */
export const Terms: CollectionConfig = {
  slug: 'terms',
  hooks: { afterChange: [({ doc, req }) => { syncDoc(req.payload, 'terms', doc as never); return doc }], afterDelete: [({ id }) => removeDoc('terms', id)], },
  labels: { singular: 'Термин', plural: 'Словарь' },
  access: { read: () => true },
  admin: { useAsTitle: 'term', defaultColumns: ['term', 'full', 'published', 'slug'], group: 'Справочники' },
  fields: [
    { name: 'term', label: 'Термин', type: 'text', required: true, admin: { description: 'Как пишем в тексте: «ДДУ», «Проектная декларация»' } },
    { name: 'full', label: 'Полное название', type: 'text', admin: { description: 'Для аббревиатур: «Договор участия в долевом строительстве»' } },
    { name: 'slug', label: 'URL', type: 'text', required: true, unique: true, index: true, admin: { description: '/slovar/<url>/' } },
    { name: 'short', label: 'Коротко', type: 'textarea', required: true, maxLength: 300, admin: { description: '1–2 предложения. Идёт в description страницы и во всплывающие подсказки' } },
    { name: 'body', label: 'Подробно (markdown)', type: 'code', admin: { language: 'markdown' } },
    { name: 'sources', label: 'Источники', type: 'array', fields: [{ name: 'title', label: 'Название', type: 'text' }, { name: 'url', label: 'Ссылка', type: 'text' }] },
    { name: 'published', label: 'Опубликовано', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Включайте после проверки определения редактором' } },
  ],
}
