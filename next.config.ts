import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.aceternity.com", pathname: "/**" },
      { protocol: "https", hostname: "**.ipfs.nftstorage.link", pathname: "/**" },
      { protocol: "https", hostname: "arweave.net", pathname: "/**" },
      { protocol: "https", hostname: "ipfs.io", pathname: "/**" },
      { protocol: "https", hostname: "cdn.helius-rpc.com", pathname: "/**" },
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
};

export default nextConfig;
