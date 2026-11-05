import type { NextConfig } from 'next';

const apiUrl = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/$/, '');

// Exact host of the S3 / CDN bucket that serves product images (e.g. "cdn.nuska.kg").
const imagesHost = process.env.NEXT_PUBLIC_IMAGES_HOST;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@nuska/types'],
  // Linting runs from the monorepo root (`pnpm lint`).
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: imagesHost ? [{ protocol: 'https', hostname: imagesHost }] : [],
  },
  /**
   * The browser talks to the API through the same origin (/api/*), so the
   * httpOnly auth cookies are first-party and no CORS is involved.
   */
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
