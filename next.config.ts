import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    // Paper.js のエイリアスを設定（クライアント・サーバー共通）
    config.resolve.alias = {
      ...config.resolve.alias,
      paper$: isServer ? false : 'paper/dist/paper-core.js',
    };

    return config;
  },
  turbopack: {},
};

export default nextConfig;
