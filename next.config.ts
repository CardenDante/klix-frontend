import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // ❌ Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❌ Allow production builds to complete even if there are type errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow any HTTPS domain for production
      },
    ],
  },
};

export default nextConfig;
