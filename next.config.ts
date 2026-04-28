import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
        : '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
export default withNextIntl(nextConfig)
