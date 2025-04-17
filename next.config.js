/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hhrymtdmxpwzzfgfzcod.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://qrmenu.eaglesnestcy.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://qrmenu.eaglesnestcy.com',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://qrmenu.eaglesnestcy.com; default-src 'self' https://qrmenu.eaglesnestcy.com; script-src 'self' 'unsafe-inline' 'unsafe-eval';",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 