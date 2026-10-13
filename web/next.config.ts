import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  trailingSlash: true,
  devIndicators: false,
  // старые схемы адресов из промта v1.x — навсегда на новые
  async redirects() {
    return [
      { source: '/moskva/', destination: '/novostroyki/moskva/', permanent: true },
      { source: '/moskva/:slug/', destination: '/novostroyki/:slug/', permanent: true },
      { source: '/regiony/:slug/', destination: '/novostroyki/:slug/', permanent: true },
      { source: '/rayony/:slug/', destination: '/novostroyki/:slug/', permanent: true },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
