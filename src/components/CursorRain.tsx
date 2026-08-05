"use client";

import { useEffect, useRef } from "react";
import { typeHexOn } from "@/lib/materials";

/** §8: half-width katakana + 0-9A-F + MRTX. */
const GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFMRTX";

const MAX = 130; // §8: capped at 130 glyphs
const COL = 15; // §8: snapped to a 15px column grid
const SIZE = 13;
const LIFE = 900; // ms

type Drop = {
  x: number;
  y: number;
  vy: number;
  born: number;
  ch: string;
  head: boolean;
};

/**
 * Matrix rain falling FROM the pointer — CLAUDE.md §8.
 *
 * The real system cursor stays visible. Hiding it was tried on the
 * coming-soon page and it made the email field feel broken.
 *
 * §8 says the rain "burns white the instant a glyph crosses into the
 * aperture". There is no aperture on this page any more, so that rule
 * has nothing to key off. The equivalent is to key off the material
 * itself: blue reads fine over the light materials but disappears into
 * `orbit` (#0A1024) and fights `flux` and `grain`, which are the same
 * blue. Over those the glyphs burn to the material's own type colour,
 * which is the measured-legible one.
 *
 * Never initialises on coarse pointers — `(hover: hover) and
 * (pointer: fine)` only. On touch it is invisible battery drain.
 */
export function CursorRain({ materialId }: { materialId: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  // The rAF loop reads the current material every frame but must not
  // restart on every cut — tearing down and re-seeding the canvas ten
  // times a rotation would visibly stutter the rain. Mirroring the prop
  // into a ref keeps the loop alive across cuts. Written in an effect,
  // not during render: a ref mutated mid-render can leave the committed
  // DOM disagreeing with the value the loop reads.
  const mat = useRef(materialId);
  useEffect(() => {
    mat.current = materialId;
  }, [materialId]);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;

    const canvas = ref.current;
    // The canvas fills its parent, which is offset below the fixed nav
    // — so pointer coordinates are converted into parent space rather
    // than assumed to be viewport space.
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();

    const drops: Drop[] = [];
    let px = -1e4;
    let py = -1e4;
    let speed = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const nx = e.clientX - r.left;
      const ny = e.clientY - r.top;
      if (px > -1e3) speed = Math.min(Math.hypot(nx - px, ny - py), 60);
      px = nx;
      py = ny;
    };

    const spawn = (now: number) => {
      // §8: move faster → rain harder.
      const n = speed > 26 ? 3 : speed > 10 ? 2 : speed > 1.5 ? 1 : 0;
      for (let i = 0; i < n && drops.length < MAX; i++) {
        drops.push({
          // §8: spawn 5px right and 15px below the hotspot so the arrow
          // never covers the glyphs, snapped to the column grid.
          x: Math.round((px + 5) / COL) * COL + (i - 1) * COL,
          y: py + 15,
          vy: 0.11 + Math.random() * 0.13,
          born: now,
          ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
          head: true,
        });
      }
    };

    /** "2563EB" -> "37,99,235" */
    const rgb = (hex: string) => {
      const v = hex.replace("#", "");
      return [0, 2, 4]
        .map((i) => parseInt(v.slice(i, i + 2), 16))
        .join(",");
    };

    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 48);
      last = now;
      speed *= 0.9;

      spawn(now);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";

      // Blue over the light materials; the material's own measured type
      // colour over the ones blue would vanish into.
      const typeHex = typeHexOn(mat.current);
      const ink = typeHex === "#FFFFFF" ? "255,255,255" : rgb("#2563EB");
      const glow = typeHex === "#FFFFFF" ? "#FFFFFF" : "#2563EB";

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const age = now - d.born;
        if (age > LIFE || d.y > h + 40) {
          drops.splice(i, 1);
          continue;
        }
        d.y += d.vy * dt;
        if (d.head && age > 90) d.head = false;

        const fade = 1 - age / LIFE;
        ctx.fillStyle = `rgba(${ink},${fade * 0.9})`;

        // §8: the head glyph of each column gets an 8px glow.
        ctx.shadowBlur = d.head ? 8 : 0;
        if (d.head) ctx.shadowColor = glow;

        ctx.fillText(d.ch, d.x, d.y);
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    // §11: decorative canvas is aria-hidden and pointer-events:none.
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[8]"
    />
  );
}

export default CursorRain;
