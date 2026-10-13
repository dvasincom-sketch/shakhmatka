import type { CollectionConfig } from 'payload'

/** Районы Москвы и регионы — основа посадочных страниц /novostroyki/<slug>/ */
export const Places: CollectionConfig = {
  slug: 'places',
  labels: { singular: 'Район или регион', plural: 'Районы и регионы' },
  access: { read: () => true },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'kind', 'okrug', 'slug'], group: 'Справочники' },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true, admin: { description: 'Именительный падеж: «Хорошёво-Мнёвники»' } },
    { name: 'nameIn', label: 'Где? (для заголовков)', type: 'text', required: true, admin: { description: 'Как в заголовке «Новостройки …»: «в Хорошёво-Мнёвниках», «в Даниловском районе», «в Омской области»' } },
    {
      type: 'row',
      fields: [
        { name: 'kind', label: 'Тип', type: 'select', required: true, defaultValue: 'district', options: [{ label: 'Район Москвы', value: 'district' }, { label: 'Регион', value: 'region' }], admin: { width: '33%' } },
        { name: 'key', label: 'Код в объектах', type: 'text', required: true, unique: true, index: true, admin: { width: '33%', description: 'Как в поле «Район» или «Регион» объекта: khoroshevo-mnevniki, moscow' } },
        { name: 'slug', label: 'URL', type: 'text', required: true, unique: true, index: true, admin: { width: '33%', description: '/novostroyki/<url>/' } },
      ],
    },
    { name: 'okrug', label: 'Округ', type: 'text', admin: { condition: (d) => d?.kind === 'district', description: 'СЗАО, ЮАО, ЦАО…' } },
    { name: 'intro', label: 'Вводный текст', type: 'textarea', admin: { description: 'Только проверенные факты о районе: где находится, транспорт, планы города. 2–4 абзаца, абзацы через пустую строку.' } },
    { name: 'metaTitle', label: 'Title (если нужен свой)', type: 'text', maxLength: 70 },
    { name: 'metaDescription', label: 'Description (если нужен свой)', type: 'textarea', maxLength: 170 },
    { name: 'forceIndex', label: 'Индексировать всегда', type: 'checkbox', admin: { position: 'sidebar', description: 'По умолчанию страница открыта для поиска, когда в ней от 2 объектов или есть вводный текст от 400 знаков' } },
  ],
}
