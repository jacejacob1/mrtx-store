import type { Metadata, Viewport } from "next";
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

/**
 * The shell every page shares — the shop (app/(site)) and the admin
 * (app/admin) alike. Nav, bag and footer belong to the shop only, so
 * they live in app/(site)/layout.tsx.
 */
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
        {children}
      </body>
    </html>
  );
}
