import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The masters in public/media are 2400px on the long edge. next/image
    // serves each visitor the smallest of these that fills their screen.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1280, 1600, 2048, 2400],
    imageSizes: [96, 160, 256, 384],
  },
};

export default nextConfig;
