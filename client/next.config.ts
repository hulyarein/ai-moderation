import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // swcMinify is removed as it's now the default in Next.js 15+

  // Configure proper Turbopack support
  experimental: {
    turbo: {},
  },

  images: {
    remotePatterns: [
      new URL("https://aliac-ai-moderation-backend.wetooa.me/**"),
    ],
  },

  // Ensure proper handling of the Socket.IO endpoints
  rewrites: async () => {
    return [
      {
        source: "/socket.io/:path*",
        destination: "/api/socketio/:path*",
      },
    ];
  },
};

export default nextConfig;
