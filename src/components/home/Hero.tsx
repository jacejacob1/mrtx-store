"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Photo } from "@/components/Photo";
import { Wordmark } from "@/components/Wordmark";
import { DotText } from "@/components/DotText";

/**
 * The opening shot.
 *
 * A full-bleed photograph that, as you scroll, draws back into a
 * rounded card — Apple's product-page move — while the wordmark lifts
 * away. The container is taller than the screen and the stage inside
 * it is sticky, so the scroll distance becomes the animation's
 * timeline. Everything animated is transform or opacity: compositor
 * work, no layout, no repaint.
 *
 * IMG_9659 is the frame because its top half is dark canopy, so a white
 * wordmark has something to read against. The REMEMBER field shot has
 * a pale sky that would swallow it.
 */
export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const scale = useTransform(p, [0, 0.7], [1, 0.84]);
  const radius = useTransform(p, [0, 0.7], [0, 36]);
  const markOpacity = useTransform(p, [0, 0.32], [1, 0]);
  const markY = useTransform(p, [0, 0.32], [0, -70]);
  const metaOpacity = useTransform(p, [0, 0.18], [1, 0]);

  return (
    <section
      ref={ref}
      data-ground="dark"
      aria-label="MRTX CLUB"
      className="relative"
      style={{ height: reduce ? "100svh" : "190svh" }}
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 overflow-hidden will-change-transform"
          style={reduce ? undefined : { scale, borderRadius: radius }}
        >
          <Photo
            id="9659"
            alt="Two models in a pine forest wearing MRTX tees — one shows the small breathe print on the chest, the other the large BREATHE print on the back"
            sizes="100vw"
            fill
            eager
            className="object-cover"
            style={{ objectPosition: "50% 38%" }}
          />
          {/* Weighted to the top, where the mark sits — not a flat wash
              over the whole photograph. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgb(0 0 0 / .42) 0%, rgb(0 0 0 / .12) 38%, rgb(0 0 0 / 0) 60%, rgb(0 0 0 / .38) 100%)",
            }}
          />
        </motion.div>

        <motion.div
          className="relative z-10 flex w-full flex-col items-center px-6"
          style={reduce ? undefined : { opacity: markOpacity, y: markY }}
        >
          <h1 className="sr-only">MRTX CLUB</h1>
          <Wordmark decorative className="w-[min(78vw,760px)] text-white" />
          <p className="t-title mt-6 text-center text-white/90">Five pieces. Five sentences.</p>
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1240px] items-end justify-between px-5 pb-7 text-white"
          style={reduce ? undefined : { opacity: metaOpacity }}
        >
          <div className="flex items-center gap-2.5">
            <span className="live-dot" aria-hidden />
            <DotText text="SS26 / DROP 001" size={10} boot />
          </div>
          <Link
            href="/shop"
            className="t-small rounded-full bg-white px-5 py-2.5 font-semibold text-black transition-transform duration-300 hover:scale-[1.03]"
          >
            Shop the drop
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
