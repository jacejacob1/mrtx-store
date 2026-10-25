"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DotText } from "@/components/DotText";
import { Price } from "@/components/Price";
import { addToBag, openBag } from "@/lib/cart";
import { SIZES, OFFER_LABEL, FREE_SHIPPING_AT, inStock, type Product, type Size } from "@/lib/catalogue";
import { formatINR, TAX_NOTE } from "@/lib/money";

const LOW = 5;

/**
 * Name, price, size, add. The sizes are real radio inputs dressed as
 * chips, so arrow keys, screen readers and form semantics all work
 * without any custom keyboard code.
 */
export function BuyBox({ product }: { product: Product }) {
  const [size, setSize] = useState<Size | null>(null);
  const [note, setNote] = useState("");
  const sizesRef = useRef<HTMLFieldSetElement | null>(null);
  const available = inStock(product);

  function add() {
    if (!size) {
      setNote("Pick a size first.");
      sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    const r = addToBag(product, size);
    if (r === "gone") setNote(`Size ${size} just sold out.`);
    else if (r === "clamped") setNote(`That's every ${size} we have — it's all in your bag.`);
    else {
      setNote(`Added ${product.name}, size ${size}.`);
      openBag();
    }
  }

  const left = size ? product.stock[size] : 0;

  return (
    <div>
      <div className="flex items-center gap-3 text-fg-2">
        <DotText text={product.index} size={11} label={`Number ${product.index}`} />
        <span className="t-eyebrow">{product.garment.name} tee</span>
      </div>
      <h1 className="t-display mt-4">{product.name}</h1>
      <p className="t-title mt-2 text-fg-2">{product.tagline}</p>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <Price product={product} size="lg" />
        {product.mrp !== null && <span className="t-eyebrow text-accent">{OFFER_LABEL}</span>}
      </div>

      <fieldset ref={sizesRef} className="mt-10" disabled={!available}>
        <legend className="t-eyebrow text-fg-2">Size</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const out = product.stock[s] <= 0;
            return (
              <label key={s} className={out ? "cursor-not-allowed" : "cursor-pointer"}>
                <input
                  type="radio"
                  name={`size-${product.slug}`}
                  value={s}
                  disabled={out}
                  checked={size === s}
                  onChange={() => {
                    setSize(s);
                    setNote("");
                  }}
                  className="peer sr-only"
                />
                <span
                  className={`t-num flex h-12 min-w-14 items-center justify-center rounded-full border px-4 text-[15px] transition-colors duration-200 peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                    out ? "border-line text-fg-2 line-through" : "border-line hover:border-fg"
                  }`}
                >
                  {s}
                  {out && <span className="sr-only"> (sold out)</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="t-small mt-3 min-h-[1.5em] text-fg-2">
        {size && left > 0 && left <= LOW ? `Only ${left} left in ${size}.` : ""}
      </p>

      <button
        type="button"
        onClick={add}
        disabled={!available}
        className="t-body mt-4 flex h-14 w-full items-center justify-center rounded-full bg-fg font-semibold text-bg transition-transform duration-300 ease-sheet hover:scale-[1.015] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
      >
        {available ? "Add to bag" : "Sold out"}
      </button>
      <p role="status" aria-live="polite" className="t-small mt-3 min-h-[1.5em]">
        {note}
      </p>

      <ul className="t-small mt-6 space-y-1 text-fg-2">
        <li>
          Free shipping over {formatINR(FREE_SHIPPING_AT)}. Cash on delivery available. {TAX_NOTE}
        </li>
        <li>
          <Link href="/policies/returns" className="underline underline-offset-4 hover:text-fg">
            7-day returns
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default BuyBox;
