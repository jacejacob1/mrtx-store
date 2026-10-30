import type { NextConfig } from "next";

// Photos uploaded from the admin dashboard live in Supabase Storage
// (bucket "media"). Only that bucket may be fed through the optimiser.
const supabaseHost = (() => {
  try {
    return new URL(process.env.SUPABASE_URL ?? "https://aywsimktbphyksmykrvg.supabase.co").hostname;
  } catch {
    return "aywsimktbphyksmykrvg.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    // The masters in public/media are 2400px on the long edge. next/image
    // serves each visitor the smallest of these that fills their screen.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1280, 1600, 2048, 2400],
    imageSizes: [96, 160, 256, 384],
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" }],
  },
};

export default nextConfig;
