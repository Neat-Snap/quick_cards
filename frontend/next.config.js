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
            value: "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors https://*.telegram.org https://web.telegram.org;"
          },
          // Remove X-Frame-Options to allow Telegram to embed
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ],
      },
    ];
  },
  // Enable CORS for API routes - update for the correct endpoint format
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
      // Fallback for any other API calls
      {
        source: '/api/:path*',
        destination: 'https://face-cards.ru/:path*',
      }
    ];
  },
};

module.exports = nextConfig; 