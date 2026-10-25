"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Photo } from "@/components/Photo";
import { Price } from "@/components/Price";
import { DotText } from "@/components/DotText";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/catalogue";

/**
 * One design, one chapter. The section takes the ground of the garment
 * itself — REMEMBER is black, SOLITUDE is red, the white tees are white —
 * so scrolling the home page is scrolling through the four tees.
 *
 * The photograph drifts slower than the page (parallax), which is what
 * makes a section feel deep rather than flat. It's a transform on an
 * oversized inner layer, so it costs nothing to scroll.
 */
export function Chapter({ product, flip }: { product: Product; flip: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <section
      ref={ref}
      data-ground={product.ground}
      className="relative z-10 overflow-hidden"
      aria-labelledby={`ch-${product.slug}`}
    >
      <div
        className={`mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-24 md:min-h-[100svh] md:grid-cols-2 md:gap-16 md:py-28 ${
          flip ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[32px]">
          <motion.div className="absolute -inset-y-[8%] inset-x-0" style={reduce ? undefined : { y }}>
            <Photo
              id={product.chapter}
              alt={`${product.name} in the MRTX SS26 shoot`}
              sizes="(min-width: 768px) 50vw, 100vw"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>

        <div>
          <Reveal>
            <div className="flex items-center gap-3 text-fg-2">
              <DotText text={product.index} size={11} label="" />
              <span className="t-eyebrow">
                {product.name} · {product.garment.name}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id={`ch-${product.slug}`} className="t-display mt-6 max-w-[11ch]">
              {product.tagline}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="t-body mt-6 max-w-[42ch] text-fg-2">{product.body}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href={`/shop/${product.slug}`}
                className="t-body rounded-full bg-fg px-6 py-3 font-semibold text-bg transition-transform duration-300 ease-sheet hover:scale-[1.03]"
              >
                Shop {product.name.toLowerCase()}
              </Link>
              <Price product={product} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default Chapter;
