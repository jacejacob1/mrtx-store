import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { ProductCard } from "@/components/ProductCard";
import { BuyBox } from "@/components/product/BuyBox";
import { TurnToy } from "@/components/signature/TurnToy";
import { PRODUCTS } from "@/lib/catalogue";
import { getCatalogue, getProduct } from "@/lib/server/catalogue";

type Params = { params: Promise<{ slug: string }> };

// Rebuild with fresh stock at most every 30 seconds; a dashboard save refreshes it at once.
export const revalidate = 30;

// Only the catalogue slugs exist; anything else is a real 404, not a render.
export const dynamicParams = false;
export const generateStaticParams = () => PRODUCTS.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getProduct((await params).slug);
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
  const { slug } = await params;
  const products = await getCatalogue();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();

  const sides = (["front", "back"] as const).filter((s) => p.art[s]);
  const others = products.filter((x) => x.slug !== p.slug);

  return (
    <>
      <section data-ground={p.ground} className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto grid max-w-[1240px] gap-10 md:grid-cols-12 md:gap-12 md:px-5">
          <ul
            aria-label={`${p.name} photographs`}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:col-span-7 md:flex-col md:gap-4 md:overflow-visible md:px-0"
          >
            {p.photos.map((m, i) => (
              <li
                key={m.id}
                className="relative aspect-[4/5] w-[84vw] shrink-0 snap-center overflow-hidden rounded-[28px] bg-surface md:w-full"
              >
                <Photo
                  media={m}
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
            <div className="grid items-center gap-12 md:grid-cols-12">
              <div className="md:col-span-5">
                <Reveal>
                  <h2 className="t-headline">The print.</h2>
                  <p className="t-body mt-4 max-w-[46ch] text-fg-2 first-letter:uppercase">{p.body}</p>
                </Reveal>
                <div className="mt-10 grid max-w-[360px] grid-cols-2 gap-3">
                  {sides.map((s) => (
                    <figure key={s}>
                      <div
                        className="relative aspect-square overflow-hidden rounded-[18px] ring-1 ring-line ring-inset"
                        style={{ background: p.garment.hex }}
                      >
                        <Photo
                          media={p.art[s]}
                          alt={`${p.name} ${s} print artwork`}
                          sizes="180px"
                          fill
                          className="object-contain p-[10%]"
                        />
                      </div>
                      <figcaption className="t-eyebrow mt-2 text-fg-2">{s} artwork</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className="md:col-span-7">
                <TurnToy product={p} />
              </div>
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
