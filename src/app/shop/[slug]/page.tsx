import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { BuyBox } from "@/components/product/BuyBox";
import { PRODUCTS, productBySlug } from "@/lib/catalogue";
import { art } from "@/lib/media";
import { liveStock } from "@/lib/server/stock";

type Params = { params: Promise<{ slug: string }> };

// Rebuild the page with fresh stock at most every 30 seconds.
export const revalidate = 30;

// Only the catalogue slugs exist; anything else is a real 404, not a render.
export const dynamicParams = false;
export const generateStaticParams = () => PRODUCTS.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = productBySlug((await params).slug);
  if (!p) return {};
  return { title: p.name, description: `${p.tagline} ${p.body}` };
}

/**
 * One tee. The section takes the garment's ground, so the page feels
 * like the shirt. Photos scroll on the left while the buy box stays put
 * on the right (desktop); on a phone the photos are a swipeable strip
 * above it.
 */
export default async function ProductPage({ params }: Params) {
  const base = productBySlug((await params).slug);
  if (!base) notFound();
  const p = { ...base, stock: await liveStock(base) };

  const sides = (["front", "back"] as const).filter((s) => art(p.art[s]));
  const others = PRODUCTS.filter((x) => x.slug !== p.slug);

  return (
    <>
      <section data-ground={p.ground} className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto grid max-w-[1240px] gap-10 md:grid-cols-12 md:gap-12 md:px-5">
          <ul
            aria-label={`${p.name} photographs`}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:col-span-7 md:flex-col md:gap-4 md:overflow-visible md:px-0"
          >
            {p.photos.map((id, i) => (
              <li
                key={id}
                className="relative aspect-[4/5] w-[84vw] shrink-0 snap-center overflow-hidden rounded-[28px] bg-surface md:w-full"
              >
                <Photo
                  id={id}
                  alt={`${p.name} tee, SS26 shoot`}
                  sizes="(min-width: 1240px) 700px, (min-width: 768px) 58vw, 84vw"
                  fill
                  eager={i === 0}
                  className="object-cover"
                />
              </li>
            ))}
          </ul>

          <div className="px-5 md:col-span-5 md:px-0">
            <div className="md:sticky md:top-28">
              <BuyBox product={p} />
            </div>
          </div>
        </div>
      </section>

      {sides.length > 0 && (
        <section data-ground={p.ground} className="border-t border-line px-5 py-24 md:py-32">
          <div className="mx-auto max-w-[1240px]">
            <Reveal>
              <h2 className="t-headline">The print.</h2>
              <p className="t-body mt-4 max-w-[52ch] text-fg-2 first-letter:uppercase">{p.body}</p>
            </Reveal>
            <div className={`mt-14 grid gap-4 ${sides.length > 1 ? "md:grid-cols-2" : "md:max-w-[620px]"}`}>
              {sides.map((s, i) => (
                <Reveal key={s} delay={i * 0.08}>
                  <figure>
                    <div
                      className="relative aspect-square overflow-hidden rounded-[28px] ring-1 ring-line ring-inset"
                      style={{ background: p.garment.hex }}
                    >
                      <Photo
                        id={p.art[s]!}
                        kind="art"
                        alt={`${p.name} ${s} print artwork`}
                        sizes="(min-width: 768px) 600px, 100vw"
                        fill
                        className="object-contain p-[12%]"
                      />
                    </div>
                    <figcaption className="t-eyebrow mt-3 text-fg-2">{s}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section data-ground={p.ground} className="border-t border-line px-5 py-20">
        <dl className="mx-auto grid max-w-[1240px] gap-8 sm:grid-cols-2 md:grid-cols-4">
          {p.spec.map((line, i) => (
            <div key={line}>
              <dt className="t-eyebrow text-fg-2">{["Fabric", "Fit", "Made", "Print"][i] ?? "Detail"}</dt>
              <dd className="t-body mt-2 first-letter:uppercase">{line}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section data-ground="light" className="px-5 py-24 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="t-headline">The rest of the drop.</h2>
          <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <li key={o.slug}>
                <ProductCard product={o} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
