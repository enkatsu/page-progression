import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでは paper を完全に無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        'paper': false,
      };
    } else {
      // クライアントサイドでは browser フィールドを優先し、
      // paper のエントリポイントを paper-core.js に変更
      config.resolve.alias = {
        ...config.resolve.alias,
        'paper$': 'paper/dist/paper-core.js',
      };

      // browser フィールドを優先的に使用
      config.resolve.mainFields = ['browser', 'module', 'main'];
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
