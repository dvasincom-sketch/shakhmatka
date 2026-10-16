/**
 * Обложка карточки объекта без фото: фрагмент карты Москвы — район проекта среди соседних и точка участка, если она известна.
 * Рисуется на сервере из контуров районов (moscow-map.ts), без внешних картографических сервисов.
 */
import { MAP_DISTRICTS, projectLL } from './moscow-map'
import { MOSCOW_DISTRICTS } from './districts'

const BY_KEY = new Map(MAP_DISTRICTS.map((d) => [d.k, d]))
// поселения Новой Москвы на карте не выделены — показываем их округ (НАО / ТАО) целиком
const OKRUG_KEY: Record<string, string> = { НАО: 'nao', ТАО: 'tao' }
const shapeFor = (k?: string | null) => (k ? BY_KEY.get(k) || BY_KEY.get(OKRUG_KEY[MOSCOW_DISTRICTS[k]?.okrug || ''] || '') : undefined)

export function LocCover({ district, lat, lng, label }: { district?: string | null; lat?: number | null; lng?: number | null; label?: string }) {
  const d = shapeFor(district)
  const pt = lat && lng ? projectLL(lat, lng) : null
  if (!d && !pt) return null
  const whole = d && (d.k === 'nao' || d.k === 'tao') // округ Новой Москвы слишком велик — берём окрестность точки
  // квадратная рамка вокруг района целиком, не мельче 70 единиц — иначе маленькие районы центра превращаются в пятно;
  // для НАО и ТАО с известной точкой — окрестность точки
  const [bx, by, bw, bh] = d && !(whole && pt) ? d.b : [pt![0] - 45, pt![1] - 45, 90, 90]
  let cx = bx + bw / 2, cy = by + bh / 2
  const side = Math.max(70, Math.max(bw, bh) * 1.04)
  // точка должна попасть в кадр с запасом
  if (pt) { const m = side * 0.3; cx = Math.min(Math.max(cx, pt[0] - m), pt[0] + m); cy = Math.min(Math.max(cy, pt[1] - m), pt[1] + m) }
  const vb: [number, number, number, number] = [cx - side / 2, cy - side / 2, side, side]
  const near = MAP_DISTRICTS.filter((x) => x.b[0] < vb[0] + vb[2] && x.b[0] + x.b[2] > vb[0] && x.b[1] < vb[1] + vb[3] && x.b[1] + x.b[3] > vb[1])
  const sw = side / 220
  return (
    <svg className="loc" viewBox={vb.map((v) => +v.toFixed(1)).join(' ')} role="img" aria-label={label || (d ? `${d.n} на карте Москвы` : 'Участок на карте Москвы')} preserveAspectRatio="xMidYMid slice">
      {near.map((x) => <path key={x.k} d={x.d} className={x.k === d?.k ? 'loc-on' : 'loc-n'} strokeWidth={sw} />)}
      {pt ? <><circle cx={pt[0]} cy={pt[1]} r={side * 0.045} className="loc-halo" /><circle cx={pt[0]} cy={pt[1]} r={side * 0.022} className="loc-pt" strokeWidth={sw * 1.6} /></> : null}
    </svg>
  )
}
