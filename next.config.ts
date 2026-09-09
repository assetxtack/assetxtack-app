/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
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