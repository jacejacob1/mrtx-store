import { cache } from "react";
import { PRODUCTS, SIZES, type Ground, type Product, type Size } from "@/lib/catalogue";
import type { Media } from "@/lib/media";
import { hasDb } from "@/lib/server/env";

/** Every catalogue read is tagged with this; the dashboard expires it on save. */
export const CATALOGUE_TAG = "catalogue";

export type ProductRow = {
  slug: string;
  idx: string | null;
  name: string;
  tagline: string;
  body: string;
  garment_name: string;
  garment_hex: string;
  ground: Ground;
  price_paise: number;
  mrp_paise: number | null;
  spec: string[];
  photos: Media[];
  chapter_id: string | null;
  art_front: Media | null;
  art_back: Media | null;
  sku_prefix: string | null;
  sort: number;
  active: boolean;
  variants: { size: Size; stock: number }[];
};

export function rowToProduct(r: ProductRow): Product {
  const stock = Object.fromEntries(SIZES.map((s) => [s, 0])) as Record<Size, number>;
  for (const v of r.variants ?? []) stock[v.size] = v.stock;
  const photos = Array.isArray(r.photos) ? r.photos : [];
  return {
    slug: r.slug,
    index: r.idx ?? String(r.sort).padStart(3, "0"),
    name: r.name,
    tagline: r.tagline,
    body: r.body,
    garment: { name: r.garment_name, hex: r.garment_hex },
    ground: r.ground,
    price: r.price_paise,
    mrp: r.mrp_paise,
    photos,
    chapter: photos.find((p) => p.id === r.chapter_id) ?? photos[0] ?? null,
    art: {
      ...(r.art_front ? { front: r.art_front } : {}),
      ...(r.art_back ? { back: r.art_back } : {}),
    },
    spec: r.spec ?? [],
    stock,
    sku: r.sku_prefix ?? `MRTX-${r.slug.toUpperCase()}`,
  };
}

/**
 * The live catalogue, from Supabase.
 *
 * Cached by Next and tagged, so the whole site shares one copy. It
 * refreshes on its own every 30 seconds (stock moves with every order)
 * and instantly when the dashboard saves. If the database isn't
 * configured or is unreachable, the site falls back to the catalogue
 * in code rather than going blank.
 */
export const getCatalogue = cache(async (): Promise<Product[]> => {
  if (!hasDb()) return [...PRODUCTS];
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/products?active=eq.true&order=sort.asc&select=*,variants(size,stock)`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        next: { revalidate: 30, tags: [CATALOGUE_TAG] },
      },
    );
    if (!res.ok) throw new Error(`catalogue ${res.status}`);
    const rows = (await res.json()) as ProductRow[];
    return rows.length ? rows.map(rowToProduct) : [...PRODUCTS];
  } catch (e) {
    console.error("getCatalogue — falling back to built-in catalogue", e);
    return [...PRODUCTS];
  }
});

export async function getProduct(slug: string) {
  return (await getCatalogue()).find((p) => p.slug === slug);
}
