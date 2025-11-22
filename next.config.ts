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
};

export default nextConfig;
