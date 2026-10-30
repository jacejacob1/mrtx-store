"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { DotText } from "@/components/DotText";
import { useCatalogue } from "@/components/CatalogueProvider";
import { layout } from "@/lib/dotfont";
import { SIZES, type Size } from "@/lib/catalogue";

/**
 * THE GLYPH BOARD — live stock as a dot-matrix panel.
 *
 * One lit bar is one tee still on the shelf. When a tee sells, its dot
 * flashes red and goes dark; a size that runs out goes dark entirely.
 * It's an honest scarcity signal: the numbers come from the database
 * (polled every 15s), not a fake "only 3 left!" timer.
 *
 * Drawn on a canvas — ~5,000 dots, so SVG would be too heavy to animate
 * — at the screen's pixel density. Dots near the cursor glow, the way
 * a Glyph light warms up. Under reduced motion it's a still panel.
 */

const CAP = 30; // bars shown per size; the number on the right is always exact
const LABEL_COLS = 22; // "XXL" is 17 dots wide; leave air before the bars
const UNIT0 = LABEL_COLS;
const COUNT0 = UNIT0 + CAP * 2 + 3;
const COLS = COUNT0 + 17;
const SIZE_ROW0 = 10;
const ROWS = SIZE_ROW0 + SIZES.length * 9 - 2;

const COL = {
  off: "rgba(255,255,255,0.075)",
  glow: "rgba(255,255,255,0.28)",
  on: "#f5f5f7",
  low: "#ff3b30",
  dim: "rgba(255,255,255,0.32)",
};

type Stock = Record<string, Record<Size, number>>;
type Flash = { slug: string; size: Size; from: number; to: number; t: number };

const jitter = (x: number, y: number) => ((x * 928371 + y * 1237) % 97) / 97;

