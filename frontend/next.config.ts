import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
    },
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
