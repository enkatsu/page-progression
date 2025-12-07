import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでは paper を完全に無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        paper: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
