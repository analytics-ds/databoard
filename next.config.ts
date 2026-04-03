import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
