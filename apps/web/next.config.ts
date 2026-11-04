import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Product images will be served from S3-compatible storage / CDN.
  // Add its exact hostname to images.remotePatterns once it is chosen.
  transpilePackages: ['@nuska/types'],
  // Linting runs from the monorepo root (`pnpm lint`).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
