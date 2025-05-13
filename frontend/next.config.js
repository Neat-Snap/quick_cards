/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors https://*.telegram.org https://web.telegram.org;"
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ],
      },
    ];
  },
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
    
    return [
      {
        source: '/api/v1/auth/init',
        destination: `${apiBaseUrl}/v1/auth/init`,
      },
      {
        source: '/api/v1/auth/validate',
        destination: `${apiBaseUrl}/v1/auth/validate`,
      },
      {
        source: '/api/validate',
        destination: `${apiBaseUrl}/v1/auth/validate`,
      },
      {
        source: '/api/users/:path*',
        destination: `${apiBaseUrl}/users/:path*`,
      },
      {
        source: '/api/v1/auth/:path*',
        destination: `${apiBaseUrl}/v1/auth/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      }
    ];
  },
};

module.exports = nextConfig; 