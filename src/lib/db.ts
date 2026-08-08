import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client.
 *
 * Every table has RLS enabled with no policies, so anon and
 * authenticated keys can read nothing at all. This key bypasses that
 * and must never reach the browser — `server-only` above enforces it at
 * build time.
 *
 * Created lazily so a missing env var fails on the request that needs
 * it, with a message that says what to do, rather than at import time.
 */
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type OrderStatus =
  | "created"
  | "paid"
  | "oversold"
  | "shipped"
  | "cancelled"
  | "refunded";

export type OrderRow = {
  id: string;
  order_no: number;
  status: OrderStatus;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  taxable_paise: number;
  tax_paise: number;
  shipping_paise: number;
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pin: string;
  shiprocket_order_id: string | null;
  awb: string | null;
  shiprocket_error: string | null;
  created_at: string;
  paid_at: string | null;
};

export type OrderItemRow = {
  sku: string;
  product_slug: string;
  name: string;
  size: string;
  qty: number;
  unit_paise: number;
  hsn: string;
  gst_rate: number;
};
