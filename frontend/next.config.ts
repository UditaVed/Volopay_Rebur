import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Allow images from Supabase storage in production
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ycnbnwdwcoddowwmzzgk.supabase.co",
      },
    ],
  },
};

export default nextConfig;
