import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductArt } from "@/components/ProductArt";
import { BuyPanel } from "@/components/BuyPanel";
import { Price } from "@/components/Price";
import { LIVE, productBySlug } from "@/lib/products";
import { formatINR, splitGst, discount } from "@/lib/money";
import { GST } from "@/lib/config";
import { liveStock } from "@/lib/stock";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/products";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LIVE.map((p) => ({ slug: p.slug }));
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
 * Product — CLAUDE.md §14, with the per-design treatment Jace chose over
 * one shared template.
 *
 * The structure is constant: art on the left, detail on the right, mono
 * size chips, one blue element (the add-to-cart underline). What changes
 * per design is the world it sits in — ORIGIN inverts the page to ink,
 * because its artwork is white on transparency and would vanish on
 * paper. The theme is carried by the product record, so the next design
 * declares its own and nothing here needs editing.
 *
 * The "remember" idea is used structurally rather than as a slogan
 * pasted on: the tagline sets the page, and the back print — which
 * carries the word alone — is what the hover slit reveals.
 */
export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const stock = await liveStock(product);
  const gst = splitGst(product.price);
  const off = discount(product.price, product.mrp);
  const ink = product.theme === "ink";

  return (
    <div className={ink ? "theme-ink" : undefined}>
      <div className="mx-auto max-w-[1180px] px-5 py-14">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link href="/shop" className="mono text-readout text-mute">
            ← shop
          </Link>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <ProductArt product={product} sweep priority />
            <p className="label mt-3 text-mute">
              FRONT / BACK — HOVER TO TURN
            </p>
          </div>

          <div className="md:pt-2">
            <p className="label text-mute">MRTX — ORIGIN / EST. 2026</p>

            <h1
              className="mt-3 max-w-[12ch] leading-[0.95] font-semibold tracking-[-0.02em] text-ink"
              style={{ fontSize: "clamp(34px, 5.4vw, 62px)" }}
            >
              {product.tagline}
            </h1>

            <div className="mt-7">
              <Price product={product} size="lg" />
            </div>
            <p className="mono mt-2 text-readout text-mute">
              incl. {gst.rate}% GST ({formatINR(gst.tax)}) / HSN{" "}
              {GST.HSN_TSHIRT}
              {off && <> · launch price, saving {formatINR(off.saved)}</>}
            </p>

            <div className="my-9 border-t border-line" />

            <BuyPanel product={product} stock={stock} />

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
              free shipping over {formatINR(FREE_SHIPPING_THRESHOLD)} ·{" "}
              <Link href="/policies/returns" className="underline">
                7-day exchange
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* The back print, full width. On a tee printed both sides this is
          half the product, and a hover reveal is not enough on touch —
          where there is no hover at all. */}
      <section className="mx-auto max-w-[1180px] px-5 pb-20">
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-5">
          <h2 className="label text-mute">THE BACK</h2>
          <p className="label text-mute">{product.name}</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <figure>
            <ProductArt product={product} />
            <figcaption className="label mt-3 text-mute">FRONT</figcaption>
          </figure>
          <figure>
            <div
              className="pmedia"
              style={{ aspectRatio: "1280 / 1646", background: "#0B0B0D" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/products/${product.art.back}-900.webp`}
                srcSet={`/assets/products/${product.art.back}-640.webp 640w, /assets/products/${product.art.back}-900.webp 900w, /assets/products/${product.art.back}-1280.webp 1280w`}
                sizes="(min-width: 640px) 46vw, 92vw"
                alt={product.alt.back}
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <figcaption className="label mt-3 text-mute">BACK</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
