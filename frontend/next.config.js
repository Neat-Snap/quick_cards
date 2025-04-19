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
            value: 'ALLOW-FROM https://web.telegram.org/'
          }
        ],
      },
    ];
  },
  // Enable CORS for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://face-cards.ru/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig 