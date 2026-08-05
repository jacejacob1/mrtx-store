"use client";

import { useEffect, useRef, type RefObject } from "react";

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

type Props = {
  /**
   * Live band position in px from the top of the hero. Read every
   * frame so a glyph burns white the instant it crosses into the
   * aperture. A ref rather than a prop because it changes ~60x/sec and
   * must not re-render React.
   */
  bandY: RefObject<number>;
  bandH: RefObject<number>;
};

/**
 * Matrix rain falling FROM the pointer — CLAUDE.md §8.
 *
 * The real system cursor stays visible. Hiding it was tried on the
 * coming-soon page and it made the email field feel broken.
 *
 * Scoped to the hero rather than the whole document: §5 bans this kind
 * of motion "anywhere the user is trying to read, choose, or pay", and
 * a fixed canvas would follow the reader into the shop.
 *
 * Never initialises on coarse pointers — `(hover: hover) and
 * (pointer: fine)` only. On touch it is invisible battery drain.
 */
export function CursorRain({ bandY, bandH }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;

    const canvas = ref.current;
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
    let inside = false;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      inside =
        e.clientY >= r.top &&
        e.clientY <= r.bottom &&
        e.clientX >= r.left &&
        e.clientX <= r.right;
      if (!inside) return;
      const nx = e.clientX - r.left;
      const ny = e.clientY - r.top;
      if (px > -1e3) speed = Math.min(Math.hypot(nx - px, ny - py), 60);
      px = nx;
      py = ny;
    };

    const spawn = (now: number) => {
      if (!inside) return;
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

      const top = bandY.current;
      const bottom = top + bandH.current;

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
        // §8: blue over paper, burning WHITE the instant a glyph
        // crosses into the aperture.
        const lit = d.y + SIZE > top && d.y < bottom;

        ctx.fillStyle = lit
          ? `rgba(255,255,255,${fade})`
          : `rgba(37,99,235,${fade * 0.85})`;

        // §8: the head glyph of each column gets an 8px glow.
        ctx.shadowBlur = d.head ? 8 : 0;
        if (d.head) ctx.shadowColor = lit ? "#FFFFFF" : "#2563EB";

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
  }, [bandY, bandH]);

  return (
    // §11: decorative canvas is aria-hidden and pointer-events:none.
    <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-[8]" />
  );
}

export default CursorRain;
