import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    console.log('=== Webpack Config Debug ===');
    console.log('isServer:', isServer);
    console.log('Original mainFields:', config.resolve.mainFields);
    console.log('Original alias:', config.resolve.alias?.['paper']);

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

      console.log('Updated mainFields:', config.resolve.mainFields);
      console.log('Updated alias:', config.resolve.alias?.['paper$']);
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
