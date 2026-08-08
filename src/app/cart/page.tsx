"use client";

import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { useCartTotals, setQty, removeLine } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { variantFor } from "@/lib/products";

/**
 * Cart — CLAUDE.md §14.
 *
 * "Boring on purpose. Pure ink-on-paper, mono for every number, zero
 * motion beyond 250ms state changes. Nothing here should ever be
 * clever."
 *
 * So: no aperture, no materials behind anything with a price on it
 * (§6 forbids exactly that), no animation. The material thumbnails are
 * beside the numbers, never under them.
 */
export default function CartPage() {
  const t = useCartTotals();

  if (t.count === 0) {
    return (
      <div className="mx-auto max-w-[1180px] px-5 py-24">
        <h1 className="text-ink" style={{ fontSize: "var(--text-section)" }}>
          your cart is empty.
        </h1>
        <Link
          href="/shop"
          className="mono mt-6 inline-block border-b-2 border-blue pb-1 text-[15px] tracking-[.14em] text-ink uppercase"
        >
          see the drop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14">
      <h1
        className="text-ink"
        style={{ fontSize: "var(--text-page)", lineHeight: 1.05 }}
      >
        cart
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="border-t border-line">
          {t.lines.map((l) => {
            const stock = variantFor(l.product, l.size)?.stock ?? 0;
            return (
              <li
                key={`${l.slug}-${l.size}`}
                className="flex gap-5 border-b border-line py-6"
              >
                <Link
                  href={`/shop/${l.slug}`}
                  className="w-[84px] shrink-0"
                  tabIndex={-1}
                  aria-hidden
                >
                  <ProductArt product={l.product} sizes="84px" />
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <Link
                        href={`/shop/${l.slug}`}
                        className="text-[15px] text-ink"
                      >
                        {l.product.name}
                      </Link>
                      <p className="mono mt-1 text-readout text-mute">
                        {l.size} · {formatINR(l.unit)}
                      </p>
                    </div>
                    <p className="mono text-[15px] text-ink">
                      {formatINR(l.total)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        className="mono px-3 py-1.5 text-readout text-ink"
                        onClick={() => setQty(l.slug, l.size, l.qty - 1)}
                        aria-label={`Decrease quantity of ${l.product.name}, size ${l.size}`}
                      >
                        −
                      </button>
                      <span
                        className="mono min-w-[2.2rem] text-center text-readout text-ink"
                        aria-live="polite"
                      >
                        {String(l.qty).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        className="mono px-3 py-1.5 text-readout text-ink disabled:opacity-30"
                        disabled={l.qty >= stock}
                        onClick={() => setQty(l.slug, l.size, l.qty + 1)}
                        aria-label={`Increase quantity of ${l.product.name}, size ${l.size}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="text-[13px] text-mute underline"
                      onClick={() => removeLine(l.slug, l.size)}
                    >
                      remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:pt-1">
          <p className="label text-mute">SUMMARY</p>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5">
            <Row label="subtotal" value={formatINR(t.subtotal)} />
            <Row
              label={`taxable value`}
              value={formatINR(t.taxable)}
              muted
            />
            <Row
              label={`GST (${t.rates.join(" + ")}%)`}
              value={formatINR(t.tax)}
              muted
            />
            <Row
              label="shipping"
              value={t.shipping === 0 ? "free" : formatINR(t.shipping)}
            />
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <p className="text-[15px] text-ink">total</p>
            <p className="mono text-[19px] text-ink">{formatINR(t.total)}</p>
          </div>

          {t.toFreeShipping > 0 && (
            <p className="mono mt-4 text-readout text-mute">
              {formatINR(t.toFreeShipping)} more for free shipping.
            </p>
          )}

          <Link
            href="/checkout"
            className="mono mt-9 inline-block border-b-2 border-blue pb-1 text-[15px] tracking-[.14em] text-ink uppercase"
          >
            checkout
          </Link>

          <p className="mono mt-6 text-readout text-mute">
            prices include GST. india only.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`text-[14px] ${muted ? "text-mute" : "text-ink"}`}>
        {label}
      </dt>
      <dd className={`mono text-readout ${muted ? "text-mute" : "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}
