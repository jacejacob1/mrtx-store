import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BagDrawer } from "@/components/BagDrawer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mrtx.club"),
  title: { default: "MRTX CLUB", template: "%s — MRTX CLUB" },
  description: "Five pieces. Five sentences. Oversized tees, cut and sewn in Tirupur.",
  openGraph: { type: "website", siteName: "MRTX CLUB", url: "https://mrtx.club" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-ground="light">
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[60] focus-visible:rounded-full focus-visible:bg-fg focus-visible:px-4 focus-visible:py-2 focus-visible:text-bg"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <BagDrawer />
      </body>
    </html>
  );
}
