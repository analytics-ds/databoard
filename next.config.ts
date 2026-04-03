import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server mode for API routes + auth
  // Will configure Cloudflare deployment separately
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],
};

export default nextConfig;
