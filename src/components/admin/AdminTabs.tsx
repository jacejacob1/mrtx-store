"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Today" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 rounded-full bg-surface p-1">
      {TABS.map((t) => {
        const on = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`t-small rounded-full px-3 py-1.5 transition-colors sm:px-4 ${
              on ? "bg-fg text-bg" : "text-fg-2 hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
