"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { TeeTurner } from "@/components/signature/TeeTurner";
import { DotText } from "@/components/DotText";
import { useCatalogue } from "@/components/CatalogueProvider";

/**
 * TURN AROUND — the brand sentence, made physical.
 *
 * "Every MRTX tee says the loud part on the back. You never read it.
 *  The person behind you reads it first."
 *
 * The section pins while you scroll through it, and the tee turns a half
 * revolution: quiet front ("for you") to loud back ("for them"). A
 * dot-matrix readout counts the degrees. Tap a number to change tee.
 *
 * Reduced motion: no scroll-driven turn — a button flips it instead.
 */
export function TurnAround() {
  const products = useCatalogue().filter((p) => p.art.front || p.art.back);
  const [i, setI] = useState(0);
  const p = products[i] ?? products[0];
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scrolled = useTransform(scrollYProgress, [0.12, 0.82], [0, 180], { clamp: true });
  const smooth = useSpring(scrolled, { stiffness: 140, damping: 26, mass: 0.6 });
  const manual = useMotionValue(0);
  const rotate = reduce ? manual : smooth;

  const [deg, setDeg] = useState(0);
  useMotionValueEvent(rotate, "change", (v) => {
    const d = Math.round(Math.max(0, Math.min(180, v)));
    setDeg((prev) => (prev === d ? prev : d));
  });
  const back = deg > 90;

  if (!p) return null;

  return (
    <section
      ref={ref}
      data-ground="dark"
      aria-labelledby="turn-title"
      className={`relative ${reduce ? "" : "h-[280svh]"}`}
    >
      <div className={`${reduce ? "" : "sticky top-0"} flex min-h-[100svh] items-center overflow-hidden`}>
        <div className="mx-auto grid w-full max-w-[1240px] items-center gap-8 px-5 py-20 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 text-fg-2">
              <DotText text="TURN AROUND" size={10} label="" />
            </div>
            <h2 id="turn-title" className="t-display mt-6 min-h-[2.2em]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={back ? "back" : "front"}
                  className="block"
                  initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                >
                  {back ? "The back is for them." : "The front is for you."}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="t-body mt-6 max-w-[38ch] text-fg-2">
              {back
                ? "Everyone walking behind you reads the whole sentence."
                : "A small mark on the chest — the part only you know is there."}
            </p>

            <div className="mt-10 flex items-center gap-2" role="group" aria-label="Choose a tee">
              {products.map((x, n) => (
                <button
                  key={x.slug}
                  type="button"
                  onClick={() => setI(n)}
                  aria-pressed={n === i}
                  aria-label={x.name}
                  className={`rounded-full px-3 py-2 transition-colors ${
                    n === i ? "bg-fg text-bg" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  <DotText text={x.index} size={9} label="" />
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-6">
              <Link href={`/shop/${p.slug}`} className="t-body rounded-full bg-fg px-6 py-3 font-semibold text-bg">
                Shop {p.name.toLowerCase()}
              </Link>
              {reduce && (
                <button
                  type="button"
                  onClick={() => manual.set(back ? 0 : 180)}
                  className="t-body text-fg-2 underline underline-offset-4 hover:text-fg"
                >
                  Turn it around
                </button>
              )}
            </div>
          </div>

          <div className="relative md:col-span-7">
            <div className="mx-auto w-[min(86vw,560px)]">
              <TeeTurner key={p.slug} product={p} rotate={rotate} uid="turn" />
            </div>
            <div className="absolute top-0 right-0 flex flex-col items-end gap-2 text-fg-2" aria-hidden>
              <DotText text={`${String(deg).padStart(3, "0")}`} size={18} label="" />
              <span className="t-eyebrow">{back ? "back" : "front"}</span>
            </div>
            <p className="t-eyebrow mt-6 text-center text-fg-2">
              {p.index} · {p.name}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TurnAround;
