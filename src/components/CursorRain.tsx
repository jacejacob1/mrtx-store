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
   * Live band position, in px from the top of the viewport. Read every
   * frame so a glyph burns white the instant it crosses into the
   * aperture. A ref rather than a prop because this changes ~60×/sec
   * and must not re-render React.
   */
  bandY: RefObject<number>;
  bandH: RefObject<number>;
};

/**
 * Matrix rain falling FROM the pointer — CLAUDE.md §8.
 *
 * The real system cursor stays visible. Hiding it was tried and it made
 * the email field feel broken.
 *
 * Never initialises on coarse pointers: `(hover: hover) and
 * (pointer: fine)` only. On touch it's invisible battery drain.
 */
export function CursorRain({ bandY, bandH }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // §8 + §7: no rain on touch, no rain under reduced motion.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();

    const drops: Drop[] = [];
    let px = -1e4;
    let py = -1e4;
    let speed = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      if (px > -1e3) speed = Math.min(Math.hypot(dx, dy), 60);
      px = e.clientX;
      py = e.clientY;
    };

    const spawn = (now: number) => {
      // §8: move faster → rain harder.
      const n = speed > 26 ? 3 : speed > 10 ? 2 : speed > 1.5 ? 1 : 0;
      for (let i = 0; i < n && drops.length < MAX; i++) {
        drops.push({
          // §8: spawn 5px right and 15px below the hotspot, so the
          // arrow never covers the glyphs.
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
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = `${SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";

      const top = bandY.current;
      const bottom = top + bandH.current;

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const age = now - d.born;
        if (age > LIFE || d.y > window.innerHeight + 40) {
          drops.splice(i, 1);
          continue;
        }
        d.y += d.vy * dt;
        if (d.head && age > 90) d.head = false;

        const fade = 1 - age / LIFE;

        // §8: blue over paper, burning WHITE the instant a glyph
        // crosses into the aperture.
        const inside = d.y + SIZE > top && d.y < bottom;
        ctx.fillStyle = inside
          ? `rgba(255,255,255,${fade})`
          : `rgba(37,99,235,${fade * 0.85})`;

        // §8: the head glyph of each column gets an 8px glow.
        if (d.head) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = inside ? "#FFFFFF" : "#2563EB";
        } else {
          ctx.shadowBlur = 0;
        }

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
    <canvas
      ref={ref}
      // §11: decorative canvas is aria-hidden and pointer-events:none.
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[8]"
    />
  );
}

export default CursorRain;
