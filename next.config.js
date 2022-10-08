const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
module.exports = withBundleAnalyzer({
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/1',
      },
    ]
  },
  output: 'standalone',
})
