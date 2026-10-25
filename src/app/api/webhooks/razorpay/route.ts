import { NextResponse } from "next/server";
import { insert, rpc, select, type OrderRow } from "@/lib/server/db";
import { verifyWebhookSignature } from "@/lib/server/razorpay";

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay's server telling ours what happened — the source of truth,
 * because it arrives even if the customer's phone dies mid-payment.
 *
 * Set up in Razorpay → Settings → Webhooks:
 *   URL     https://mrtx.club/api/webhooks/razorpay
 *   Secret  the value of RAZORPAY_WEBHOOK_SECRET
 *   Events  payment.captured, order.paid, payment.failed, refund.processed
 *
 * Every event is stored once (Razorpay's event id is the primary key), so
 * Razorpay's automatic retries can't double-process anything.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const eventId = req.headers.get("x-razorpay-event-id") ?? "";
  if (!sig || !verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; status: string } };
      refund?: { entity: { id: string; payment_id: string } };
    };
  };
  const payment = event.payload.payment?.entity;
  const rzpOrder = payment?.order_id;

  let order: Pick<OrderRow, "id"> | undefined;
  if (rzpOrder) {
    [order] = await select<Pick<OrderRow, "id">[]>("orders", `razorpay_order_id=eq.${encodeURIComponent(rzpOrder)}&select=id`);
  }

  // Store first. A duplicate delivery inserts nothing and returns [].
  const stored = await insert<unknown[]>(
    "payment_events",
    { id: eventId || `${event.event}:${payment?.id ?? Date.now()}`, type: event.event, order_id: order?.id ?? null, payload: event },
    true,
  );
  if (Array.isArray(stored) && stored.length === 0) return NextResponse.json({ ok: true, duplicate: true });

  if (order && payment && (event.event === "payment.captured" || event.event === "order.paid")) {
    await rpc("mark_paid", { p_order: order.id, p_payment_id: payment.id });
  }
  // payment.failed needs no action: the customer can retry in the same
  // window, and an abandoned hold is released by release_expired().
  // refund.processed is recorded above; the admin panel reads it.

  return NextResponse.json({ ok: true });
}
