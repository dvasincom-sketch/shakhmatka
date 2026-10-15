/**
 * Методика классов «Шахматки» (редакция 4 кв. 2026): класс задают характеристики дома, цена — контрольная проверка.
 * Основа — «Единая методика классифицирования жилых новостроек» Российской гильдии риэлторов (2012) и практика московских аналитиков;
 * коридоры ₽/м² выведены из средних по классам (Бест-Новострой, сентябрь 2026; Метриум; CORE.XP) и пересматриваются раз в квартал.
 * Исследование и источники: pipeline/classes/METHOD-RESEARCH.md. Описание для читателя — термин словаря «Класс жилья».
 */
export const CLASS_ORDER = ['comfort', 'business', 'premium', 'deluxe'] as const
export type ClassKey = (typeof CLASS_ORDER)[number]
export type Zone = 'cao' | 'old' | 'new'
export const ZONE_LABEL: Record<Zone, string> = { cao: 'ЦАО', old: 'Москва вне ЦАО', new: 'Новая Москва' }

/** Коридоры, тыс. ₽/м²: [нижняя, верхняя]; null — класс в зоне почти не встречается */
export const CORRIDORS: Record<ClassKey, Record<Zone, [number, number] | null>> = {
  comfort: { old: [330, 550], new: [280, 420], cao: null },
  business: { old: [450, 850], new: [380, 550], cao: [550, 1000] },
  premium: { old: [800, 1800], new: null, cao: [1000, 2000] },
  deluxe: { old: [1800, Infinity], new: null, cao: [2000, Infinity] },
}
export const CLASS_NAME: Record<ClassKey, string> = { comfort: 'комфорт', business: 'бизнес', premium: 'премиум', deluxe: 'делюкс' }

export const zoneOf = (okrug?: string | null): Zone => (okrug === 'ЦАО' ? 'cao' : okrug === 'НАО' || okrug === 'ТАО' ? 'new' : 'old')

/**
 * Проверка заявленного класса по цене. В досье хранится цена «от» (минимальная), поэтому нижнюю границу смягчаем на 15 %:
 * самые дешёвые лоты проекта обычно ниже средней по классу.
 */
export function priceCheck(cls: string | null | undefined, priceM2From: number | null | undefined, zone: Zone): { ok: boolean; text: string } | null {
  if (!cls || !priceM2From || !(CLASS_ORDER as readonly string[]).includes(cls)) return null
  const k = cls as ClassKey
  const band = CORRIDORS[k][zone]
  const t = priceM2From // в базе цена за метр хранится в тыс. ₽
  if (!band) return null
  if (t < band[0] * 0.85) {
    const lower = [...CLASS_ORDER].reverse().find((c) => { const b = CORRIDORS[c][zone]; return b && t >= b[0] * 0.85 && CLASS_ORDER.indexOf(c) < CLASS_ORDER.indexOf(k) })
    return { ok: false, text: lower ? `цена на уровне класса «${CLASS_NAME[lower]}»` : 'цена ниже типичной для класса' }
  }
  if (t > band[1]) {
    const upper = CLASS_ORDER.find((c) => { const b = CORRIDORS[c][zone]; return b && t >= b[0] && t <= b[1] && CLASS_ORDER.indexOf(c) > CLASS_ORDER.indexOf(k) })
    return { ok: false, text: upper ? `цена на уровне класса «${CLASS_NAME[upper]}»` : 'цена выше типичной для класса' }
  }
  return { ok: true, text: 'цена в коридоре класса' }
}
