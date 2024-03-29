const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
module.exports = withBundleAnalyzer({
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/1',
      },
    ]
  },
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
})
