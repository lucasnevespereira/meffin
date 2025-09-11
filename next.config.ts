import type { NextConfig } from "next";

function getAppVersion(): string {
  try {
    const packageJson = require('./package.json');
    return packageJson.version;
  } catch (err) {
    return '0.1.0';
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    APP_VERSION: getAppVersion(),
  },
  images: {
    unoptimized: true,
    domains: ["lh3.googleusercontent.com", "localhost", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
