import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRazorpayOrder } from "@/lib/razorpay";
import { paymentsConfigured } from "@/lib/env";
import { LIVE, variantFor, SIZES, type Size } from "@/lib/products";
import { splitGst, splitOrderGst } from "@/lib/money";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
} from "@/lib/products";
import { GST } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Incoming = {
  items?: { slug?: unknown; size?: unknown; qty?: unknown }[];
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  state?: unknown;
  pin?: unknown;
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Creates an order and the matching Razorpay order.
 *
 * THE PRICE NEVER COMES FROM THE BROWSER. The client sends slugs, sizes
 * and quantities; everything with a rupee sign attached is recomputed
 * here from the catalogue. A checkout that trusts a client-supplied
 * amount can be bought from for ₹1, and it is the single most common
 * way a small store gets drained.
 *
 * Stock is CHECKED here but not decremented — that happens atomically
 * when the payment is captured (see the webhook). Reserving at this
 * point would let abandoned checkouts eat a small drop alive.
 */
export async function POST(req: Request) {
  if (!paymentsConfigured()) {
    return NextResponse.json(
      { error: "payments are not connected." },
      { status: 503 },
    );
  }

  let body: Incoming;
  try {
    body = (await req.json()) as Incoming;
  } catch {
    return NextResponse.json({ error: "bad request." }, { status: 400 });
  }

  /* ── address ─────────────────────────────────────────────────── */
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone).replace(/\D/g, "");
  const line1 = str(body.line1);
  const line2 = str(body.line2);
  const city = str(body.city);
  const state = str(body.state);
  const pin = str(body.pin).replace(/\D/g, "");

  const bad: string[] = [];
  if (!name) bad.push("name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) bad.push("email");
  if (phone.length !== 10) bad.push("phone");
  if (!line1) bad.push("line1");
  if (!city) bad.push("city");
  if (!state) bad.push("state");
  if (pin.length !== 6) bad.push("pin");
  if (bad.length) {
    return NextResponse.json({ error: "invalid", fields: bad }, { status: 400 });
  }

  /* ── cart, revalidated against the catalogue ─────────────────── */
  const incoming = Array.isArray(body.items) ? body.items : [];
  if (incoming.length === 0 || incoming.length > 20) {
    return NextResponse.json({ error: "empty cart." }, { status: 400 });
  }

  const lines: {
    sku: string;
    product_slug: string;
    name: string;
    size: Size;
    qty: number;
    unit_paise: number;
    hsn: string;
    gst_rate: number;
  }[] = [];

  for (const raw of incoming) {
    const slug = str(raw.slug);
    const size = str(raw.size) as Size;
    const qty = Math.floor(Number(raw.qty));

    const product = LIVE.find((p) => p.slug === slug);
    if (!product) {
      return NextResponse.json(
        { error: `${slug || "that item"} is no longer available.` },
        { status: 409 },
      );
    }
    if (!SIZES.includes(size)) {
      return NextResponse.json({ error: "bad size." }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
      return NextResponse.json({ error: "bad quantity." }, { status: 400 });
    }

    const variant = variantFor(product, size);
    if (!variant) {
      return NextResponse.json({ error: "bad size." }, { status: 400 });
    }

    lines.push({
      sku: variant.sku,
      product_slug: product.slug,
      name: product.name,
      size,
      qty,
      unit_paise: product.price, // <- from the catalogue, never the client
      hsn: GST.HSN_TSHIRT,
      gst_rate: splitGst(product.price).rate,
    });
  }

  /* ── stock check (advisory; the decrement is atomic later) ───── */
  const supa = db();
  const { data: stock, error: stockErr } = await supa
    .from("stock")
    .select("sku, on_hand")
    .in(
      "sku",
      lines.map((l) => l.sku),
    );

  if (stockErr) {
    return NextResponse.json({ error: "could not check stock." }, { status: 500 });
  }

  const onHand = new Map((stock ?? []).map((s) => [s.sku, s.on_hand as number]));
  for (const l of lines) {
    if ((onHand.get(l.sku) ?? 0) < l.qty) {
      return NextResponse.json(
        { error: `${l.name} ${l.size} just sold out.` },
        { status: 409 },
      );
    }
  }

  /* ── totals, computed here and nowhere else ──────────────────── */
  const gst = splitOrderGst(
    lines.map((l) => ({ unit: l.unit_paise, qty: l.qty })),
  );
  const shipping =
    gst.gross >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = gst.gross + shipping;

  /* ── Razorpay order, then our row ────────────────────────────── */
  try {
    const rzp = await createRazorpayOrder({
      amountPaise: total,
      receipt: `mrtx-${Date.now()}`,
      notes: { email, phone },
    });

    const { data: order, error } = await supa
      .from("orders")
      .insert({
        status: "created",
        razorpay_order_id: rzp.id,
        amount_paise: total,
        taxable_paise: gst.taxable,
        tax_paise: gst.tax,
        shipping_paise: shipping,
        name,
        email,
        phone,
        line1,
        line2: line2 || null,
        city,
        state,
        pin,
      })
      .select("id, order_no")
      .single();

    if (error || !order) {
      throw new Error(`order insert failed: ${error?.message}`);
    }

    const { error: itemsErr } = await supa.from("order_items").insert(
      lines.map((l) => ({ ...l, order_id: order.id })),
    );
    if (itemsErr) throw new Error(`items insert failed: ${itemsErr.message}`);

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.order_no,
      razorpayOrderId: rzp.id,
      amountPaise: total,
      // Publishable by design — this is the key the modal needs.
      keyId: process.env.RAZORPAY_KEY_ID,
      name,
      email,
      phone,
    });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json(
      { error: "could not start payment. nothing was charged." },
      { status: 502 },
    );
  }
}
