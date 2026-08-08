import "server-only";
import { env } from "@/lib/env";
import type { OrderRow, OrderItemRow } from "@/lib/db";

const API = "https://apiv2.shiprocket.in/v1/external";

/**
 * Shiprocket tokens last ~10 days. Cached in module scope, which on
 * Vercel means per warm lambda — worst case we log in again, which is
 * cheap and harmless. Caching it in the database would be a shared
 * secret sitting in a table for no real gain.
 */
let token: { value: string; expires: number } | null = null;

async function login(): Promise<string> {
  if (token && Date.now() < token.expires) return token.value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: env.shiprocketEmail(),
      password: env.shiprocketPassword(),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Shiprocket login failed (${res.status})`);
  }
  const data = (await res.json()) as { token: string };
  // Refresh after 8 days, comfortably inside the ~10 day lifetime.
  token = { value: data.token, expires: Date.now() + 8 * 864e5 };
  return data.token;
}

export type ShiprocketResult = {
  order_id: number;
  shipment_id: number;
  awb_code?: string | null;
};

/**
 * Pushes a paid order to Shiprocket.
 *
 * IDEMPOTENCY: `order_id` is our own order number. Shiprocket rejects a
 * duplicate with a 4xx, which is exactly what we want — the payment
 * webhook retries, and a retry must not create a second shipment for
 * the same order. The caller treats "already exists" as success.
 *
 * Weight and dimensions are per-shipment, not per-item. 0.35kg and
 * 30×25×3cm is one folded 240gsm tee in a polymailer; multi-item orders
 * scale the weight but keep the box, which is close enough for rate
 * calculation and is what gets corrected at pickup anyway.
 */
export async function pushToShiprocket(
  order: OrderRow,
  items: OrderItemRow[],
): Promise<ShiprocketResult> {
  const t = await login();
  const qty = items.reduce((n, i) => n + i.qty, 0);

  const body = {
    order_id: String(order.order_no),
    order_date: new Date(order.created_at).toISOString().slice(0, 16).replace("T", " "),
    pickup_location: env.shiprocketPickup(),
    billing_customer_name: order.name.split(" ")[0] ?? order.name,
    billing_last_name: order.name.split(" ").slice(1).join(" ") || "",
    billing_address: order.line1,
    billing_address_2: order.line2 ?? "",
    billing_city: order.city,
    billing_pincode: order.pin,
    billing_state: order.state,
    billing_country: "India",
    billing_email: order.email,
    billing_phone: order.phone,
    shipping_is_billing: true,
    order_items: items.map((i) => ({
      name: `${i.name} / ${i.size}`,
      sku: i.sku,
      units: i.qty,
      selling_price: Math.round(i.unit_paise / 100),
      hsn: i.hsn,
    })),
    // Prepaid: the money is already captured before we ever get here.
    payment_method: "Prepaid",
    shipping_charges: Math.round(order.shipping_paise / 100),
    sub_total: Math.round(order.amount_paise / 100),
    length: 30,
    breadth: 25,
    height: 3,
    weight: Math.max(0.35, qty * 0.35),
  };

  const res = await fetch(`${API}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const msg = JSON.stringify(data);
    // A duplicate is not a failure — a webhook retry reaching an order
    // Shiprocket already has is the system working correctly.
    if (res.status === 422 && /already exists/i.test(msg)) {
      throw Object.assign(new Error("duplicate"), { duplicate: true });
    }
    throw new Error(`Shiprocket create failed (${res.status}): ${msg}`);
  }

  return {
    order_id: Number(data.order_id),
    shipment_id: Number(data.shipment_id),
    awb_code: (data.awb_code as string | null) ?? null,
  };
}
