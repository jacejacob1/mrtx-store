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
 *   #band        absolute, height var(--band-h), overflow:hidden,
 *                translate3d(0, y, 0), pointer-events:none
 *     #bandInner height var(--vh), translate3d(0, -y, 0),
 *                isolation:isolate
 *       #tex     the material, translate3d(-drift, y, 0)
 *       .mrtx-lit the duplicate page copy, inert + aria-hidden
 *
 * Two stacked transforms and an overflow:hidden. Nothing repaints —
 * it's all compositor work. Do NOT reimplement this with a clip-path
 * animated per frame; that repaints and drops frames on mid-range
 * Android.
 *
 * The band is ABSOLUTE inside the hero section rather than fixed to
 * the viewport, unlike the coming-soon page. The store scrolls, and §5
 * bans the aperture "anywhere the user is trying to read, choose, or
 * pay" — a fixed band would follow the reader down into the drop
 * listing. Scoping it to the hero means it simply scrolls away.
 *
 * The two gotchas from §12, both load-bearing:
 *   - `isolation:isolate` on #bandInner. mix-blend-mode only blends
 *     with the backdrop inside its own isolated group. If the texture
 *     were a sibling of the mark, all ten finishes would silently do
 *     nothing — no error, no warning, just a flat mark.
 *   - `pointer-events:none` on #band. It tracks the cursor, so it is
 *     always directly under it. Without this it swallows every click.
 */
export function Hero() {
  useViewportHeight();
  const calm = useReducedMotion();
  const parts = useCountdown();

  const [mi, setMi] = useState(0);
  const material = MATERIALS[mi];

  const stageRef = useRef<HTMLElement | null>(null);
  const bandRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const texRef = useRef<HTMLDivElement | null>(null);

  // Shared with CursorRain so a glyph burns white the instant it
  // crosses into the slit. Refs, not state — these change every frame.
  const bandY = useRef(0);
  const bandH = useRef(0);

  const cut = useCallback((step = 1) => {
    setMi((i) => (i + step + MATERIALS.length) % MATERIALS.length);
    const band = bandRef.current;
    if (!band) return;
    // §7: the shutter jolt after a cut. Restarted by removing the class
    // and forcing a reflow before re-adding it.
    band.classList.remove("jolt");
    void band.offsetWidth;
    band.classList.add("jolt");
  }, []);

  /* ── motion ─────────────────────────────────────────────────────
     The band eases toward the pointer. Left alone, it drifts. All of
     it is written straight to style.transform inside one rAF loop —
     React never re-renders for motion. */
  useEffect(() => {
    const stage = stageRef.current;
    const band = bandRef.current;
    const inner = innerRef.current;
    const tex = texRef.current;
    if (!stage || !band || !inner || !tex) return;

    let y = 0;
    let ty = 0;
    let drift = 0;
    let drifting = true;
    let raf = 0;
    const t0 = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      // Ignore the pointer once the hero has scrolled away.
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      drifting = false;
      ty = e.clientY - r.top - band.offsetHeight / 2;
    };

    const frame = (now: number) => {
      const H = band.offsetHeight;
      const max = Math.max(0, stage.offsetHeight - H);
      bandH.current = H;

      if (!calm) {
        if (drifting) {
          ty = (max / 2) * (1 + Math.sin((now - t0) / 2600) * 0.72);
        }
        y += (ty - y) * 0.085;
        drift = ((now - t0) / 90) % 384;
      } else {
        // §7: reduced motion — no drift, no parallax. The band parks in
        // the middle. Cuts still work on click.
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
     the stop-motion feel. Cuts are CUTS — hard frame changes, never
     crossfades. Under reduced motion the timer never starts. */
  useEffect(() => {
    if (calm) return;
    const id = window.setInterval(() => cut(1), CUT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [calm, cut]);

  /* Click and keys cut too — but only while the hero is on screen, and
     never when the pointer is on the nav or a link. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && el !== document.body) return; // don't hijack a focused control
      if (e.key === "ArrowLeft") cut(-1);
      else if (e.key === "ArrowRight") cut(1);
    };
    const onDown = () => cut(1);

    window.addEventListener("keydown", onKey);
    stage.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointerdown", onDown);
    };
  }, [cut]);

  return (
    <section
      ref={stageRef}
      className="relative overflow-hidden"
      style={{ height: "var(--vh)" }}
      aria-label="MRTX CLUB"
    >
      {/* The page itself — ink on paper. */}
      <HeroPlane material={material} index={mi} parts={parts} variant="base" />

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
            style={{
              color: material.light
                ? "var(--color-white)"
                : "var(--color-ink)",
              // §6: each material meets the mark through its own blend
              // mode, so the mark isn't sitting ON the material — it's
              // made of it. KNOCKOUT (null) punches straight through.
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
    </section>
  );
}

export default Hero;
