"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Photo } from "@/components/Photo";
import { useBag, useBagTotals, type Line } from "@/lib/cart";
import { formatINR, GST, GST_REGISTERED } from "@/lib/money";
import { COD_FEE } from "@/lib/catalogue";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const field =
  "t-body mt-2 h-12 w-full rounded-xl border border-line bg-bg px-4 text-fg outline-none transition-colors placeholder:text-fg-2 focus:border-fg";

type Result = { ok: true; orderId: string } | { ok: false; message: string };

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, f: () => void) => void };

/** Load Razorpay's checkout script once, on demand — not on every page. */
function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("no Razorpay")));
    s.onerror = () => reject(new Error("script failed"));
    document.body.appendChild(s);
  });
}

/**
 * Place the order on the server, then — for prepaid — open Razorpay's
 * window and confirm the payment. The browser sends the bag and the
 * address; the server decides the price.
 */
async function placeOrder(form: FormData, method: "online" | "cod", lines: Line[]): Promise<Result> {
  const customer = Object.fromEntries(
    ["email", "phone", "name", "address1", "address2", "city", "state", "pincode"].map((k) => [k, form.get(k) ?? ""]),
  );
  let res: Response;
  try {
    res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, method, items: lines.map(({ slug, size, qty }) => ({ slug, size, qty })) }),
    });
  } catch {
    return { ok: false, message: "No connection. Check your network and try again." };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: data.message ?? "We couldn't place that order." };
  if (method === "cod") return { ok: true, orderId: data.orderId };

  let Razorpay: RazorpayCtor;
  try {
    Razorpay = await loadRazorpay();
  } catch {
    return { ok: false, message: "The payment window didn't load. Try again, or choose cash on delivery." };
  }

  return new Promise<Result>((resolve) => {
    const rzp = new Razorpay({
      key: data.razorpay.key,
      order_id: data.razorpay.orderId,
      amount: data.razorpay.amount,
      currency: "INR",
      name: "MRTX CLUB",
      description: data.number,
      prefill: data.prefill,
      theme: { color: "#000000" },
      handler: async (r: RazorpayResponse) => {
        await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderId, ...r }),
        }).catch(() => {});
        // Even if verify failed to reach us, the webhook will confirm it —
        // the order page shows "waiting for payment" until it does.
        resolve({ ok: true, orderId: data.orderId });
      },
      modal: {
        ondismiss: () =>
          resolve({ ok: false, message: "Payment cancelled. Your items are held for 15 minutes — try again any time." }),
      },
    });
    rzp.open();
  });
}

/**
 * Details on the left, the order on the right. Prepaid orders go through
 * Razorpay's window; COD orders are placed directly and confirmed by phone.
 */
