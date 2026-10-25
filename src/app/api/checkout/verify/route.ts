import { NextResponse } from "next/server";
import { rpc, select, type OrderRow } from "@/lib/server/db";
import { verifyPaymentSignature } from "@/lib/server/razorpay";

/**
 * POST /api/checkout/verify
 *   { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Called by the checkout window's success handler. Checks Razorpay's
 * signature, then marks the order paid. The webhook does the same thing
 * independently — whichever arrives first wins, and mark_paid ignores
 * the second. That way a customer who closes the tab mid-payment still
 * gets their order.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const { orderId, razorpay_order_id: rzpOrder, razorpay_payment_id: payment, razorpay_signature: sig } = b ?? {};
  if (![orderId, rzpOrder, payment, sig].every((v) => typeof v === "string" && v.length < 200)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!verifyPaymentSignature(rzpOrder, payment, sig)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // The Razorpay order must belong to this order — no paying for one and claiming another.
  const [row] = await select<OrderRow[]>("orders", `id=eq.${encodeURIComponent(orderId)}&select=id,razorpay_order_id`);
  if (!row || row.razorpay_order_id !== rzpOrder) {
    return NextResponse.json({ error: "mismatch" }, { status: 400 });
  }

  const order = await rpc<OrderRow>("mark_paid", { p_order: orderId, p_payment_id: payment });
  return NextResponse.json({ orderId: order.id, number: order.number, status: order.status });
}
