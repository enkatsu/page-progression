import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias['paper'] = false;
      config.resolve.alias['canvas'] = false;
      config.resolve.alias['jsdom'] = false;
    }
    // クライアントサイドでもcanvasとjsdomを無視
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      jsdom: false,
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
