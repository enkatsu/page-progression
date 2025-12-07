import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    console.log('🔧 Webpack config - isServer:', isServer);
    if (isServer) {
      console.log('🔧 Setting paper alias to false for server-side');
      // サーバーサイドでは paper を完全に無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        paper: false,
      };
    } else {
      console.log('🔧 Client-side build - paper will use paper/dist/paper-core');
      // クライアント側でもNode.js依存モジュールを無効化
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        jsdom: false,
        fs: false,
      };
      // paper/dist/node配下のモジュールも無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        'paper/dist/node/canvas': false,
        'paper/dist/node/self': false,
      };
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
