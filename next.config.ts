import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/1',
      },
    ]
  },
  experimental: {
    reactCompiler: true,
  },
  serverExternalPackages: ["@libsql/client", "@libsql/linux-arm64-musl"],
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
