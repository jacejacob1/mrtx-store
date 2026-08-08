"use client";

import Link from "next/link";
import { useCartTotals } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { GST } from "@/lib/config";
import { CheckoutForm } from "@/components/CheckoutForm";

/**
 * Checkout — CLAUDE.md §14: "Boring on purpose. Pure ink-on-paper, mono
 * for every number, zero motion beyond 250ms state changes."
 *
 * Whether payment is wired is read from a public flag rather than the
 * secret itself, so nothing sensitive reaches the client bundle. The
 * server route checks the real secrets again and refuses on its own —
 * this flag only decides what the page SAYS.
 */
export default function CheckoutPage() {
  const t = useCartTotals();
  const configured =
    process.env.NEXT_PUBLIC_PAYMENTS_LIVE === "1";

  if (t.count === 0) {
    return (
      <div className="mx-auto max-w-[1180px] px-5 py-24">
        <h1 className="text-ink" style={{ fontSize: "var(--text-section)" }}>
          nothing to check out.
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
        checkout
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <CheckoutForm configured={configured} />

        <aside>
          <p className="label text-mute">ORDER</p>

          <ul className="mt-5 space-y-3 border-t border-line pt-5">
            {t.lines.map((l) => (
              <li
                key={`${l.slug}-${l.size}`}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="text-[14px] text-ink">
                  {l.product.name}{" "}
                  <span className="mono text-mute">
                    {l.size} ×{l.qty}
                  </span>
                </span>
                <span className="mono text-readout text-ink">
                  {formatINR(l.total)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5">
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-mute">taxable value</dt>
              <dd className="mono text-readout text-mute">
                {formatINR(t.taxable)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-mute">
                GST ({t.rates.join(" + ")}%)
              </dt>
              <dd className="mono text-readout text-mute">
                {formatINR(t.tax)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[14px] text-ink">shipping</dt>
              <dd className="mono text-readout text-ink">
                {t.shipping === 0 ? "free" : formatINR(t.shipping)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <p className="text-[15px] text-ink">total</p>
            <p className="mono text-[19px] text-ink">{formatINR(t.total)}</p>
          </div>

          <p className="mono mt-6 text-readout text-mute">
            HSN {GST.HSN_TSHIRT} · prices include GST · guest checkout
          </p>
        </aside>
      </div>
    </div>
  );
}
