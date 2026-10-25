import { NextResponse } from "next/server";
import { rpc, update, DbError, type OrderRow } from "@/lib/server/db";
import { createRazorpayOrder } from "@/lib/server/razorpay";
import { env } from "@/lib/server/env";
import { SIZES } from "@/lib/catalogue";

/**
 * POST /api/checkout
 *   { customer: {...}, items: [{slug,size,qty}], method: "online" | "cod" }
 *
 * The browser never sends a price. The database prices the bag, holds the
 * stock, and returns the total; only then is a Razorpay order created for
 * exactly that amount. If Razorpay fails, the hold is released at once.
 */

type Body = {
  customer?: Record<string, unknown>;
  items?: unknown;
  method?: unknown;
};

const FIELDS = ["email", "phone", "name", "address1", "address2", "city", "state", "pincode"] as const;

function clean(raw: Record<string, unknown> = {}) {
  const c = Object.fromEntries(FIELDS.map((f) => [f, String(raw[f] ?? "").trim().slice(0, 200)])) as Record<
    (typeof FIELDS)[number],
    string
  >;
  // Accept "+91 98765 43210", "098765 43210", etc. Store 10 digits.
  c.phone = c.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  c.pincode = c.pincode.replace(/\D/g, "");
  c.email = c.email.toLowerCase();

  const problems: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) problems.push("email");
  if (!/^[6-9]\d{9}$/.test(c.phone)) problems.push("phone");
  if (c.name.length < 2) problems.push("name");
  if (c.address1.length < 5) problems.push("address1");
  if (c.city.length < 2) problems.push("city");
  if (c.state.length < 2) problems.push("state");
  if (!/^[1-9]\d{5}$/.test(c.pincode)) problems.push("pincode");
  return { customer: c, problems };
}

function cleanItems(raw: unknown) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;
  const items = raw.map((r) => ({
    slug: String(r?.slug ?? ""),
    size: String(r?.size ?? ""),
    qty: Math.trunc(Number(r?.qty)),
  }));
  const ok = items.every(
    (i) => /^[a-z0-9-]{1,40}$/.test(i.slug) && (SIZES as readonly string[]).includes(i.size) && i.qty >= 1 && i.qty <= 10,
  );
  return ok ? items : null;
}

/** Turn a database exception into something a customer can act on. */
function friendly(e: DbError) {
  const m = e.message;
  if (m.startsWith("OUT_OF_STOCK")) {
    const [, sku, left] = m.split(":");
    return { status: 409, error: "out_of_stock", sku, left: Number(left), message: "Something in your bag just sold out." };
  }
  if (m.startsWith("UNKNOWN_ITEM") || m.startsWith("NOT_FOR_SALE"))
    return { status: 409, error: "unavailable", message: "Something in your bag is no longer available." };
  return { status: 400, error: "bad_order", message: "We couldn't place that order." };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const method = body.method === "cod" ? "cod" : body.method === "online" ? "online" : null;
  const items = cleanItems(body.items);
  const { customer, problems } = clean(body.customer);
  if (!method || !items || problems.length) {
    return NextResponse.json({ error: "invalid", fields: problems, message: "Please check the highlighted details." }, { status: 422 });
  }

  let order: OrderRow;
  try {
    order = await rpc<OrderRow>("place_order", { p_customer: customer, p_items: items, p_method: method });
  } catch (e) {
    if (e instanceof DbError) {
      const f = friendly(e);
      return NextResponse.json(f, { status: f.status });
    }
    console.error("place_order", e);
    return NextResponse.json({ error: "server", message: "Checkout is having a moment. Try again." }, { status: 500 });
  }

  if (method === "cod") {
    return NextResponse.json({ orderId: order.id, number: order.number, total: order.total_paise, method });
  }

  try {
    const rzp = await createRazorpayOrder(order.total_paise, order.number, { order_id: order.id });
    await update("orders", `id=eq.${order.id}`, { razorpay_order_id: rzp.id });
    return NextResponse.json({
      orderId: order.id,
      number: order.number,
      total: order.total_paise,
      method,
      razorpay: { key: env.razorpayKeyId, orderId: rzp.id, amount: rzp.amount },
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
    });
  } catch (e) {
    console.error("razorpay order", e);
    await rpc("cancel_order", { p_order: order.id, p_status: "cancelled" }).catch(() => {});
    return NextResponse.json({ error: "payment_unavailable", message: "Payments are unavailable right now. Try again, or choose cash on delivery." }, { status: 502 });
  }
}
