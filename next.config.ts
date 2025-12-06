import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias['paper'] = false;
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