export function GlyphBoard() {
  const products = useCatalogue();
  const reduce = useReducedMotion();
  const [stock, setStock] = useState<Stock>(() => Object.fromEntries(products.map((p) => [p.slug, p.stock])));
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const p = products[i % products.length];

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const sweepAt = useRef(0);
  const flashes = useRef<Flash[]>([]);
  const raf = useRef(0);
  const stockRef = useRef(stock);
  useEffect(() => {
    stockRef.current = stock;
  }, [stock]);

  const total = useMemo(
    () => Object.values(stock).reduce((n, s) => n + SIZES.reduce((m, z) => m + (s[z] ?? 0), 0), 0),
    [stock],
  );

  /* ── drawing ── */
  const draw = useCallback(
    (now: number) => {
      const c = canvas.current;
      if (!c || !p) return false;
      const ctx = c.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const pitch = w / COLS;
      const h = pitch * ROWS; // the element's aspect-ratio matches, so no layout shift
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const s = stockRef.current[p.slug] ?? p.stock;
      const sweep = reduce ? 1 : Math.min(1, (now - sweepAt.current) / 650);
      const ptr = pointer.current;
      const r = pitch * 0.36;
      let busy = sweep < 1 || !!ptr;

      // what's lit, cell by cell
      const lit = new Map<number, string>();
      const key = (x: number, y: number) => y * COLS + x;
      const text = (str: string, x0: number, y0: number, color: string) => {
        for (const d of layout(str).dots) if (d.on) lit.set(key(x0 + d.x, y0 + d.y), color);
      };

      text(`${p.index} ${p.name}`, 0, 0, COL.on);
      SIZES.forEach((z, k) => {
        const y0 = SIZE_ROW0 + k * 9;
        const n = s[z] ?? 0;
        const low = n > 0 && n <= 3;
        text(z, 0, y0, n === 0 ? COL.dim : COL.on);
        for (let u = 0; u < Math.min(n, CAP); u++) {
          for (let yy = 1; yy <= 5; yy++) lit.set(key(UNIT0 + u * 2, y0 + yy), low ? COL.low : COL.on);
        }
        text(n > 999 ? "999" : String(n).padStart(2, "0"), COUNT0, y0, n === 0 ? COL.low : low ? COL.low : COL.on);
      });

      // units that just sold: flash red, then fade out
      flashes.current = flashes.current.filter((f) => now - f.t < 1100);
      for (const f of flashes.current) {
        if (f.slug !== p.slug) continue;
        busy = true;
        const k = SIZES.indexOf(f.size);
        const a = 1 - (now - f.t) / 1100;
        for (let u = f.to; u < Math.min(f.from, CAP); u++) {
          for (let yy = 1; yy <= 5; yy++) lit.set(key(UNIT0 + u * 2, SIZE_ROW0 + k * 9 + yy), `rgba(255,59,48,${a.toFixed(3)})`);
        }
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cx = (x + 0.5) * pitch;
          const cy = (y + 0.5) * pitch;
          let color = lit.get(key(x, y));
          if (color && x / COLS + jitter(x, y) * 0.18 > sweep * 1.18) color = undefined; // not yet switched on
          let rad = r;
          if (ptr) {
            const d = Math.hypot(cx - ptr.x, cy - ptr.y) / (pitch * 9);
            if (d < 1) {
              const g = 1 - d;
              if (!color) color = `rgba(255,255,255,${(0.075 + g * 0.22).toFixed(3)})`;
              else rad = r * (1 + g * 0.18);
            }
          }
          ctx.fillStyle = color ?? COL.off;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return busy;
    },
    [p, reduce],
  );

  const kick = useCallback(() => {
    if (raf.current) return;
    const loop = (now: number) => {
      raf.current = 0;
      if (draw(now)) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, [draw]);

  // redraw (with the switch-on sweep) whenever the tee changes
  useEffect(() => {
    sweepAt.current = performance.now();
    kick();
  }, [p?.slug, kick]);

  // keep crisp on resize
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ro = new ResizeObserver(() => kick());
    ro.observe(c);
    return () => ro.disconnect();
  }, [kick]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // cycle through the tees, unless someone's looking closely
  useEffect(() => {
    if (reduce || paused || products.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % products.length), 5200);
    return () => clearInterval(t);
  }, [reduce, paused, products.length]);

  // live stock
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/stock", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as Stock;
        if (!alive) return;
        const now = performance.now();
        for (const [slug, sizes] of Object.entries(next)) {
          for (const z of SIZES) {
            const before = stockRef.current[slug]?.[z];
            if (before !== undefined && sizes[z] < before) {
              flashes.current.push({ slug, size: z, from: before, to: sizes[z], t: now });
            }
          }
        }
        setStock(next);
        kick();
      } catch {
        /* offline — keep showing the last known numbers */
      }
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [kick]);

  if (!p) return null;
  const s = stock[p.slug] ?? p.stock;
  const summary = `${p.name}: ${SIZES.map((z) => `${z} ${s[z] ?? 0} left`).join(", ")}`;

  return (
    <div
      data-ground="dark"
      className="rounded-[32px] bg-[#0b0b0c] p-5 text-fg ring-1 ring-white/5 ring-inset md:p-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-fg-2">
        <div className="flex items-center gap-3">
          <span className="live-dot" aria-hidden />
          <DotText text="LIVE STOCK" size={9} label="Live stock" />
        </div>
        <DotText text={`${total} LEFT`} size={9} label={`${total} tees left in the drop`} />
      </div>

      <canvas
        ref={canvas}
        role="img"
        aria-label={summary}
        className="mt-6 block w-full touch-pan-y"
        style={{ aspectRatio: `${COLS} / ${ROWS}` }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          pointer.current = reduce ? null : { x: e.clientX - r.left, y: e.clientY - r.top };
          kick();
        }}
        onPointerLeave={() => {
          pointer.current = null;
          kick();
        }}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1" role="group" aria-label="Choose a tee">
          {products.map((x, n) => (
            <button
              key={x.slug}
              type="button"
              aria-pressed={n === i % products.length}
              aria-label={x.name}
              onClick={() => {
                setI(n);
                setPaused(true);
              }}
              className={`rounded-full px-3 py-2 transition-colors ${
                n === i % products.length ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              <DotText text={x.index} size={8} label="" />
            </button>
          ))}
        </div>
        <p className="t-small text-white/50">One dot, one tee. They go dark as they sell.</p>
      </div>
    </div>
  );
}

export default GlyphBoard;
