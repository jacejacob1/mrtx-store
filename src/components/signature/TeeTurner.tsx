"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { TeeFace } from "@/components/signature/TeeFace";
import type { Product } from "@/lib/catalogue";

/**
 * A tee on a turntable. `rotate` is degrees around the vertical axis:
 * 0 shows the front, 180 the back. Both faces are real 3D planes with
 * hidden backfaces, so the browser does the turning — no canvas, no
 * WebGL, cheap enough for any phone.
 *
 * As it turns edge-on the cloth darkens and the floor shadow narrows,
 * which is what sells it as an object rather than a card flipping.
 */
export function TeeTurner({
  product,
  rotate,
  uid,
  className = "",
}: {
  product: Product;
  rotate: MotionValue<number>;
  uid: string;
  className?: string;
}) {
  const edge = useTransform(rotate, (r) => Math.abs(Math.sin((r * Math.PI) / 180)));
  const shade = useTransform(edge, (e) => e * 0.45);
  const shadowX = useTransform(edge, (e) => 1 - e * 0.55);

  return (
    <div className={`relative ${className}`} style={{ perspective: "1800px" }}>
      <motion.div
        className="relative aspect-[1000/1100] w-full"
        style={{ rotateY: rotate, transformStyle: "preserve-3d" }}
      >
        {(["front", "back"] as const).map((side) => (
          <div
            key={side}
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: side === "back" ? "rotateY(180deg)" : undefined,
            }}
          >
            <TeeFace
              side={side}
              hex={product.garment.hex}
              art={product.art[side]}
              uid={`${uid}-${product.slug}`}
              label={`${product.name}, ${side}`}
              className="h-full w-full"
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: shade,
                background: "black",
                // the tee's outline, as a percentage polygon of the 1000×1100 drawing
                clipPath:
                  "polygon(37% 8.4%, 63% 8.4%, 80% 12.7%, 96.8% 36.2%, 84.6% 42.7%, 79% 38.5%, 79.6% 96.5%, 20.4% 96.5%, 21% 38.5%, 15.4% 42.7%, 3.2% 36.2%, 20% 12.7%)",
              }}
            />
          </div>
        ))}
      </motion.div>
      <motion.div
        aria-hidden
        className="mx-auto -mt-[2%] h-[4%] w-[62%] rounded-[50%] bg-black/35 blur-xl"
        style={{ scaleX: shadowX }}
      />
    </div>
  );
}

export default TeeTurner;
