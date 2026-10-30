import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/server/catalogue";
import { hasDb } from "@/lib/server/env";
import { SIZES, type Size } from "@/lib/catalogue";

/**
 * GET /api/stock → { "remember": { "S": 8, "M": 18, … }, … }
 *
 * What the glyph board polls. Only counts — nothing private — and
 * cached for 10 seconds at the edge so a busy drop can't hammer the
 * database.
 */
export async function GET() {
  let stock: Record<string, Record<Size, number>>;

  if (hasDb()) {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/variants?select=product_slug,size,stock`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      next: { revalidate: 10 },
    });
    if (!res.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    const rows = (await res.json()) as { product_slug: string; size: Size; stock: number }[];
    stock = {};
    for (const r of rows) {
      stock[r.product_slug] ??= Object.fromEntries(SIZES.map((s) => [s, 0])) as Record<Size, number>;
      stock[r.product_slug][r.size] = r.stock;
    }
  } else {
    stock = Object.fromEntries((await getCatalogue()).map((p) => [p.slug, p.stock]));
  }

  return NextResponse.json(stock, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
  });
}
