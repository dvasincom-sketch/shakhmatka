/**
 * Микроразметка JSON-LD. Несколько сущностей собираем в один граф с общим @context:
 * так требуют валидаторы Яндекса и Google, и так ждёт проверка Next.js (массив без @context в корне ломает страницу).
 */
type Node = Record<string, unknown>
const strip = ({ ['@context']: _c, ...rest }: Node) => rest

export function JsonLd({ data }: { data: Node | Node[] | unknown }) {
  if (!data) return null
  let out: Node
  if (Array.isArray(data)) out = { '@context': 'https://schema.org', '@graph': (data as Node[]).filter(Boolean).map(strip) }
  else {
    const o = data as Node
    out = o['@context'] ? o : { '@context': 'https://schema.org', ...o }
  }
  // «</script>» внутри строк не должен закрыть тег
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(out).replace(/</g, '\\u003c') }} />
}

/** Хлебные крошки для поисковиков (BreadcrumbList): [['Лента', '/'], ['Объекты', '/obekty/']] */
export function CrumbsLd({ items }: { items: [string, string][] }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://шахматка.москва'
  return <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${site}${path}` })) }} />
}
