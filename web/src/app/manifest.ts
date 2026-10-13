import type { MetadataRoute } from 'next'

/** Манифест: сайт можно добавить на главный экран телефона со своей иконкой */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Шахматка — новостройки без рекламы и слухов',
    short_name: 'Шахматка',
    description: 'Независимое медиа о новостройках Москвы и России. Только проверенные факты.',
    lang: 'ru',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBFAF6',
    theme_color: '#FBFAF6',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
