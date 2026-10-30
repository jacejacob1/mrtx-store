"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useCatalogue } from "@/components/CatalogueProvider";

/**
 * Apple's shelf: a horizontal row that snaps card by card, with the
 * next card always peeking so it's obvious there's more. Native
 * scrolling underneath — swipe, trackpad and keyboard all just work —
 * and the arrow buttons only call scrollBy.
 */
export function ProductRail() {
  const products = useCatalogue();
  const rail = useRef<HTMLUListElement | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () =>
      setEdge({
        start: el.scrollLeft < 8,
        end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
      });
    // First measurement on the next frame, not synchronously: setting
    // state directly in an effect body is what React 19's linter flags.
    const first = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(first);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 20), behavior: "smooth" });
  };

  return (
    <section data-ground="light" className="relative z-10 py-24 md:py-32" aria-labelledby="drop-h">
      <div className="mx-auto flex max-w-[1240px] items-end justify-between gap-6 px-5">
        <div>
          <p className="t-eyebrow text-accent">SS26 · Drop 001</p>
          <h2 id="drop-h" className="t-display mt-3">
            The drop.
          </h2>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Arrow dir={-1} disabled={edge.start} onClick={() => step(-1)} />
          <Arrow dir={1} disabled={edge.end} onClick={() => step(1)} />
        </div>
      </div>

      <ul
        ref={rail}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-4 md:px-[max(20px,calc((100vw-1240px)/2+20px))]"
        style={{ scrollPaddingInline: "max(20px, calc((100vw - 1240px) / 2 + 20px))" }}
      >
        {products.map((p, i) => (
          <li key={p.slug} className="w-[82vw] shrink-0 snap-start sm:w-[46vw] lg:w-[34vw] xl:w-[400px]">
            <ProductCard product={p} sizes="(min-width: 1280px) 400px, (min-width: 1024px) 34vw, (min-width: 640px) 46vw, 82vw" eager={i < 2} />
          </li>
        ))}
        <li aria-hidden className="w-px shrink-0" />
      </ul>

      <div className="mx-auto mt-8 max-w-[1240px] px-5">
        <Link href="/shop" className="t-body text-accent underline-offset-4 hover:underline">
          Shop all five
        </Link>
      </div>
    </section>
  );
}

function Arrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? "Next" : "Previous"}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-fg transition-opacity duration-300 disabled:opacity-30"
    >
      <svg width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }}>
        <path d="M1.5 1.5 7.5 7.5l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default ProductRail;
