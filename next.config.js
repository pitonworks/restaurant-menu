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
            value: 'Content-Type, Authorization, X-Requested-With',
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
            value: "frame-ancestors 'self' https://qrmenu.eaglesnestcy.com; default-src 'self' https://qrmenu.eaglesnestcy.com https://restaurant-menu-flax-kappa.vercel.app; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://qrmenu.eaglesnestcy.com https://restaurant-menu-flax-kappa.vercel.app; connect-src 'self' https://qrmenu.eaglesnestcy.com https://restaurant-menu-flax-kappa.vercel.app;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 