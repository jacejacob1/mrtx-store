"use client";

import { useEffect, useRef, useState } from "react";
import {
  FRAMES,
  CUT_MS,
  frameSrc,
  frameSrcSet,
  FRAME_SIZES,
} from "@/lib/frames";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCountdown, CountdownView } from "@/components/Countdown";
import { CursorRain } from "@/components/CursorRain";

/**
 * Home hero — full-bleed match cut.
 *
 * Eight frames, each with the wordmark baked in at the dead centre of a
 * square master. `object-fit: cover` on a square image keeps the centre
 * on the same screen pixels at every aspect ratio, so the world changes
 * every 2.5s and the mark does not move at all.
 *
 * There is no SVG wordmark and no tagline here any more: the mark IS the
 * photograph. That also means no blend finishes on this page — §6's
 * finishes apply to the SVG mark over a tiled material, which is still
 * how the lookbook, the product media and the 404 work.
 *
 * DOUBLE BUFFERED. Two <img> elements alternate. The next frame is
 * loaded and DECODED on the hidden one before visibility flips, so a
 * cut is a true cut: no fade, no flash of empty, no half-painted image.
 * Only two frames are ever decoded in memory, which matters because a
 * 2560² frame is ~26 MB decoded and eight of them would not fit on a
 * phone.
 */
export function Hero() {
  useViewportHeight();
  const calm = useReducedMotion();
  const parts = useCountdown();

  const [i, setI] = useState(0);
  // Which buffer is currently showing. The other one is being loaded.
  const [front, setFront] = useState(0);
  // One ref holding both elements, rather than an array of two refs —
  // an array literal is a new identity every render, which makes the
  // effect's dependency list dishonest.
  const bufs = useRef<(HTMLImageElement | null)[]>([null, null]);
  const busy = useRef(false);

  const frame = FRAMES[i];

  /* Warm the whole set once the page has loaded.
     §10 says preload only the first and lazy-load the rest after `load`,
     which is exactly this. It matters much more at a short CUT_MS: at
     2.5s the rotation outran the network comfortably, but a fast cut
     reaches frame two before it has been fetched, and the first cycle
     arrives ragged instead of rhythmic. Warming costs nothing after
     first paint and makes every cycle after the first identical. */
  useEffect(() => {
    if (calm) return;

    const warm = () => {
      for (const f of FRAMES) {
        const im = new Image();
        // Same srcset and sizes as the buffers, so the browser resolves
        // to the same file and the cache actually hits.
        im.sizes = FRAME_SIZES;
        im.srcset = frameSrcSet(f.id);
        im.src = frameSrc(f.id, 1600);
      }
    };

    if (document.readyState === "complete") {
      warm();
      return;
    }
    window.addEventListener("load", warm, { once: true });
    return () => window.removeEventListener("load", warm);
  }, [calm]);

  /* The cut loop.
     Self-scheduling timeout rather than setInterval: the delay is
     measured from when the previous cut COMPLETED, so a slow decode
     delays one cut instead of eating the next tick and making the
     rhythm lurch. At 2.5s the difference was invisible; at a few
     hundred ms it is the difference between a beat and a stutter. */
  useEffect(() => {
    // §7: prefers-reduced-motion — no auto-cuts. The first frame stays.
    if (calm) return;

    let cancelled = false;
    let timer = 0;

    const tick = async () => {
      if (busy.current) return;
      busy.current = true;

      const next = (i + 1) % FRAMES.length;
      const back = front === 0 ? 1 : 0;
      const img = bufs.current[back];

      if (img) {
        const f = FRAMES[next];
        img.srcset = frameSrcSet(f.id);
        img.sizes = FRAME_SIZES;
        img.src = frameSrc(f.id, 1600);
        img.alt = f.alt;
        try {
          // Wait for a fully decoded bitmap before showing it. Without
          // this the "cut" can land on a partially painted frame.
          await img.decode();
        } catch {
          // decode() rejects if the src changed underneath us or the
          // image failed. Showing it anyway beats stalling the rotation
          // on one bad file.
        }
      }

      busy.current = false;
      if (!cancelled) {
        setI(next);
        setFront(back);
      }
    };

    timer = window.setTimeout(tick, CUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [i, front, calm]);

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-0 overflow-hidden bg-ink"
        // Starts below the fixed nav, which stays solid paper on every
        // route so it is legible over all eight frames.
        style={{ top: "57px" }}
      >
        {[0, 1].map((b) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={b}
            ref={(el) => {
              bufs.current[b] = el;
            }}
            src={b === 0 ? frameSrc(frame.id, 1600) : undefined}
            srcSet={b === 0 ? frameSrcSet(frame.id) : undefined}
            sizes={FRAME_SIZES}
            alt={b === 0 ? frame.alt : ""}
            aria-hidden={b !== front}
            // §10: only the first frame is eager. The rest arrive as the
            // rotation reaches them.
            fetchPriority={b === 0 ? "high" : "low"}
            decoding="sync"
            className="absolute inset-0 size-full object-cover object-center"
            // The cut is a CUT. No transition, ever.
            style={{ opacity: b === front ? 1 : 0 }}
          />
        ))}

        {/* Measured, not chosen. Three frames cannot carry white HUD
            text unaided — glass sits at 2.49:1, the blue field at 3.15,
            the concrete card at 3.23. Compositing --ink over the
            brightest 10% of the readout regions, 0.35 alpha is the
            lowest value at which all eight clear 4.5:1. The gradient
            peaks above that at the very edge where the type sits and
            fades to nothing by 22%, so it reads as a vignette rather
            than a bar. */}
        <div className="hero-scrim" aria-hidden />

        <div
          className="pointer-events-none absolute inset-0"
          style={{ color: "var(--color-white)" }}
        >
          <p
            className="label absolute"
            style={{
              left: "max(20px, env(safe-area-inset-left))",
              bottom: "max(18px, env(safe-area-inset-bottom))",
            }}
          >
            <CountdownView parts={parts} />
          </p>

          <p
            className="label absolute"
            style={{
              right: "max(20px, env(safe-area-inset-right))",
              bottom: "max(18px, env(safe-area-inset-bottom))",
            }}
          >
            IDX {String(i + 1).padStart(3, "0")} / SS26
          </p>
        </div>

        <CursorRain />
      </div>

      {/* The hero is fixed, so the document needs its height back or
          there is nothing to scroll past. Minus the nav spacer the
          layout already contributes. */}
      <div style={{ height: "calc(var(--vh) - 57px)" }} aria-hidden />
    </>
  );
}

export default Hero;