export function CheckoutView() {
  const t = useBagTotals();
  const lines = useBag();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<"online" | "cod">("online");
  const codFee = method === "cod" ? COD_FEE : 0;
  const total = t.total + codFee;

  if (t.count === 0) {
    return (
      <div className="py-20">
        <h1 className="t-display">Your bag is empty.</h1>
        <Link href="/shop" className="t-body mt-6 inline-block text-accent underline underline-offset-4">
          See the drop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-14 md:grid-cols-12 md:gap-12">
      <form
        className="md:col-span-7"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setNote("");
          const result = await placeOrder(new FormData(e.currentTarget), method, lines);
          if (result.ok) {
            router.push(`/order/${result.orderId}`);
          } else {
            setNote(result.message);
            setBusy(false);
          }
        }}
      >
        <h1 className="t-display">Check out.</h1>

        <fieldset className="mt-12">
          <legend className="t-title">Contact</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="t-small text-fg-2 sm:col-span-2">
              Email
              <input className={field} type="email" name="email" autoComplete="email" required />
            </label>
            <label className="t-small text-fg-2 sm:col-span-2">
              Phone
              <input
                className={field}
                type="tel"
                name="phone"
                autoComplete="tel-national"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                title="10-digit Indian mobile number"
                required
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-12">
          <legend className="t-title">Delivery</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="t-small text-fg-2 sm:col-span-2">
              Full name
              <input className={field} name="name" autoComplete="name" required />
            </label>
            <label className="t-small text-fg-2 sm:col-span-2">
              Address
              <input className={field} name="address1" autoComplete="address-line1" required />
            </label>
            <label className="t-small text-fg-2 sm:col-span-2">
              Apartment, landmark (optional)
              <input className={field} name="address2" autoComplete="address-line2" />
            </label>
            <label className="t-small text-fg-2">
              PIN code
              <input
                className={field}
                name="pincode"
                autoComplete="postal-code"
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                title="6-digit PIN code"
                required
              />
            </label>
            <label className="t-small text-fg-2">
              City
              <input className={field} name="city" autoComplete="address-level2" required />
            </label>
            <label className="t-small text-fg-2 sm:col-span-2">
              State
              <select className={field} name="state" autoComplete="address-level1" required defaultValue="">
                <option value="" disabled>
                  Choose a state
                </option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-12">
          <legend className="t-title">Payment</legend>
          <div className="mt-4 grid gap-3">
            {(
              [
                ["online", "Pay now", "UPI, cards, netbanking — via Razorpay."],
                [
                  "cod",
                  "Cash on delivery",
                  COD_FEE > 0 ? `Pay the courier. ${formatINR(COD_FEE)} COD fee.` : "Pay the courier when it arrives.",
                ],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors ${
                  method === value ? "border-fg" : "border-line hover:border-fg-2"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                  className="mt-1 accent-[var(--fg)]"
                />
                <span>
                  <span className="t-body block font-semibold">{label}</span>
                  <span className="t-small text-fg-2">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="t-body mt-8 flex h-14 w-full items-center justify-center rounded-full bg-fg font-semibold text-bg transition-transform duration-300 ease-sheet hover:scale-[1.015] disabled:opacity-60 disabled:hover:scale-100"
        >
          {busy ? "One moment…" : method === "cod" ? `Place order · ${formatINR(total)}` : `Pay ${formatINR(total)}`}
        </button>
        <p role="status" aria-live="polite" className="t-small mt-3 min-h-[1.5em] text-fg-2">
          {note}
        </p>
      </form>

      <aside className="md:col-span-5">
        <div className="rounded-[28px] bg-surface p-6 md:sticky md:top-28 md:p-8">
          <h2 className="t-title">Your order</h2>
          <ul className="mt-6 space-y-5">
            {t.rows.map((r) => (
              <li key={`${r.slug}-${r.size}`} className="flex gap-4">
                <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl">
                  <Photo media={r.product.photos[0]} alt="" sizes="64px" fill className="object-cover" />
                </div>
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <div>
                    <p className="t-body font-semibold">{r.product.name}</p>
                    <p className="t-small text-fg-2">
                      {r.size} · Qty {r.qty}
                    </p>
                  </div>
                  <p className="t-num t-small">{formatINR(r.total)}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="t-small mt-8 space-y-2 border-t border-line pt-6">
            <div className="flex justify-between">
              <dt className="text-fg-2">Subtotal</dt>
              <dd className="t-num">{formatINR(t.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-2">Shipping</dt>
              <dd className="t-num">{t.shipping === 0 ? "Free" : formatINR(t.shipping)}</dd>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-fg-2">Cash on delivery</dt>
                <dd className="t-num">{formatINR(codFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-4">
              <dt className="t-body font-semibold">Total</dt>
              <dd className="t-num t-title">{formatINR(total)}</dd>
            </div>
            {GST_REGISTERED && (
              <p className="pt-1 text-fg-2">
                Includes {formatINR(t.tax)} GST ({GST.LOW}%, HSN {GST.HSN}).
              </p>
            )}
          </dl>
        </div>
      </aside>
    </div>
  );
}

export default CheckoutView;
