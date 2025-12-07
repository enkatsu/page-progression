import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    // Paper.js package.json の main フィールドを確認
    const paperPkgPath = path.resolve(process.cwd(), 'node_modules/paper/package.json');
    if (fs.existsSync(paperPkgPath)) {
      const paperPkg = JSON.parse(fs.readFileSync(paperPkgPath, 'utf8'));
      console.log('📦 Paper.js package.json main:', paperPkg.main);
    }

    if (isServer) {
      // サーバーサイドでは paper を完全に無効化
      config.resolve.alias = {
        ...config.resolve.alias,
        paper: false,
      };
      console.log('🔧 Server-side: paper alias set to false');
    } else {
      // クライアントサイドでは paper を paper-core.js に置き換え
      const paperCorePath = path.resolve(process.cwd(), 'node_modules/paper/dist/paper-core.js');
      console.log('🔧 Client-side: paper alias set to', paperCorePath);
      console.log('🔍 File exists:', fs.existsSync(paperCorePath));

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
