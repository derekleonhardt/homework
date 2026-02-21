import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 're2'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude re2 from webpack bundling on server side
      config.externals = config.externals || []
      config.externals.push('re2')
    }
    return config
  },
}

export default nextConfig
