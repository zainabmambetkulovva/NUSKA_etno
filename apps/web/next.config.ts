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
    remotePatterns: imagesHost ? [{ protocol: 'https', hostname: imagesHost }] : [],
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
