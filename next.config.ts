import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/install.sh",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/explorer", destination: "/connect", permanent: true },
      { source: "/usernodes", destination: "/workspace", permanent: true },
      { source: "/usernode/:id", destination: "/workspace", permanent: true },
      { source: "/mint", destination: "/", permanent: true },
    ];
  },
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
