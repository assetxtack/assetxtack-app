/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://assetxtack-eeca0.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

module.exports = nextConfig;