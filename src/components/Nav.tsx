"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wordmark } from "@/components/Wordmark";
import { DotText } from "@/components/DotText";
import { openBag, useBagTotals } from "@/lib/cart";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
] as const;

type Ground = "dark" | "light" | "red";

/**
 * Apple's translucent bar, with one Nothing habit: it reads the section
 * underneath it and takes that section's ground. Black over the hero,
 * white over the shop, red over SOLITUDE — so the bar is never a
 * hardcoded colour fighting what's behind it.
 */
export function Nav() {
  const pathname = usePathname();
  const { count } = useBagTotals();
  const [ground, setGround] = useState<Ground>("dark");
  const [menu, setMenu] = useState(false);
  const self = useRef<HTMLElement | null>(null);

  // Close the mobile menu on navigation — React's documented "adjust
  // state when a prop changes" pattern. State, not a ref: writing a ref
  // during render is something React 19's linter rejects.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenu(false);
  }

  // The page behind an open menu must not scroll underneath it.
  useEffect(() => {
    document.documentElement.style.overflow = menu ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menu]);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = (self.current?.offsetHeight ?? 48) / 2;
      const stack = document.elementsFromPoint(window.innerWidth / 2, y);
      for (const el of stack) {
        if (self.current?.contains(el)) continue;
        const host = (el as HTMLElement).closest<HTMLElement>("[data-ground]");
        if (host && !self.current?.contains(host)) {
          const g = host.dataset.ground as Ground;
          setGround((prev) => (prev === g ? prev : g));
          return;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    // First read on the next frame — after the new route has painted,
    // and not as a synchronous setState in the effect body.
    raf = requestAnimationFrame(read);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <header
      ref={self}
      data-ground={menu ? "dark" : ground}
      className="glass fixed inset-x-0 top-0 z-50 transition-colors duration-500"
      style={{ background: menu ? "var(--bg)" : undefined }}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-12 max-w-[1240px] items-center justify-between px-5"
      >
        <Link href="/" aria-label="MRTX CLUB, home" className="-m-2 p-2">
          <Wordmark decorative className="h-[13px] w-auto text-fg" />
        </Link>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-[13px] tracking-[-0.01em] transition-colors duration-300 ${
                    active ? "text-fg" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openBag}
            className="relative -m-1 flex items-center gap-2 rounded-full p-2 text-fg"
            aria-label={count ? `Bag, ${count} item${count === 1 ? "" : "s"}` : "Bag, empty"}
          >
            <BagIcon />
            {count > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="live-dot" aria-hidden />
                <DotText text={String(count).padStart(2, "0")} size={9} label="" />
              </span>
            )}
          </button>

          <button
            type="button"
            className="-mr-2 flex h-10 w-10 items-center justify-center md:hidden"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            onClick={() => setMenu((v) => !v)}
          >
            <span className="relative block h-3 w-4">
              <span
                className="absolute left-0 h-px w-4 bg-fg transition-transform duration-500 ease-sheet"
                style={{ top: 2, transform: menu ? "translateY(3.5px) rotate(45deg)" : undefined }}
              />
              <span
                className="absolute left-0 h-px w-4 bg-fg transition-transform duration-500 ease-sheet"
                style={{ top: 9, transform: menu ? "translateY(-3.5px) rotate(-45deg)" : undefined }}
              />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-x-0 top-12 bottom-0 bg-bg px-8 pt-8 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="space-y-3">
              {[{ href: "/", label: "Home" }, ...LINKS].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                >
                  <Link href={l.href} className="t-headline block text-fg">
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden>
      <path d="M1.5 5.5h12l-.9 10H2.4l-.9-10Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.8 5.5V4a2.7 2.7 0 0 1 5.4 0v1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default Nav;
