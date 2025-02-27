/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['hhrymtdmxpwzzfgfzcod.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hhrymtdmxpwzzfgfzcod.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig 