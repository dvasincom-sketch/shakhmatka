'use client'
import { useState } from 'react'

type Pic = { id: number | string; url: string; thumb: string; alt: string; caption?: string | null; width?: number | null; height?: number | null }

/** Галерея объекта: клик по превью меняет главное фото, без перехода на файл */
export function ObjGallery({ pics }: { pics: Pic[] }) {
  const [i, setI] = useState(0)
  const cur = pics[i] || pics[0]
  if (!cur) return null
  return (
    <div className="obj-gal">
      <figure className="fig obj-fig">
        <img src={cur.url} alt={cur.alt} width={cur.width || undefined} height={cur.height || undefined} />
        {cur.caption ? <figcaption>{cur.caption}</figcaption> : null}
      </figure>
      {pics.length > 1 ? (
        <div className="thumbs" role="group" aria-label="Фото проекта">
          {pics.slice(0, 8).map((p, j) => (
            <button key={p.id} type="button" className={j === i ? 'on' : ''} aria-pressed={j === i} aria-label={`Показать фото ${j + 1}: ${p.alt}`} onClick={() => setI(j)}>
              <img src={p.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
