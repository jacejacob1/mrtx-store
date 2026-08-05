import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductMedia } from "@/components/ProductMedia";
import { BuyPanel } from "@/components/BuyPanel";
import { PRODUCTS, productBySlug } from "@/lib/products";
import { formatINR, splitGst } from "@/lib/money";
import { GST } from "@/lib/config";
import { materialById } from "@/lib/materials";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.tagline} ${p.spec.join(". ")}.`,
  };
}

/**
 * Product — CLAUDE.md §14.
 *
 * "Image left/top, detail right/bottom. Aperture reinterpreted: on
 * hover a slit sweeps once across the image to reveal the alt shot.
 * Size selector as mono chips, out-of-stock struck through not hidden.
 * One blue element on the page: the add-to-cart underline."
 *
 * §13: product copy is material, weight, fit, origin. Facts, not
 * adjectives.
 */
export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const gst = splitGst(product.price);
  const material = materialById(product.material);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link href="/shop" className="mono text-readout text-mute">
          ← shop
        </Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <ProductMedia
            materialId={product.material}
            alt={product.alt}
            sweep
          />
          {material && (
            <p className="label mt-3 text-mute">
              MAT.
              {String(
                PRODUCTS.findIndex((p) => p.slug === product.slug) + 1,
              ).padStart(2, "0")}{" "}
              {material.finish} {material.hex}
            </p>
          )}
        </div>

        <div className="md:pt-2">
          <h1
            className="text-ink"
            style={{ fontSize: "var(--text-section)", lineHeight: 1.1 }}
          >
            {product.name}
          </h1>
          <p className="mt-2 text-[15px] text-mute">{product.tagline}</p>

          <p className="mono mt-6 text-[19px] text-ink">
            {formatINR(product.price)}
          </p>
          <p className="mono mt-1 text-readout text-mute">
            incl. {gst.rate}% GST ({formatINR(gst.tax)}) / HSN{" "}
            {GST.HSN_TSHIRT}
          </p>

          <div className="my-9 border-t border-line" />

          <BuyPanel product={product} />

          <div className="my-9 border-t border-line" />

          <p className="max-w-[46ch] text-[15px] text-ink">{product.body}</p>

          <ul className="mt-6 space-y-1.5">
            {product.spec.map((s) => (
              <li key={s} className="mono text-readout text-mute">
                {s}
              </li>
            ))}
          </ul>

          <p className="mono mt-8 text-readout text-mute">
            free shipping over {formatINR(250_000)} ·{" "}
            <Link href="/policies/returns" className="underline">
              7-day exchange
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
