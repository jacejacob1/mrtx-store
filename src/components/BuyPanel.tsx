"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { SIZES, type Product, type Size } from "@/lib/products";

/**
 * Size selection and add-to-cart — CLAUDE.md §14.
 *
 * "Size selector as mono chips, out-of-stock struck through not
 * hidden. One blue element on the page: the add-to-cart underline."
 *
 * §11: the result is announced (role="status", aria-live="polite") and
 * is never colour-only — every state says what happened in words.
 * §13: errors are dry, not apologetic.
 */
export function BuyPanel({
  product,
  stock,
}: {
  product: Product;
  /** Live counts from the database. Falls back to the catalogue. */
  stock?: Record<Size, number>;
}) {
  const [size, setSize] = useState<Size | null>(null);
  const [said, setSaid] = useState<string>("");

  const stockFor = (s: Size) =>
    stock?.[s] ?? product.variants.find((v) => v.size === s)?.stock ?? 0;

  const anyStock = SIZES.some((s) => stockFor(s) > 0);
  const chosenStock = size ? stockFor(size) : 0;

  const onAdd = () => {
    if (!size) {
      setSaid("pick a size first.");
      return;
    }
    const result = addToCart(product, size, 1);
    if (result === "unavailable") setSaid(`${size} is gone.`);
    else if (result === "clamped")
      setSaid(`that's all of ${size} we have. ${chosenStock} in your cart.`);
    else setSaid(`added. ${product.name} / ${size}.`);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="label text-mute">SIZE</p>
        {size && chosenStock > 0 && chosenStock <= 5 && (
          <p className="mono text-readout text-mute">
            {chosenStock} left
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SIZES.map((s) => {
          const stock = stockFor(s);
          return (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={size === s}
              disabled={stock === 0}
              onClick={() => {
                setSize(s);
                setSaid("");
              }}
            >
              {s}
              {stock === 0 && <span className="sr-only"> — sold out</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="buy mono mt-9 text-left text-[15px] tracking-[.14em] text-ink uppercase"
        onClick={onAdd}
        disabled={!anyStock}
      >
        {anyStock ? "add to cart" : "sold out"}
      </button>

      {/* §11: announced, and never colour-only. */}
      <p
        role="status"
        aria-live="polite"
        className="mono mt-4 min-h-[1.4em] text-readout text-mute"
      >
        {said}
      </p>
    </div>
  );
}

export default BuyPanel;
