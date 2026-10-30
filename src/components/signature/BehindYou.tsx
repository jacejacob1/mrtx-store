"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { TeeFace } from "@/components/signature/TeeFace";
import { DotText } from "@/components/DotText";
import { useCatalogue } from "@/components/CatalogueProvider";

/**
 * BEHIND YOU — a lens that reads what the person behind you reads.
 *
 * Every tee stands in a row, front-on. Underneath, perfectly aligned,
 * the same row from behind. The front layer has a round hole cut in it
 * that follows your cursor (or finger), so wherever you look you see
 * the back print — the loud part — through it.
 *
 * Until you touch it, the lens wanders on its own so the idea is
 * obvious at a glance. Position goes straight into CSS variables, not
 * React state, so it runs at the display's refresh rate.
 */
export function BehindYou() {
  const products = useCatalogue();
  const stage = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    let raf = 0;
    let visible = false;
    let user = false;
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const t0 = performance.now();

    const size = () => {
      const r = el.getBoundingClientRect();
      const lens = Math.round(Math.max(70, Math.min(140, r.width * 0.11)));
      el.style.setProperty("--r", `${lens}px`);
      return r;
    };

    const put = (x: number, y: number) => {
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
    };

    const centre = () => {
      const r = size();
      pos.x = target.x = r.width / 2;
      pos.y = target.y = r.height / 2;
      put(pos.x, pos.y);
    };
    centre();
    if (reduce) {
      const onResize = () => centre();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (!user) {
        // a slow figure-eight across the row, so the idea explains itself
        const r = el.getBoundingClientRect();
        const t = (now - t0) / 1000;
        target.x = r.width / 2 + Math.sin(t * 0.42) * r.width * 0.38;
        target.y = r.height / 2 + Math.sin(t * 0.84) * r.height * 0.16;
      }
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      put(pos.x, pos.y);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      user = true;
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      start();
    };
    const leave = () => {
      user = false;
      start();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    el.addEventListener("pointerleave", leave);
    const onResize = () => size();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", onResize);
    };
  }, [reduce, products.length]);

  const row = (side: "front" | "back") => (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-6 md:grid-cols-5 md:gap-x-6" aria-hidden={side === "front"}>
      {products.map((p) => (
        <li key={p.slug}>
          <TeeFace
            side={side}
            hex={p.garment.hex}
            art={p.art[side]}
            uid={`lens-${p.slug}`}
            className="w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)]"
            label={side === "front" ? `${p.name}, front` : undefined}
          />
          {/* Same caption in both layers so nothing shifts inside the lens;
              only the bottom layer's is a link (the top layer ignores the pointer). */}
          <p className="t-small mt-3 text-center text-fg-2">
            {side === "back" ? (
              <Link href={`/shop/${p.slug}`} className="hover:text-fg" tabIndex={0}>
                {p.name}
              </Link>
            ) : (
              p.name
            )}
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <section data-ground="light" aria-labelledby="behind-title" className="relative px-5 py-24 md:py-32">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex items-center gap-3 text-fg-2">
          <DotText text="BEHIND YOU" size={10} label="" />
        </div>
        <h2 id="behind-title" className="t-display mt-6 max-w-[14ch]">
          Read what they read.
        </h2>
        <p className="t-body mt-4 max-w-[44ch] text-fg-2">
          From the front, five quiet tees. Move across them — the lens shows what the person behind you sees.
        </p>

        <div
          ref={stage}
          className="relative mt-14 touch-pan-y select-none md:cursor-none"
          style={{ ["--x" as string]: "50%", ["--y" as string]: "50%", ["--r" as string]: "110px" }}
        >
          {row("back")}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              WebkitMaskImage:
                "radial-gradient(circle var(--r) at var(--x) var(--y), transparent calc(var(--r) - 1.5px), #000 var(--r))",
              maskImage:
                "radial-gradient(circle var(--r) at var(--x) var(--y), transparent calc(var(--r) - 1.5px), #000 var(--r))",
            }}
          >
            {row("front")}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full ring-1 ring-fg/60"
            style={{
              left: "var(--x)",
              top: "var(--y)",
              width: "calc(var(--r) * 2)",
              height: "calc(var(--r) * 2)",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.4) inset, 0 20px 50px rgba(0,0,0,0.12)",
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-fg-2">
              <DotText text="BACK" size={8} label="" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BehindYou;
