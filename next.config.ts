import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Empty turbopack config — many apps work fine without custom config
  turbopack: {},
  // Increase body size limit for long AI responses
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Allow images from any domain for company logos
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
