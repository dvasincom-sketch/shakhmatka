import type { Object as Obj } from '@/payload-types'
import type { Landing } from './landings'

/** Подборки по классу и стадии. Отдельный модуль без импорта конфига Payload — его используют и хуки коллекций. */
const CLASS_INTRO =
  'Класс жилья в России не закреплён законом: его называет сам застройщик. Шахматка указывает класс, только если застройщик прямо называет его в документах или официальных материалах проекта.'

export const STATIC: Landing[] = [
  { slug: 'premium-klass', group: 'class', label: 'Премиум', subject: 'новостройки премиум-класса в Москве', intro: CLASS_INTRO, catalog: '/obekty/?geo=moscow&class=premium', match: (o) => o.class === 'premium' },
  { slug: 'biznes-klass', group: 'class', label: 'Бизнес', subject: 'новостройки бизнес-класса в Москве', intro: CLASS_INTRO, catalog: '/obekty/?geo=moscow&class=business', match: (o) => o.class === 'business' },
  { slug: 'komfort-klass', group: 'class', label: 'Комфорт', subject: 'новостройки комфорт-класса в Москве', intro: CLASS_INTRO, catalog: '/obekty/?geo=moscow&class=comfort', match: (o) => o.class === 'comfort' },
  { slug: 'delyuks', group: 'class', label: 'Делюкс', subject: 'новостройки класса делюкс в Москве', intro: CLASS_INTRO, catalog: '/obekty/?geo=moscow&class=deluxe', match: (o) => o.class === 'deluxe' },
  {
    slug: 'budushchie-proekty', group: 'stage', label: 'Будущие проекты', subject: 'будущие новостройки Москвы',
    intro: 'Здесь проекты, у которых ещё нет разрешения на строительство: участок уже у застройщика, готовится или согласована архитектурная концепция. На этой стадии квартиры официально не продают, а параметры проекта ещё могут измениться. Мы отслеживаем такие объекты с момента покупки земли.',
    catalog: '/obekty/?geo=moscow', match: (o) => ['land', 'concept', 'architecture'].includes(o.stage || ''),
  },
  {
    slug: 'razreshenie-na-stroitelstvo', group: 'stage', label: 'Получили разрешение', subject: 'новостройки Москвы с разрешением на строительство',
    intro: 'Разрешение на строительство уже выдано, но продажи ещё не открыты. Следующий шаг — публикация проектной декларации в Единой информационной системе жилищного строительства (наш.дом.рф), после неё застройщик может заключать договоры долевого участия.',
    catalog: '/obekty/?geo=moscow&stage=permit', match: (o) => o.stage === 'permit',
  },
  {
    slug: 'start-prodazh', group: 'stage', label: 'Старт продаж', subject: 'новостройки Москвы на старте продаж',
    intro: 'Объекты, в которых застройщик уже продаёт квартиры. Покупка в строящемся доме оформляется договором долевого участия по 214-ФЗ, деньги дольщика хранятся на эскроу-счёте в банке до ввода дома. Проверить проектную декларацию и сроки можно на наш.дом.рф.',
    catalog: '/obekty/?geo=moscow&stage=sales', match: (o) => o.stage === 'sales',
  },
  {
    slug: 'sdannye', group: 'stage', label: 'Сданные', subject: 'сданные новостройки Москвы',
    intro: 'Дома, введённые в эксплуатацию: разрешение на ввод получено, застройщик передаёт квартиры покупателям.',
    catalog: '/obekty/?geo=moscow&stage=completed', match: (o) => o.stage === 'completed',
  },
]

