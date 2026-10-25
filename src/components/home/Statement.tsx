"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

/**
 * Words that light up as you scroll past them — Apple's reading-pace
 * reveal. The line is real text throughout; only opacity changes, so
 * it is selectable, translatable and read in full by screen readers
 * regardless of scroll position.
 *
 * The line itself comes from the shoot: every MRTX tee keeps its loud
 * print on the back. The wearer never reads it. Everyone behind them
 * does.
 */
const LINE =
  "Every MRTX tee says the loud part on the back. You never read it. The person behind you reads it first.";

export function Statement() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.45"] });
  const words = LINE.split(" ");

  return (
    <section ref={ref} data-ground="dark" className="relative z-10">
      <div className="mx-auto max-w-[1100px] px-5 py-[22vh]">
        <p className="t-display">
          {words.map((w, i) =>
            reduce ? (
              <span key={i}>{w} </span>
            ) : (
              <Word key={i} progress={scrollYProgress} i={i} n={words.length}>
                {w}
              </Word>
            ),
          )}
        </p>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  i,
  n,
}: {
  children: string;
  progress: MotionValue<number>;
  i: number;
  n: number;
}) {
  // Each word gets a slightly overlapping slice of the timeline, so the
  // light moves through the sentence rather than snapping word to word.
  const start = i / n;
  const end = Math.min(1, start + 2.2 / n);
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  return (
    <motion.span style={{ opacity }}>
      {children}{" "}
    </motion.span>
  );
}

export default Statement;
