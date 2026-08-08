import "server-only";
import { db } from "@/lib/db";
import { paymentsConfigured } from "@/lib/env";
import type { Product, Size } from "@/lib/products";

/**
 * Live stock, read from the database rather than products.ts.
 *
 * The numbers in products.ts are opening stock and go stale the moment
 * the first order lands. Without this the shop would happily let
 * someone add a sold-out size, pay, and then be refunded as `oversold` —
 * technically safe, because the decrement is atomic, but a miserable
 * thing to do to a customer.
 *
 * Falls back to the catalogue when the database is not configured, so
 * the site still renders on a preview deploy with no env vars.
 */
export async function liveStock(
  product: Product,
): Promise<Record<Size, number>> {
  const fallback = Object.fromEntries(
    product.variants.map((v) => [v.size, v.stock]),
  ) as Record<Size, number>;

  if (!paymentsConfigured()) return fallback;

  try {
    const { data, error } = await db()
      .from("stock")
      .select("size, on_hand")
      .eq("product_slug", product.slug);

    if (error || !data?.length) return fallback;

    const out = { ...fallback };
    for (const row of data) {
      out[row.size as Size] = row.on_hand as number;
    }
    return out;
  } catch {
    // A database blip must not take the shop down. Showing opening
    // stock is wrong at the edges; showing an error page is wrong
    // everywhere.
    return fallback;
  }
}
