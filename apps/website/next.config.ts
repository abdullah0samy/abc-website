import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: 'abc-files.karem.live' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.abchospitaleg.com' },
    ],
  },
}

export default nextConfig
