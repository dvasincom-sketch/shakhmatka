import type { CollectionConfig } from 'payload'
import { admins } from '../access'

/** Заявки на «Шахматку Про» и подборку площадок (страница /pro/). Публичного API нет: создаются маршрутом /pro/zayavka/. */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: { useAsTitle: 'company', defaultColumns: ['company', 'name', 'role', 'product', 'status', 'createdAt'], group: 'Читатели' },
  access: { read: admins, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'name', label: 'Имя', type: 'text', required: true },
    { name: 'company', label: 'Компания', type: 'text' },
    {
      name: 'role', label: 'Кто', type: 'select',
      options: [
        { label: 'Частный инвестор', value: 'private' }, { label: 'Застройщик / девелопер', value: 'developer' }, { label: 'Брокер / консультант', value: 'broker' },
        { label: 'Банк / фонд / инвестор', value: 'investor' }, { label: 'Архитектурное бюро', value: 'architect' },
        { label: 'Собственник земли', value: 'owner' }, { label: 'Другое', value: 'other' },
      ],
    },
    { name: 'product', label: 'Интересует', type: 'select', hasMany: true, options: [{ label: 'Инвестиционная подборка', value: 'invest' }, { label: 'Шахматка Про', value: 'pro' }, { label: 'Подборка площадок', value: 'land' }, { label: 'Выгрузка данных / API', value: 'data' }] },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Телефон / Telegram', type: 'text' },
    { name: 'request', label: 'Запрос', type: 'textarea', admin: { description: 'Районы, площадь участка или ТЭП, бюджет, класс, сроки' } },
    { name: 'page', label: 'Откуда', type: 'text', admin: { readOnly: true } },
    { name: 'status', label: 'Статус', type: 'select', defaultValue: 'new', options: [{ label: 'Новая', value: 'new' }, { label: 'В работе', value: 'work' }, { label: 'Пилот', value: 'pilot' }, { label: 'Клиент', value: 'client' }, { label: 'Отказ', value: 'lost' }] },
    { name: 'notes', label: 'Заметки', type: 'textarea' },
  ],
}
