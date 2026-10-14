/**
 * robots.txt руками, а не через robots.ts: Next не умеет директиву Clean-param, а она важна для Яндекса —
 * склеивает адреса с UTM и рекламными метками, чтобы они не попадали в индекс дублями.
 * PUBLIC_ROBOTS=1 открывает сайт для поисковиков; без него (локально, стейджинг) индексация запрещена целиком.
 */
const ORIGIN = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://шахматка.москва').origin

export const dynamic = 'force-dynamic'

export function GET() {
  const closed = process.env.PUBLIC_ROBOTS !== '1'
  const body = closed
    ? 'User-agent: *\nDisallow: /\n'
    : [
        'User-agent: *',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /poisk/',
        'Disallow: /kabinet/',
        'Allow: /',
        '',
        'User-agent: Yandex',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /poisk/',
        'Disallow: /kabinet/',
        'Allow: /',
        'Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&fbclid&from',
        '',
        `Sitemap: ${ORIGIN}/sitemap.xml`,
        '',
      ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
