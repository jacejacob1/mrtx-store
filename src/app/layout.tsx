import type { Metadata, Viewport } from "next";
import { CONFIG } from "@/lib/config";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
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
      <body className="flex min-h-screen flex-col">
        {/* §11: a skip link is the cheapest real accessibility win
            there is, and the nav is fixed so keyboard users would
            otherwise tab it on every route. */}
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:bg-paper focus-visible:px-4 focus-visible:py-2"
        >
          skip to content
        </a>
        <Nav />
        {/* Spacer for the fixed nav. */}
        <div className="h-[57px] shrink-0" aria-hidden />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
