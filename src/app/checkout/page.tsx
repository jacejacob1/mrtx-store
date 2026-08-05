"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartTotals } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { GST } from "@/lib/config";

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  half?: boolean;
};

const FIELDS: Field[] = [
  { name: "name", label: "full name", autoComplete: "name" },
  {
    name: "email",
    label: "email",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
  },
  {
    name: "phone",
    label: "phone",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
  },
  { name: "line1", label: "address", autoComplete: "address-line1" },
  { name: "line2", label: "apartment, landmark", autoComplete: "address-line2" },
  { name: "city", label: "city", autoComplete: "address-level2", half: true },
  { name: "state", label: "state", autoComplete: "address-level1", half: true },
  {
    name: "pin",
    label: "pin code",
    autoComplete: "postal-code",
    inputMode: "numeric",
    half: true,
  },
];

/**
 * Checkout — CLAUDE.md §14.
 *
 * "Boring on purpose. Pure ink-on-paper, mono for every number, zero
 * motion beyond 250ms state changes. Nothing here should ever be
 * clever."
 *
 * PAYMENT IS NOT WIRED. There are no Razorpay keys yet, so the submit
 * button refuses loudly rather than pretending. §13: never promise
 * something the system doesn't do — a checkout that says "order
 * placed" and takes no money is the single worst thing this codebase
 * could ship.
 *
 * When keys exist, set NEXT_PUBLIC_RAZORPAY_KEY_ID and implement the
 * server route that creates the order. The client must never see the
 * key secret, and stock must decrement inside the same transaction
 * that records the payment — otherwise two people buy the last tee.
 */
export default function CheckoutPage() {
  const t = useCartTotals();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

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

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};

    // §13: errors are dry, not apologetic.
    if (!String(data.get("name") ?? "").trim()) next.name = "we need a name.";

    const email = String(data.get("email") ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = "that's not an email.";

    const phone = String(data.get("phone") ?? "").replace(/\D/g, "");
    if (phone.length !== 10) next.phone = "ten digits, no country code.";

    if (!String(data.get("line1") ?? "").trim())
      next.line1 = "we can't post to nowhere.";
    if (!String(data.get("city") ?? "").trim()) next.city = "which city.";
    if (!String(data.get("state") ?? "").trim()) next.state = "which state.";

    const pin = String(data.get("pin") ?? "").replace(/\D/g, "");
    if (pin.length !== 6) next.pin = "six digits.";

    setErrors(next);

    if (Object.keys(next).length > 0) {
      setNotice("check the fields marked above.");
      return;
    }

    if (!RAZORPAY_KEY) {
      setNotice(
        "payment isn't connected yet. no card was charged and no order was placed.",
      );
      return;
    }

    setNotice("opening payment…");
    // TODO: POST to /api/orders to create a Razorpay order server-side,
    // then open checkout with the returned order_id. Stock decrement
    // and payment capture must share one transaction.
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14">
      <h1
        className="text-ink"
        style={{ fontSize: "var(--text-page)", lineHeight: 1.05 }}
      >
        checkout
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={onSubmit} noValidate>
          <p className="label text-mute">DELIVERY / INDIA ONLY</p>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
            {FIELDS.map((f) => (
              <div
                key={f.name}
                className={f.half ? "col-span-1" : "col-span-2"}
              >
                <label
                  htmlFor={f.name}
                  className="label block text-mute"
                >
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  autoComplete={f.autoComplete}
                  inputMode={f.inputMode}
                  aria-invalid={errors[f.name] ? true : undefined}
                  aria-describedby={
                    errors[f.name] ? `${f.name}-err` : undefined
                  }
                  /* §11 / WCAG 1.4.11: a control boundary needs 3:1.
                     --line is 1.20:1 on paper — fine for a decorative
                     section rule, invisible as a field underline. */
                  className="mt-2 w-full border-b border-mute bg-transparent pb-2 text-[15px] text-ink outline-none transition-colors duration-250 focus:border-ink"
                />
                {/* §11: form errors are announced and never colour-only. */}
                {errors[f.name] && (
                  <p
                    id={`${f.name}-err`}
                    className="mono mt-2 text-readout text-ink"
                  >
                    {errors[f.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="buy mono mt-10 text-[15px] tracking-[.14em] text-ink uppercase"
          >
            pay {formatINR(t.total)}
          </button>

          <p
            role="status"
            aria-live="polite"
            className="mono mt-5 min-h-[1.4em] max-w-[46ch] text-readout text-ink"
          >
            {notice}
          </p>

          {!RAZORPAY_KEY && (
            <p className="mono mt-3 max-w-[46ch] text-readout text-mute">
              NOTE — razorpay is not connected. this form validates and
              stops. it cannot take money.
            </p>
          )}
        </form>

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
