import { removeDoc, syncDoc } from '../lib/search'
import type { CollectionConfig } from 'payload'
import { admins, staff } from '../access'

export const STAGES = [
  { label: 'Участок', value: 'land' },
  { label: 'Концепция', value: 'concept' },
  { label: 'Архитектура', value: 'architecture' },
  { label: 'Разрешение', value: 'permit' },
  { label: 'Старт продаж', value: 'sales' },
  { label: 'Ввод', value: 'completed' },
]

export const CLASSES = [
  { label: 'Комфорт', value: 'comfort' },
  { label: 'Бизнес', value: 'business' },
  { label: 'Премиум', value: 'premium' },
  { label: 'Делюкс', value: 'deluxe' },
]

export const TIMELINE_KINDS = [
  { label: 'Участок', value: 'land' },
  { label: 'КРТ', value: 'krt' },
  { label: 'Торги', value: 'tender' },
  { label: 'Концепция', value: 'concept' },
  { label: 'Архитектура', value: 'architecture' },
  { label: 'Разрешение', value: 'permit' },
  { label: 'Продажи', value: 'sales' },
  { label: 'Цены', value: 'price' },
  { label: 'Сделка', value: 'deal' },
  { label: 'Стройка и ввод', value: 'construction' },
  { label: 'Суд', value: 'court' },
  { label: 'Другое', value: 'other' },
]

export const CERTAINTY = [
  { label: 'Факт', value: 'fact' },
  { label: 'Сигнал (кулуарная информация, планы)', value: 'signal' },
]

