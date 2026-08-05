"use client";

import { useEffect, useState } from "react";
import {
  MATERIALS,
  CUT_INTERVAL_MS,
  texturePath,
  typeColorOn,
} from "@/lib/materials";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCountdown, CountdownView } from "@/components/Countdown";
import { Wordmark } from "@/components/Wordmark";
import { CursorRain } from "@/components/CursorRain";

/**
 * Home hero — full-bleed material, fixed, hard-cutting.
 *
 * ── DEVIATION FROM §5, ON PURPOSE ──────────────────────────────────
 * §5 makes the aperture the signature device: a narrow band tracking
 * the cursor with a duplicate page copy behind it. Jace asked for the
 * opposite here — the material filling the whole viewport, fixed, no
 * pointer tracking, cutting every 2.5s.
 *
 * What that gains: the match cut becomes the entire page rather than a
 * strip of it, which is closer to the launch film's actual grammar —
 * the film IS full-frame match cuts; the slit was the page's
 * interpretation of it.
 *
 * What it costs: the aperture is gone from home. It still runs on 404,
 * and the product pages still use the slit sweep (§14), so the device
 * is not lost from the system — just from this page.
 *
 * The duplicate page copy goes with it. There is no band to develop
 * the artwork through, so there is nothing to duplicate: the mark
 * blends directly against the full-bleed material. That removes the
 * whole `inert` / `aria-hidden` / duplicate-id problem §5 warns about.
 *
 * ── §6 IS STILL ENFORCED ───────────────────────────────────────────
 * "Never behind body copy, tables, forms, or anything with a price."
 * The material is fixed behind the whole document, but every section
 * below the hero paints solid paper over it. The material is visible
 * at the hero and nowhere a price is.
 */
export function Hero() {
  useViewportHeight();
  const calm = useReducedMotion();
  const parts = useCountdown();

  const [mi, setMi] = useState(0);
  const material = MATERIALS[mi];

  // §7: hard cuts on a timer. No drift, no easing, no crossfade — the
  // cut IS the motion. Under reduced motion the timer never starts and
  // the first material stays put.
  useEffect(() => {
    if (calm) return;
    const id = window.setInterval(
      () => setMi((i) => (i + 1) % MATERIALS.length),
      CUT_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [calm]);

  // §6 law 1: small type never blends. Solid, and the colour is chosen
  // per material by measured contrast — see typeColorOn.
  const type = typeColorOn(material.id);

  return (
    <>
      {/* Fixed, full-viewport, isolated. §12: the material must share
          an isolated group with the mark or mix-blend-mode silently
          does nothing. This wrapper IS that group. */}
      <div
        className="fixed inset-x-0 bottom-0 z-0 overflow-hidden"
        // Starts below the fixed nav. The nav stays solid paper on every
        // route: it is 57px of guaranteed-legible chrome, and making it
        // transparent would mean recolouring it every 2.5s to stay
        // readable against ten different materials. §16 — the quieter
        // option, and easy to revisit.
        style={{ isolation: "isolate", top: "57px" }}
      >
        <div
          key={material.id}
          className="matbg absolute inset-0"
          style={{ backgroundImage: `url(${texturePath(material.id)})` }}
          aria-hidden
        />

        <section
          className="relative grid h-full place-items-center px-6"
          style={{ color: type }}
          aria-label="MRTX CLUB"
        >
          <div className="flex w-full flex-col items-center gap-[clamp(18px,3.4vh,34px)]">
            <p className="label flex items-center gap-2.5">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: type }}
                aria-hidden
              />
              IDX 001 / SS26
            </p>

            {/* §9: a 4:1 mark, capped by height as well as width so it
                scales proportionally in landscape rather than
                letterboxing inside its own box.
                §6: the mark meets the material through that material's
                blend mode — it isn't sitting ON the material, it's made
                of it. */}
            <Wordmark
              className="mrtx-mark"
              style={{
                width: "min(72vw, 620px, 96vh)",
                color: material.light
                  ? "var(--color-white)"
                  : "var(--color-ink)",
                ["--finish" as string]: material.blend ?? "normal",
              }}
            />

            <p
              className="text-center"
              style={{ fontSize: "clamp(13px, 1.5vw, 17px)" }}
            >
              <i className="not-italic opacity-70">opening </i>
              <b className="tracking-[.18em] uppercase">the club</b>
              <i className="not-italic opacity-70"> soon</i>
            </p>

            <CountdownView parts={parts} />
          </div>

          <p
            className="label absolute"
            style={{
              right: "max(16px, env(safe-area-inset-right))",
              bottom: "max(16px, env(safe-area-inset-bottom))",
            }}
          >
            MAT.{String(mi + 1).padStart(2, "0")} {material.finish}{" "}
            {material.hex}
          </p>
        </section>

        <CursorRain materialId={material.id} />
      </div>

      {/* The hero is fixed, so the document needs its height back or
          there is nothing to scroll past. Minus the nav spacer the
          layout already contributes, so the drop begins exactly one
          viewport down. */}
      <div style={{ height: "calc(var(--vh) - 57px)" }} aria-hidden />
    </>
  );
}

export default Hero;
