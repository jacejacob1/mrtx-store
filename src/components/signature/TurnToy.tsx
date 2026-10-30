"use client";

import { useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { TeeTurner } from "@/components/signature/TeeTurner";
import type { Product } from "@/lib/catalogue";

/**
 * The product page's print viewer: grab the tee and turn it. Drag
 * sideways to rotate; let go and it settles on whichever side is
 * facing you, with a little spring. Front / Back buttons do the same
 * for keyboards, screen readers and anyone who'd rather tap.
 */
export function TurnToy({ product }: { product: Product }) {
  const rotate = useMotionValue(0);
  const reduce = useReducedMotion();
  const [side, setSide] = useState<"front" | "back">("front");
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);

  useMotionValueEvent(rotate, "change", (v) => {
    const n = ((Math.round(v) % 360) + 360) % 360;
    const s = n > 90 && n < 270 ? "back" : "front";
    setSide((prev) => (prev === s ? prev : s));
  });

  const settle = (target: number) =>
    reduce ? rotate.set(target) : animate(rotate, target, { type: "spring", stiffness: 160, damping: 22 });

  const show = (s: "front" | "back") => {
    const v = rotate.get();
    // nearest angle that shows that side, so it turns the short way round
    const base = Math.round(v / 360) * 360;
    const options = s === "front" ? [base - 360, base, base + 360] : [base - 180, base + 180];
    settle(options.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)));
  };

  return (
    <div className="select-none">
      <div
        className="mx-auto w-[min(88vw,520px)] cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, start: rotate.get(), moved: false };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 3) d.moved = true;
          rotate.set(d.start + dx * 0.6);
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          // a tap (no drag) turns it around; a drag settles to the nearer side
          settle(d.moved ? Math.round(rotate.get() / 180) * 180 : rotate.get() + 180 - (((rotate.get() % 180) + 180) % 180));
        }}
        onPointerCancel={() => {
          drag.current = null;
          settle(Math.round(rotate.get() / 180) * 180);
        }}
      >
        <TeeTurner product={product} rotate={rotate} uid="toy" />
      </div>

      <div className="mt-6 flex items-center justify-center gap-2" role="group" aria-label="Show side">
        {(["front", "back"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => show(s)}
            disabled={!product.art[s]}
            className={`t-small rounded-full px-5 py-2 capitalize transition-colors disabled:opacity-30 ${
              side === s ? "bg-fg text-bg" : "border border-line text-fg-2 hover:text-fg"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="t-small mt-3 text-center text-fg-2">Drag to turn it around.</p>
    </div>
  );
}

export default TurnToy;
