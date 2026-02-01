import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.aceternity.com",
        pathname: "/**",
      },
    ],
  },
  // Turbopack configuration (dev only)
  turbopack: {
    // Resolve aliases for compatibility
    resolveAlias: {
      // Map modules that need special handling
    },
  },
  // Keep webpack config for production builds and external modules
  webpack: (config: { externals: string[] }) => {
    config.externals = config.externals || [];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
