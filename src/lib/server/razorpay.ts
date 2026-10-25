import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/server/env";

/**
 * Razorpay, without the SDK: two REST calls and two signature checks.
 * https://razorpay.com/docs/api/orders/  ·  /docs/payments/server-integration/
 */

const API = "https://api.razorpay.com/v1";

function auth() {
  return "Basic " + Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
}

export type RazorpayOrder = { id: string; amount: number; currency: "INR"; receipt: string; status: string };

/** Create the Razorpay order the checkout window pays against. Amount in paise. */
export async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Razorpay order failed: ${body?.error?.description ?? res.status}`);
  return body as RazorpayOrder;
}

/** Full refund of a captured payment. Amount in paise; omit for full. */
export async function refundPayment(paymentId: string, amount?: number) {
  const res = await fetch(`${API}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(amount ? { amount } : {}),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Razorpay refund failed: ${body?.error?.description ?? res.status}`);
  return body as { id: string; amount: number; status: string };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** The signature the checkout handler returns: HMAC(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", env.razorpayKeySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhooks are signed over the raw body with the webhook secret (a different secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const expected = createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
