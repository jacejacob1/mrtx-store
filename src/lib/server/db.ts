import { env } from "@/lib/server/env";

/**
 * A thin client for Supabase's REST API, called with the service role
 * key from the server only. Row-level security blocks everything else,
 * so this file is the one door into orders.
 */

export class DbError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: env.supabaseServiceKey,
      Authorization: `Bearer ${env.supabaseServiceKey}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new DbError(body?.message ?? res.statusText, res.status, body?.code);
  return body as T;
}

/** Call a Postgres function. */
export const rpc = <T>(fn: string, args: Record<string, unknown>) =>
  call<T>(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });

/** GET a table with a PostgREST query string, e.g. select("variants", "select=sku,stock"). */
export const select = <T>(table: string, query: string) => call<T>(`${table}?${query}`);

/** PATCH rows matching a filter, returning them. */
export const update = <T>(table: string, filter: string, patch: Record<string, unknown>) =>
  call<T>(`${table}?${filter}`, { method: "PATCH", body: JSON.stringify(patch), prefer: "return=representation" });

/** INSERT; with ignoreDuplicates a repeat of the same primary key is a no-op. */
export const insert = <T>(table: string, row: Record<string, unknown>, ignoreDuplicates = false) =>
  call<T>(table, {
    method: "POST",
    body: JSON.stringify(row),
    prefer: ignoreDuplicates ? "resolution=ignore-duplicates,return=representation" : "return=representation",
  });

export type OrderRow = {
  id: string;
  number: string;
  status:
    | "pending_payment"
    | "cod_pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "expired"
    | "refund_requested"
    | "refunded";
  method: "online" | "cod";
  email: string;
  phone: string;
  name: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal_paise: number;
  shipping_paise: number;
  cod_fee_paise: number;
  total_paise: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  awb: string | null;
  created_at: string;
  paid_at: string | null;
};

export type OrderItemRow = {
  sku: string;
  product_slug: string;
  name: string;
  size: string;
  unit_paise: number;
  qty: number;
};
