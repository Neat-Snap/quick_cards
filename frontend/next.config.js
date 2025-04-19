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
  // Enable CORS for API routes - standardize to use /api prefix
  async rewrites() {
    return [
      {
        source: '/validate',
        destination: 'https://face-cards.ru/api/v1/auth/validate',
      },
      {
        source: '/api/validate',
        destination: 'https://face-cards.ru/api/v1/auth/validate',
      },
      {
        source: '/api/users/:path*',
        destination: 'https://face-cards.ru/api/users/:path*',
      },
      // Fallback for any other API calls
      {
        source: '/api/:path*',
        destination: 'https://face-cards.ru/api/:path*',
      }
    ];
  },
};

module.exports = nextConfig; 