export const Objects: CollectionConfig = {
  slug: 'objects',
  labels: { singular: 'Объект', plural: 'Объекты' },
  access: { read: () => true, create: staff, update: staff, delete: admins },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'zu', 'stage', 'priceFrom', 'region'] },
  hooks: {
    afterChange: [({ doc, req }) => { syncDoc(req.payload, 'objects', doc as never); return doc }], afterDelete: [({ id }) => removeDoc('objects', id)],
    beforeChange: [({ data, originalDoc }) => {
      const tl = (data.timeline ?? originalDoc?.timeline ?? []) as { date?: string; certainty?: string }[]
      const now = new Date().toISOString()
      const dates = tl.map((t) => t.date).filter((d): d is string => !!d && d <= now).sort()
      data.lastEventAt = dates.length ? dates[dates.length - 1] : null
      data.signalCount = tl.filter((t) => t.certainty === 'signal').length
      return data
    }],
  },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'slug', label: 'Slug (URL)', type: 'text', required: true, unique: true, index: true, admin: { description: '/obekty/<slug>/' } },
    { name: 'zu', label: 'Адрес земельного участка (ЗУ)', type: 'text', admin: { description: 'Главный идентификатор объекта в базе' } },
    { name: 'aliases', label: 'Другие названия', type: 'array', fields: [{ name: 'value', label: 'Название', type: 'text' }] },
    { name: 'region', label: 'Регион', type: 'text', defaultValue: 'moscow' },
    { name: 'district', label: 'Район', type: 'text' },
    { name: 'stage', label: 'Стадия', type: 'select', options: STAGES },
    { name: 'class', label: 'Класс', type: 'select', options: CLASSES, admin: { description: 'Только если класс прямо назван застройщиком или в документах' } },
    {
      type: 'row',
      fields: [
        { name: 'priceFrom', label: 'Цена от, млн ₽', type: 'number', min: 0, admin: { step: 0.1, width: '33%' } },
        { name: 'priceM2From', label: 'Цена м² от, тыс. ₽', type: 'number', min: 0, admin: { width: '33%' } },
        { name: 'priceAsOf', label: 'Актуально на', type: 'text', admin: { width: '33%', description: 'Напр. «13.10.2026» или «старт продаж, март 2026»' } },
      ],
    },
    { name: 'priceSource', label: 'Источник цены', type: 'text', admin: { description: 'Ссылка или название документа' } },
    { name: 'completion', label: 'Срок ввода', type: 'text', admin: { description: 'Как в проектной декларации: «I кв. 2030»' } },
    { name: 'legalEntity', label: 'Застройщик по документам', type: 'text', admin: { description: 'Специализированный застройщик: АО «СЗ «…»' } },
    { name: 'summary', label: 'Коротко о проекте', type: 'textarea', admin: { description: '2–3 предложения: где, что строят, на какой стадии. Идёт в начало досье и в description' } },
    { name: 'gallery', label: 'Галерея', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'timeline', label: 'Хронология', type: 'array',
      admin: { description: 'События объекта по датам: участок, концепция, АГР, разрешение, старт продаж, цены, сделки, суды. Источник — заметки архива редакции' },
      fields: [
        { type: 'row', fields: [
          { name: 'date', label: 'Дата', type: 'date', required: true, admin: { width: '33%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
          { name: 'dateLabel', label: 'Подпись даты', type: 'text', admin: { width: '33%', description: 'Если точная дата неизвестна: «до 2019», «зима 2020»' } },
          { name: 'kind', label: 'Тип', type: 'select', defaultValue: 'other', admin: { width: '33%' }, options: TIMELINE_KINDS },
        ] },
        { name: 'title', label: 'Что произошло', type: 'text', required: true },
        { name: 'text', label: 'Подробности', type: 'textarea' },
        { name: 'image', label: 'Фото', type: 'upload', relationTo: 'media' },
        { type: 'row', fields: [
          { name: 'certainty', label: 'Достоверность', type: 'select', defaultValue: 'fact', options: CERTAINTY, admin: { width: '50%', description: '«Сигнал» — на сайте с пометкой: о событии говорили до официальных новостей' } },
          { name: 'confirmedOn', label: 'Подтвердилось', type: 'date', admin: { width: '50%', description: 'Для сигнала: когда информация подтвердилась', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        ] },
        { type: 'row', fields: [
          { name: 'outcome', label: 'Итог проверки', type: 'select', options: [{ label: 'Не подтвердилось', value: 'unconfirmed' }, { label: 'Опровергнуто', value: 'refuted' }], admin: { width: '50%', description: 'Для сигнала, который проверили и не нашли подтверждения' } },
          { name: 'checkedOn', label: 'Проверено', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } } },
        ] },
        { type: 'row', fields: [
          { name: 'sourceNote', label: 'Заметка архива', type: 'number', admin: { width: '50%', description: 'Номер заметки — для редакции, на сайте не показывается' } },
          { name: 'verified', label: 'Сверено по первоисточнику', type: 'checkbox', admin: { width: '50%' } },
        ] },
      ],
    },
    {
      name: 'neighbors', label: 'По соседству', type: 'array',
      admin: { description: 'Соседние участки, проекты и КРТ, которые влияют на объект' },
      fields: [
        { name: 'name', label: 'Название или адрес', type: 'text', required: true },
        { name: 'object', label: 'Объект в базе', type: 'relationship', relationTo: 'objects' },
        { name: 'date', label: 'На дату', type: 'date' },
        { name: 'text', label: 'Что там', type: 'textarea' },
        { name: 'image', label: 'Фото', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'developer', label: 'Застройщик', type: 'relationship', relationTo: 'developers' },
    { name: 'lastEventAt', label: 'Последнее событие', type: 'date', index: true, admin: { position: 'sidebar', readOnly: true, description: 'Считается из хронологии' } },
    { name: 'signalCount', label: 'Сигналов в хронологии', type: 'number', admin: { position: 'sidebar', readOnly: true } },
    { name: 'auto', label: 'Собрано из архива автоматически', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Снимите галочку, когда редакция проверит досье: тогда повторный импорт его не перезапишет' } },
    { name: 'previousDevelopers', label: 'Застройщики раньше', type: 'relationship', relationTo: 'developers', hasMany: true },
    {
      name: 'owners', label: 'Смена собственников', type: 'array',
      admin: { description: 'Кто владел проектом и когда: от первого к текущему. Каждая смена — со ссылкой на источник' },
      fields: [
        { type: 'row', fields: [
          { name: 'developer', label: 'Застройщик / владелец', type: 'relationship', relationTo: 'developers', admin: { width: '40%' } },
          { name: 'since', label: 'С', type: 'text', admin: { width: '30%', description: '«8 июля 2026», «январь 2022»' } },
          { name: 'until', label: 'По', type: 'text', admin: { width: '30%' } },
        ] },
        { name: 'how', label: 'Как перешёл проект', type: 'textarea' },
        { name: 'source', label: 'Источник', type: 'text' },
      ],
    },
  ],
}
