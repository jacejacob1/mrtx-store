import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — MRTX Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/** The dashboard lives on the MRTX dark ground. Nothing here is linked from the shop. */
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <div data-ground="dark" className="min-h-[100svh] bg-bg text-fg">
      {children}
    </div>
  );
}
