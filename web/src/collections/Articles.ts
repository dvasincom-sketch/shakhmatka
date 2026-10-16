import { removeDoc, syncDoc } from '../lib/search'
import type { CollectionConfig } from 'payload'
import { brokenReport, buildLinkIndex, findBroken } from '../lib/links'

const FACT_STATUS = [
  { label: 'Подтверждено', value: 'confirmed' },
  { label: 'Изменилось', value: 'changed' },
  { label: 'Опровергнуто', value: 'refuted' },
  { label: 'Не подтверждено', value: 'unverified' },
]

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Статья', plural: 'Статьи' },
  access: { read: () => true },
  versions: { drafts: true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'reviewStatus', 'datePublished'],
    preview: (doc) => (doc?.slug ? `/novosti/${doc.slug}` : null),
  },
  hooks: {
    afterChange: [({ doc, req }) => { syncDoc(req.payload, 'articles', doc as never); return doc }], afterDelete: [({ id }) => removeDoc('articles', id)],
    // При каждом сохранении проверяем внутренние ссылки. Сохранение не блокируем: на сайте битая ссылка
    // покажется простым текстом и оживёт сама, когда появится страница (например, термин в словаре).
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const body = data.body ?? originalDoc?.body
        if (typeof body !== 'string') return data
        const broken = findBroken(await buildLinkIndex(req.payload), body)
        data.linkCheck = broken.length ? brokenReport(broken) : ''
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Текст',
          fields: [
            { name: 'title', label: 'Заголовок H1', type: 'text', required: true, maxLength: 120 },
            { name: 'slug', label: 'Slug (URL)', type: 'text', required: true, unique: true, index: true, admin: { description: '/novosti/<slug>/' } },
            { name: 'lead', label: 'Лид', type: 'textarea' },
            { name: 'body', label: 'Текст статьи (markdown)', type: 'code', admin: { language: 'markdown' }, required: true },
            { name: 'heroImage', label: 'Главное фото', type: 'upload', relationTo: 'media' },
            { name: 'images', label: 'Фото в тексте', type: 'upload', relationTo: 'media', hasMany: true },
          ],
        },
        {
          label: 'Связи',
          fields: [
            {
              name: 'type', label: 'Тип материала', type: 'select', required: true,
              options: [
                { label: 'Объект', value: 'object' }, { label: 'Застройщик', value: 'developer' }, { label: 'Рынок', value: 'market' },
                { label: 'Регулирование', value: 'regulation' }, { label: 'Архитектура', value: 'architecture' },
                { label: 'Интерьер', value: 'interior' },
              ],
            },
            { name: 'region', label: 'Регион', type: 'text', defaultValue: 'moscow' },
            { name: 'objects', label: 'Объекты', type: 'relationship', relationTo: 'objects', hasMany: true },
            { name: 'developers', label: 'Застройщики', type: 'relationship', relationTo: 'developers', hasMany: true },
            { name: 'topics', label: 'Темы', type: 'array', fields: [{ name: 'value', type: 'text' }] },
            { name: 'sourceNoteId', label: 'Заметка архива', type: 'number' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', label: 'Title', type: 'text', maxLength: 60 },
            { name: 'metaDescription', label: 'Description', type: 'textarea', maxLength: 170, admin: { description: '140–160 знаков' } },
            { name: 'mainQuery', label: 'Основной запрос', type: 'text' },
            { name: 'keywords', label: 'Дополнительные запросы', type: 'array', fields: [{ name: 'value', type: 'text' }] },
            { name: 'faq', label: 'Вопросы и ответы', type: 'array', fields: [{ name: 'q', label: 'Вопрос', type: 'text' }, { name: 'a', label: 'Ответ', type: 'textarea' }] },
            { name: 'schema', label: 'JSON-LD', type: 'json' },
          ],
        },
        {
          label: 'Фактчекинг',
          fields: [
            {
              name: 'reviewStatus', label: 'Статус проверки', type: 'select', defaultValue: 'needs_review',
              options: [{ label: 'Готова', value: 'ready' }, { label: 'Нужна сверка', value: 'needs_review' }],
            },
            {
              name: 'factcheck', label: 'Протокол', type: 'array',
              fields: [
                { name: 'claim', label: 'Утверждение', type: 'textarea' },
                { name: 'status', label: 'Статус', type: 'select', options: FACT_STATUS },
                { name: 'source', label: 'Источник', type: 'text' },
                { name: 'note', label: 'Примечание', type: 'textarea' },
              ],
            },
            { name: 'removed', label: 'Убрано из заметки', type: 'array', fields: [{ name: 'value', type: 'textarea' }] },
            { name: 'editorNotes', label: 'Заметки редактору', type: 'textarea' },
          ],
        },
      ],
    },
    { name: 'datePublished', label: 'Дата публикации', type: 'date', admin: { position: 'sidebar' } },
    { name: 'dateModified', label: 'Дата проверки фактов', type: 'date', admin: { position: 'sidebar' } },
    {
      name: 'linkCheck', label: 'Проверка ссылок', type: 'textarea',
      admin: {
        position: 'sidebar', readOnly: true,
        description: 'Внутренние ссылки, которые пока никуда не ведут. На сайте они выводятся обычным текстом. Обновляется при сохранении; проверить все статьи — npm run check:links',
        condition: (d) => !!d?.linkCheck,
      },
    },
    { name: 'author', label: 'Автор', type: 'text', defaultValue: 'Редакция Шахматки', admin: { position: 'sidebar' } },
  ],
}
