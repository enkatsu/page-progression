import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer, webpack }) => {
    // Paper.js の Node.js 専用モジュールを無効化
    config.resolve.alias = {
      ...config.resolve.alias,
      // サーバーサイドでは paper を完全に無効化
      ...(isServer && { 'paper': false }),
    };

    // NormalModuleReplacementPlugin で paper-full を paper-core に置き換え
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^paper$/,
          'paper/dist/paper-core.js'
        )
      );
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
