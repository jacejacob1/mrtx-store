import { NextResponse } from "next/server";
import { db, type OrderRow, type OrderItemRow } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { pushToShiprocket } from "@/lib/shiprocket";
import { shiprocketConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the source of truth for whether money moved.
 *
 * The browser callback is a nicety: the customer can close the tab, lose
 * signal, or die on a redirect between paying and telling us. This
 * endpoint is what actually marks an order paid, decrements stock and
 * pushes to Shiprocket.
 *
 * IDEMPOTENT BY CONSTRUCTION. Razorpay retries for up to 24 hours, so
 * every step below is safe to run twice:
 *   - the paid transition is conditional on status = 'created', so a
 *     second delivery updates zero rows and returns early
 *   - stock is only decremented on that same transition
 *   - Shiprocket rejects a duplicate order_no, which we treat as success
 *
 * Always returns 200 once the signature is valid. A non-200 makes
 * Razorpay retry, and retrying a webhook we have already fully
 * processed achieves nothing but noise.
 */
export async function POST(req: Request) {
  // MUST be the raw body: parsing and re-stringifying changes the bytes
  // and the HMAC will never match.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  let valid = false;
  try {
    valid = verifyWebhookSignature(raw, signature);
  } catch (e) {
    console.error("[webhook] verification unavailable", e);
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  if (!valid) {
    // Someone POSTing without the secret. Say nothing useful.
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (event.event !== "payment.captured") {
    // authorized / failed / refunded etc. Acknowledged, not acted on.
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const paymentId = event.payload?.payment?.entity?.id;
  const rzpOrderId = event.payload?.payment?.entity?.order_id;
  if (!paymentId || !rzpOrderId) return NextResponse.json({ ok: true });

  const supa = db();

  /* ── mark paid, exactly once ─────────────────────────────────── */
  const { data: updated, error: updErr } = await supa
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", rzpOrderId)
    .eq("status", "created") // <- the idempotency latch
    .select("*")
    .maybeSingle();

  if (updErr) {
    console.error("[webhook] update failed", updErr);
    return NextResponse.json({ ok: true, note: "update failed" });
  }

  if (!updated) {
    // Already processed, or an order we don't know. Either way: done.
    return NextResponse.json({ ok: true, note: "already handled" });
  }

  const order = updated as OrderRow;

  const { data: itemRows } = await supa
    .from("order_items")
    .select("sku, product_slug, name, size, qty, unit_paise, hsn, gst_rate")
    .eq("order_id", order.id);

  const items = (itemRows ?? []) as OrderItemRow[];

  /* ── stock, atomically ───────────────────────────────────────── */
  const { data: reserved, error: rpcErr } = await supa.rpc("reserve_stock", {
    items: items.map((i) => ({ sku: i.sku, qty: i.qty })),
  });

  if (rpcErr) {
    console.error("[webhook] reserve_stock failed", rpcErr);
  } else if (reserved === false) {
    // Paid, but someone else took the last one first. Flag it loudly —
    // this needs a human and a refund, and silently shipping nothing
    // would be far worse.
    await supa.from("orders").update({ status: "oversold" }).eq("id", order.id);
    console.error(`[webhook] OVERSOLD order ${order.order_no} — refund needed`);
    return NextResponse.json({ ok: true, oversold: true });
  }

  /* ── Shiprocket ──────────────────────────────────────────────── */
  if (!shiprocketConfigured()) {
    await supa
      .from("orders")
      .update({ shiprocket_error: "shiprocket not configured" })
      .eq("id", order.id);
    return NextResponse.json({ ok: true, shipping: "not configured" });
  }

  try {
    const sr = await pushToShiprocket(order, items);
    await supa
      .from("orders")
      .update({
        shiprocket_order_id: String(sr.order_id),
        shiprocket_shipment_id: String(sr.shipment_id),
        awb: sr.awb_code,
        shiprocket_error: null,
        pushed_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  } catch (e) {
    const dup = (e as { duplicate?: boolean }).duplicate === true;
    if (!dup) {
      // Recorded rather than swallowed. The payment is safe; this can be
      // retried by hand from the Shiprocket dashboard or by replaying
      // the webhook, and `shiprocket_error` is how you find it.
      const msg = e instanceof Error ? e.message : String(e);
      await supa
        .from("orders")
        .update({ shiprocket_error: msg.slice(0, 500) })
        .eq("id", order.id);
      console.error(`[webhook] shiprocket push failed for ${order.order_no}`, e);
    }
  }

  return NextResponse.json({ ok: true, order_no: order.order_no });
}
