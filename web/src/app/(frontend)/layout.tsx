import type { Metadata, Viewport } from 'next'
import React from 'react'
import Script from 'next/script'
import '@fontsource/unbounded/cyrillic-300.css'
import '@fontsource/unbounded/cyrillic-400.css'
import '@fontsource/unbounded/cyrillic-500.css'
import '@fontsource/unbounded/latin-300.css'
import '@fontsource/unbounded/latin-400.css'
import '@fontsource/unbounded/latin-500.css'
import '@fontsource/onest/cyrillic-400.css'
import '@fontsource/onest/cyrillic-500.css'
import '@fontsource/onest/cyrillic-600.css'
import '@fontsource/onest/latin-400.css'
import '@fontsource/onest/latin-500.css'
import '@fontsource/onest/latin-600.css'
import './styles.css'
import { Footer, Header, SITE } from '@/lib/ui'
import { THEME_SCRIPT, ToTop } from '@/lib/client'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Шахматка — новостройки Москвы и России', template: '%s | Шахматка' },
  description: 'Независимое медиа о новостройках: цены, сроки, застройщики, суды и регулирование. Только проверенные факты.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: '48x48' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  applicationName: 'Шахматка',
  // картинка для соцсетей по умолчанию; у статей со своим фото её заменяет главное фото
  openGraph: { siteName: 'Шахматка', locale: 'ru_RU', type: 'website', images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Шахматка — новостройки без рекламы и слухов' }] },
  twitter: { card: 'summary_large_image' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FBFAF6' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script id="theme" strategy="beforeInteractive">{THEME_SCRIPT}</Script>
      </head>
      <body>
        <a className="skip" href="#main">К содержанию</a>
        <Header />
        <main id="main" className="wrap">{children}</main>
        <Footer />
        <ToTop />
      </body>
    </html>
  )
}
