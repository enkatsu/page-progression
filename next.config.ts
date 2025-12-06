import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでは paper を完全に無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        paper: false,
      };
    } else {
      // クライアントサイドでは paper を paper-core.js に置き換え
      // 絶対パスで指定して確実に解決
      const paperCorePath = path.resolve(process.cwd(), 'node_modules/paper/dist/paper-core.js');

      config.resolve.alias = {
        ...config.resolve.alias,
        paper: paperCorePath,
      };
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
