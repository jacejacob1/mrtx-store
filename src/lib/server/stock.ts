import { SIZES, type Product, type Size } from "@/lib/catalogue";
import { hasDb } from "@/lib/server/env";

/**
 * Live stock for a product, cached for 30 seconds. The page shows it;
 * the database still re-checks at checkout, so a stale "3 left" can
 * never oversell. Without a database configured (fresh clone, no
 * .env.local) it falls back to the catalogue's placeholder numbers.
 */
export async function liveStock(p: Product): Promise<Record<Size, number>> {
  if (!hasDb()) return p.stock;
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/variants?product_slug=eq.${p.slug}&select=size,stock`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        next: { revalidate: 30, tags: [`stock:${p.slug}`] },
      },
    );
    if (!res.ok) return p.stock;
    const rows = (await res.json()) as { size: Size; stock: number }[];
    const out = Object.fromEntries(SIZES.map((s) => [s, 0])) as Record<Size, number>;
    for (const r of rows) out[r.size] = r.stock;
    return out;
  } catch {
    return p.stock;
  }
}
