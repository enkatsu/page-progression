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
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
