import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // クライアントサイドでは paper を paper-core.js に置き換え
      config.resolve.alias = {
        ...config.resolve.alias,
        'paper': path.resolve('./node_modules/paper/dist/paper-core.js'),
      };
    } else {
      // サーバーサイドでは paper を無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        'paper': false,
      };
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
