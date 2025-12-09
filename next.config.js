/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // GitHub Pages対応: 環境変数でbasePathを設定可能
  // 例: NEXT_PUBLIC_BASE_PATH=/chord-progression-next npm run build
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
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

module.exports = nextConfig;
