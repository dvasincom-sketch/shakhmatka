import type { GlobalConfig } from 'payload'
import { admins, staff } from '../access'
import { DEFAULT_STOP_WORDS, DEFAULT_SYNONYMS } from '../lib/search-config'
import { applyEditorialSettings } from '../lib/search'

/** Настройки поиска для редакции: синонимы, стоп-слова, опечатки. Применяются к индексу сразу после сохранения. */
export const SearchSettings: GlobalConfig = {
  slug: 'search-settings',
  label: 'Настройки поиска',
  admin: { group: 'Поиск' },
  access: { read: staff, update: admins },
  hooks: { afterChange: [({ doc }) => { void applyEditorialSettings(doc); return doc }] },
  fields: [
    {
      name: 'synonyms', label: 'Синонимы', type: 'array', defaultValue: DEFAULT_SYNONYMS,
      admin: { description: 'Одна строка — одна группа слов через запятую: «крт, комплексное развитие территорий». «Взаимные»: любое слово находит остальные. «Только первое»: первое слово находит остальные, но не наоборот (для широких слов вроде «новостройка»). «ё» и «е» не различаются.' },
      labels: { singular: 'Группа', plural: 'Группы' },
      fields: [
        { type: 'row', fields: [
          { name: 'words', label: 'Слова через запятую', type: 'text', required: true, admin: { width: '75%' } },
          { name: 'mode', label: 'Как работает', type: 'select', defaultValue: 'both', options: [{ label: 'Взаимные', value: 'both' }, { label: 'Только первое → остальные', value: 'one' }], admin: { width: '25%' } },
        ] },
      ],
    },
    {
      name: 'stopWords', label: 'Стоп-слова', type: 'textarea', defaultValue: DEFAULT_STOP_WORDS,
      admin: { description: 'Через запятую. Эти слова поиск пропускает и в запросе, и в текстах: «жк на Лужнецкой» ищется как «Лужнецкой». Не добавляйте слова, которые бывают названием проекта.' },
    },
    { type: 'row', fields: [
      { name: 'typoOne', label: 'Одна опечатка — от скольких букв', type: 'number', defaultValue: 5, min: 1, admin: { width: '50%', description: 'Короткие слова (ПИК, Сити) ищутся только точно' } },
      { name: 'typoTwo', label: 'Две опечатки — от скольких букв', type: 'number', defaultValue: 9, min: 2, admin: { width: '50%' } },
    ] },
  ],
}
