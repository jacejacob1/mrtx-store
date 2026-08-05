"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { useCartTotals } from "@/lib/cart";

const LINKS = [
  { href: "/shop", label: "shop" },
  { href: "/lookbook", label: "lookbook" },
  { href: "/about", label: "about" },
] as const;

/**
 * Site nav — §2, §13.
 *
 * Sits above the aperture (z-20 against the band's z-5) so it stays
 * legible no matter where the slit is. §13: lowercase for words,
 * uppercase for system readouts — so the links are lowercase and the
 * cart count, which is a number the machine knows, is mono.
 *
 * No blue here. §2 allows roughly three blue things per screen and the
 * product page spends its one on the add-to-cart underline; a blue
 * nav link would compete with it.
 */
export function Nav() {
  const pathname = usePathname();
  const { count } = useCartTotals();

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-line bg-paper/92 backdrop-blur-[2px]">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-[max(20px,env(safe-area-inset-left))] py-4"
      >
        <Link href="/" aria-label="MRTX CLUB — home" className="shrink-0">
          <Wordmark decorative className="w-[68px] text-ink" />
        </Link>

        <div className="flex items-center gap-[clamp(14px,3vw,34px)]">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className="text-[13px] transition-colors duration-250"
                style={{
                  color: active ? "var(--color-ink)" : "var(--color-mute)",
                }}
              >
                {l.label}
              </Link>
            );
          })}

          <Link
            href="/cart"
            className="mono text-[13px] text-ink"
            aria-label={
              count === 0 ? "Cart, empty" : `Cart, ${count} items`
            }
          >
            cart
            <span className="ml-1.5 text-mute">
              [{String(count).padStart(2, "0")}]
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Nav;
