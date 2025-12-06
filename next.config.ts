import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでは Paper.js を完全に無効化
      config.resolve.alias['paper'] = false;
    } else {
      // クライアントサイドでは paper-core を使用（Node.js依存なし）
      config.resolve.alias['paper'] = require.resolve('paper/dist/paper-core.js');
    }

    return config;
  },
  turbopack: {},
};

export default nextConfig;
