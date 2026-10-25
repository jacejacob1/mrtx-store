"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Rises and fades in once, the first time it enters the viewport.
 * Apple's default reveal: 24px, sheet easing, never repeats on scroll
 * back up — repeating animations read as a gimmick by the third time.
 *
 * Always a div. Wrap the semantic element inside it rather than making
 * the tag polymorphic — a union of motion components as a JSX tag is
 * something TypeScript tends to refuse.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
