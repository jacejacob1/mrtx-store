import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { select } from "@/lib/server/db";
import { rowToProduct, type ProductRow } from "@/lib/server/catalogue";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) notFound();
  const [row] = await select<ProductRow[]>("products", `slug=eq.${slug}&select=*,variants(size,stock)`);
  if (!row) notFound();
  const p = rowToProduct(row);
  return <ProductEditor key={row.slug + (row as unknown as { updated_at: string }).updated_at} product={p} chapterId={row.chapter_id} />;
}
