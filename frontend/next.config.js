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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://face-cards.ru/api';
    
    return [
      // Rewrite for auth validation - both paths for compatibility
      {
        source: '/api/validate',
        destination: `${apiBaseUrl}/v1/auth/validate`,
      },
      {
        source: '/api/v1/auth/validate',
        destination: `${apiBaseUrl}/v1/auth/validate`,
      },
      // Rewrite for users endpoints
      {
        source: '/api/users/:path*',
        destination: `${apiBaseUrl}/users/:path*`,
      },
      // Rewrite for auth endpoints
      {
        source: '/api/v1/auth/:path*',
        destination: `${apiBaseUrl}/v1/auth/:path*`,
      },
      // Fallback for any other API calls
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      }
    ];
  },
};

module.exports = nextConfig; 