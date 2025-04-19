/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure headers to allow Telegram WebApp integration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org; connect-src 'self' https://face-cards.ru; img-src 'self' data: blob: https://*; style-src 'self' 'unsafe-inline';"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ],
      },
    ];
  },
  // Enable CORS for API routes
  async rewrites() {
    return [
      {
        source: '/validate',
        destination: 'https://face-cards.ru/validate',
      },
      {
        source: '/users/:path*',
        destination: 'https://face-cards.ru/users/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'https://face-cards.ru/:path*',
      }
    ];
  },
}

module.exports = nextConfig 