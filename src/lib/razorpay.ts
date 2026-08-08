import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const API = "https://api.razorpay.com/v1";

function auth(): string {
  const raw = `${env.razorpayKeyId()}:${env.razorpayKeySecret()}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

/**
 * Creates a Razorpay order.
 *
 * `amount` is in PAISE, which is what Razorpay wants and what we store,
 * so there is no unit conversion anywhere in this codebase and no
 * opportunity to be out by a factor of 100.
 *
 * `receipt` is our own order id. Razorpay does not enforce uniqueness on
 * it, but it is what makes reconciliation possible when something goes
 * wrong at 2am.
 */
export async function createRazorpayOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: "INR",
      receipt: opts.receipt,
      // Capture automatically. Manual capture means money is authorised
      // but not taken, and an un-captured payment auto-refunds after a
      // few days — a silent way to lose a sale.
      payment_capture: 1,
      notes: opts.notes ?? {},
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order create failed (${res.status}): ${body}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Constant-time compare — a plain `===` on a signature leaks timing. */
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/**
 * Verifies the signature Razorpay Checkout hands back to the browser.
 *
 * HMAC-SHA256 of `order_id|payment_id` keyed with the API secret. Without
 * this check anyone can POST a made-up payment id and get a confirmation
 * page — the browser is not a trustworthy narrator of whether it paid.
 */
export function verifyCheckoutSignature(p: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const expected = createHmac("sha256", env.razorpayKeySecret())
    .update(`${p.razorpay_order_id}|${p.razorpay_payment_id}`)
    .digest("hex");
  return safeEqual(expected, p.razorpay_signature);
}

/**
 * Verifies a webhook. Different secret from the API secret, and the
 * payload is the RAW request body — parsing and re-stringifying JSON
 * changes the bytes and the signature will never match.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", env.razorpayWebhookSecret())
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** Used to reconcile when a webhook arrives for an order we can't match. */
export async function fetchPayment(id: string): Promise<{
  id: string;
  order_id: string;
  status: string;
  amount: number;
}> {
  const res = await fetch(`${API}/payments/${id}`, {
    headers: { Authorization: auth() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay payment fetch failed: ${res.status}`);
  return await res.json();
}
