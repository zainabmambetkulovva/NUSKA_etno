import type { NextConfig } from 'next';

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
    // 95: the company's product photos are shown without visible compression
    qualities: [75, 95],
    // optimized copies are kept for 30 days; a changed picture gets a new file name
    minimumCacheTTL: 2_592_000,
    remotePatterns: imagesHost ? [{ protocol: 'https', hostname: imagesHost }] : [],
  },
  async headers() {
    return [
      {
        // pictures in /public: a week in the browser, then quietly refreshed
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
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
