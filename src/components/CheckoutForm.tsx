"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartTotals, clearCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

type RzpResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RzpOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (r: RzpResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (o: RzpOptions) => { open: () => void };
  }
}

const FIELDS = [
  { name: "name", label: "full name", autoComplete: "name" },
  { name: "email", label: "email", type: "email", autoComplete: "email", inputMode: "email" as const },
  { name: "phone", label: "phone", type: "tel", autoComplete: "tel", inputMode: "tel" as const },
  { name: "line1", label: "address", autoComplete: "address-line1" },
  { name: "line2", label: "apartment, landmark", autoComplete: "address-line2" },
  { name: "city", label: "city", autoComplete: "address-level2", half: true },
  { name: "state", label: "state", autoComplete: "address-level1", half: true },
  { name: "pin", label: "pin code", autoComplete: "postal-code", inputMode: "numeric" as const, half: true },
];

/** Loads Razorpay's script once, on demand. §10: nothing at first paint. */
function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Checkout — CLAUDE.md §14: "Boring on purpose. Nothing here should
 * ever be clever."
 *
 * The flow, and why it is in this order:
 *   1. POST the cart as slugs and quantities. The server recomputes
 *      every rupee from the catalogue — the browser never sends a price.
 *   2. Open Razorpay with the order the server made.
 *   3. On success, verify the signature server-side and redirect.
 *
 * The order is marked paid by the WEBHOOK, not here. If the customer
 * closes the tab mid-payment they still get their tee.
 */
export function CheckoutForm({ configured }: { configured: boolean }) {
  const t = useCartTotals();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();

    // §13: errors are dry, not apologetic.
    const next: Record<string, string> = {};
    if (!get("name")) next.name = "we need a name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get("email")))
      next.email = "that's not an email.";
    if (get("phone").replace(/\D/g, "").length !== 10)
      next.phone = "ten digits, no country code.";
    if (!get("line1")) next.line1 = "we can't post to nowhere.";
    if (!get("city")) next.city = "which city.";
    if (!get("state")) next.state = "which state.";
    if (get("pin").replace(/\D/g, "").length !== 6) next.pin = "six digits.";

    setErrors(next);
    if (Object.keys(next).length) {
      setNotice("check the fields marked above.");
      return;
    }

    if (!configured) {
      setNotice("payment isn't connected yet. nothing was charged.");
      return;
    }

    setBusy(true);
    setNotice("starting payment…");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: t.lines.map((l) => ({
            slug: l.slug,
            size: l.size,
            qty: l.qty,
          })),
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          line1: get("line1"),
          line2: get("line2"),
          city: get("city"),
          state: get("state"),
          pin: get("pin"),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "could not start payment. nothing was charged.");
        setBusy(false);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setNotice("couldn't reach the payment window. nothing was charged.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amountPaise,
        currency: "INR",
        name: "MRTX CLUB",
        description: `order ${data.orderNo}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone,
        },
        // §2: the one blue thing on this screen.
        theme: { color: "#2563EB" },
        handler: async (r) => {
          setNotice("confirming…");
          const v = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          });
          if (v.ok) {
            clearCart();
            router.push(`/order/${data.orderId}`);
          } else {
            // Money may well have been taken — the webhook is the
            // authority. Never tell them it failed.
            setNotice(
              "we couldn't confirm that from here. if you were charged, the order stands — email hello@mrtx.club with your phone number.",
            );
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setNotice("payment cancelled. nothing was charged.");
            setBusy(false);
          },
        },
      });

      rzp.open();
    } catch {
      setNotice("something went wrong. nothing was charged.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="label text-mute">DELIVERY / INDIA ONLY</p>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.half ? "col-span-1" : "col-span-2"}>
            <label htmlFor={f.name} className="label block text-mute">
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              inputMode={f.inputMode}
              aria-invalid={errors[f.name] ? true : undefined}
              aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
              className="mt-2 w-full border-b border-mute bg-transparent pb-2 text-[15px] text-ink outline-none transition-colors duration-250 focus:border-ink"
            />
            {/* §11: errors announced, never colour-only. */}
            {errors[f.name] && (
              <p id={`${f.name}-err`} className="mono mt-2 text-readout text-ink">
                {errors[f.name]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="buy mono mt-10 text-[15px] tracking-[.14em] text-ink uppercase"
      >
        {busy ? "working…" : `pay ${formatINR(t.total)}`}
      </button>

      <p
        role="status"
        aria-live="polite"
        className="mono mt-5 min-h-[1.4em] max-w-[46ch] text-readout text-ink"
      >
        {notice}
      </p>

      {!configured && (
        <p className="mono mt-3 max-w-[46ch] text-readout text-mute">
          NOTE — razorpay is not connected. this form validates and stops.
          it cannot take money.
        </p>
      )}
    </form>
  );
}

export default CheckoutForm;
