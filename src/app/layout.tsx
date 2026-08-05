import type { Metadata, Viewport } from "next";
import { CONFIG } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.DOMAIN),
  title: {
    default: "MRTX CLUB",
    template: "%s — MRTX CLUB",
  },
  description: "A design brand like nothing.",
  openGraph: {
    type: "website",
    siteName: "MRTX CLUB",
    url: CONFIG.DOMAIN,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // §9: env(safe-area-inset-*) needs this
  themeColor: "#F2F2F0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
