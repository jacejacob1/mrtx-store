"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MATERIALS, CUT_INTERVAL_MS, texturePath } from "@/lib/materials";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCountdown } from "@/components/Countdown";
import { HeroPlane } from "@/components/HeroPlane";
import { CursorRain } from "@/components/CursorRain";

/**
 * The aperture — CLAUDE.md §5.
 *
 *   #band        fixed, height var(--band-h), overflow:hidden,
 *                translate3d(0, y, 0), pointer-events:none
 *     #bandInner height var(--vh), translate3d(0, -y, 0),
 *                isolation:isolate
 *       #tex     the material, translate3d(-drift, y, 0)
 *       .lit     the duplicate page copy, inert + aria-hidden
 *
 * Two stacked transforms and an overflow:hidden. Nothing repaints —
 * it's all compositor work. Do NOT reimplement this with a clip-path
 * animated per frame; that repaints and drops frames on mid-range
 * Android.
 *
 * The two gotchas from §12, both load-bearing:
 *   - `isolation:isolate` on #bandInner. mix-blend-mode only blends
 *     with the backdrop inside its own isolated group. If the texture
 *     were a sibling of the mark, all ten finishes would silently do
 *     nothing — no error, no warning, just a flat mark.
 *   - `pointer-events:none` on #band. It tracks the cursor, so it is
 *     always directly under it. Without this it swallows every click
 *     before the element beneath receives one.
 */
export function Hero() {
  useViewportHeight();
  const calm = useReducedMotion();
  const parts = useCountdown();

  const [mi, setMi] = useState(0);
  const material = MATERIALS[mi];

  const bandRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const texRef = useRef<HTMLDivElement | null>(null);

  // Shared with CursorRain so a glyph can burn white the instant it
  // crosses into the slit. Refs, not state — this changes every frame.
  const bandY = useRef(0);
  const bandH = useRef(0);

  const cut = useCallback((step = 1) => {
    setMi((i) => (i + step + MATERIALS.length) % MATERIALS.length);
    const band = bandRef.current;
    if (!band) return;
    // §7: the shutter jolt after a cut — 260ms, decaying. Restarted by
    // removing and reflowing the class.
    band.classList.remove("jolt");
    void band.offsetWidth;
    band.classList.add("jolt");
  }, []);

  /* ── motion ─────────────────────────────────────────────────────
     The band eases toward the pointer. Left alone, it drifts. All of
     it is written straight to style.transform inside one rAF loop —
     React never re-renders for motion. */
  useEffect(() => {
    const band = bandRef.current;
    const inner = innerRef.current;
    const tex = texRef.current;
    if (!band || !inner || !tex) return;

    const h = () => band.offsetHeight;
    let y = (window.innerHeight - h()) / 2;
    let ty = y;
    let drift = 0;
    let drifting = true;
    let raf = 0;

    bandH.current = h();

    const onMove = (e: PointerEvent) => {
      drifting = false;
      ty = e.clientY - h() / 2;
    };

    // §7: prefers-reduced-motion — no drift, no parallax. The band
    // parks in the middle and stays there. Cuts still work on click.
    const t0 = performance.now();

    const frame = (now: number) => {
      const H = h();
      bandH.current = H;
      const max = window.innerHeight - H;

      if (!calm) {
        if (drifting) {
          ty = (max / 2) * (1 + Math.sin((now - t0) / 2600) * 0.72);
        }
        y += (ty - y) * 0.085;
        drift = ((now - t0) / 90) % 384;
      } else {
        y = max / 2;
        drift = 0;
      }

      const yc = Math.max(0, Math.min(y, max));
      bandY.current = yc;

      band.style.transform = `translate3d(0, ${yc}px, 0)`;
      inner.style.transform = `translate3d(0, ${-yc}px, 0)`;
      // #tex lives inside the isolated group with the mark, so it is
      // counter-translated back into the band's frame every frame
      // rather than being a sibling. Moving it out breaks every finish.
      tex.style.transform = `translate3d(${-drift}px, ${yc}px, 0)`;

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    if (!calm) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [calm]);

  /* ── cuts ───────────────────────────────────────────────────────
     §7: auto-advance every 2400ms. Faster is annoying, slower loses
     the stop-motion feel. Cuts are CUTS — hard frame changes with no
     crossfade. This is the single most brand-defining motion decision.
     Under reduced motion the timer never starts. */
  useEffect(() => {
    if (calm) return;
    const id = window.setInterval(() => cut(1), CUT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [calm, cut]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") cut(-1);
      else if (e.key === "ArrowRight" || e.key === " ") cut(1);
    };
    const onClick = () => cut(1);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [cut]);

  return (
    <>
      {/* The page itself — ink on paper. */}
      <div className="fixed inset-0 z-[1]">
        <HeroPlane
          material={material}
          index={mi}
          parts={parts}
          variant="base"
        />
      </div>

      {/* The aperture. */}
      <div ref={bandRef} id="band" aria-hidden>
        <div ref={innerRef} id="bandInner">
          <div
            ref={texRef}
            id="tex"
            style={{ backgroundImage: `url(${texturePath(material.id)})` }}
          />
          <div
            className="mrtx-lit"
            data-finish={material.finish}
            style={{
              color: material.light
                ? "var(--color-white)"
                : "var(--color-ink)",
              // §6: each material meets the mark through its own blend
              // mode, so the mark isn't sitting ON the material — it's
              // made of it. `null` (KNOCKOUT) punches straight through.
              ["--finish" as string]: material.blend ?? "normal",
            }}
          >
            <HeroPlane
              material={material}
              index={mi}
              parts={parts}
              variant="lit"
            />
          </div>
        </div>
      </div>

      <CursorRain bandY={bandY} bandH={bandH} />
    </>
  );
}

export default Hero;
