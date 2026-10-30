import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { DotText } from "@/components/DotText";
import { Reveal } from "@/components/Reveal";
import { GlyphBoard } from "@/components/signature/GlyphBoard";
import { OFFER_LABEL, FREE_SHIPPING_AT } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/server/catalogue";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = {
  title: "Shop",
  description: "Drop 001. Five oversized tees, 240gsm, cut and sewn in Tirupur.",
};

/**
 * The whole drop on one screen. Five products is few enough to show as a
 * 3+2 at desktop — no filters, no sort, nothing to configure.
 */
export default async function ShopPage() {
  const products = await getCatalogue();
  const { price, mrp } = products[0];

  return (
    <section data-ground="light" className="px-5 pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="flex items-center gap-3 text-fg-2">
            <span className="live-dot" aria-hidden />
            <DotText text="SS26 / DROP 001" size={11} label="SS26, drop 001" />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="t-hero mt-6">The drop.</h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="t-body mt-5 max-w-[46ch] text-fg-2">
            Five tees, one sentence each.{" "}
            <span className="text-fg">
              {OFFER_LABEL}: {formatINR(price)}
            </span>
            {mrp !== null && <>, down from {formatINR(mrp)}</>}.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="mt-14">
          <GlyphBoard />
        </Reveal>

        <ul className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 md:mt-20 md:gap-x-8 md:gap-y-20">
          {products.map((p, i) => (
            <li key={p.slug}>
              <Reveal delay={(i % 2) * 0.08}>
                <ProductCard
                  product={p}
                  sizes="(min-width: 1240px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  eager={i < 2}
                />
              </Reveal>
            </li>
          ))}
        </ul>

        <dl className="mt-24 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
          {[
            ["Shipping", `Free over ${formatINR(FREE_SHIPPING_AT)}.`],
            ["Returns", "Refunds within 7 days of delivery. Cash on delivery available."],
            ["Fabric", "240gsm combed cotton. Boxy, drop shoulder."],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="t-eyebrow text-fg-2">{k}</dt>
              <dd className="t-body mt-2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
