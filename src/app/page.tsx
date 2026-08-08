import Link from "next/link";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { LIVE } from "@/lib/products";
import { MATERIALS, texturePath } from "@/lib/materials";

/**
 * Home — CLAUDE.md §14.
 *
 * "Aperture hero at full effect. Below it, one drop, one lookbook
 * strip, nothing else. Resist adding sections."
 *
 * Three sections. That is the whole page, and it stays that way.
 *
 * The hero is fixed and full-bleed, so everything below it paints
 * SOLID PAPER over the material as it scrolls up. That is not a style
 * choice — §6 forbids materials "behind body copy, tables, forms, or
 * anything with a price", and the drop grid is all price. The material
 * is visible at the hero and nowhere a number is.
 */
export default function Home() {
  return (
    <>
      <Hero />

      {/* ONE drop. z-10 and an opaque background so it covers the fixed
          material rather than reading through it. */}
      <section className="relative z-10 bg-paper">
        <div className="mx-auto max-w-[1180px] px-5 py-20">
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-6">
            <h2 className="label text-mute">THE DROP / SS26</h2>
            <Link href="/shop" className="mono text-readout text-ink">
              see the drop →
            </Link>
          </div>

          <div className="mt-10 grid gap-x-5 gap-y-14 sm:grid-cols-2">
            {LIVE.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ONE lookbook strip. */}
      <section className="relative z-10 bg-paper pb-20">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-6">
            <h2 className="label text-mute">LOOKBOOK / TEN MATERIALS</h2>
            <Link href="/lookbook" className="mono text-readout text-ink">
              see all →
            </Link>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto px-5 pb-2">
          {MATERIALS.map((m) => (
            <Link
              key={m.id}
              href="/lookbook"
              aria-label={`${m.name}, ${m.finish} finish`}
              className="h-[clamp(120px,20vh,190px)] w-[clamp(150px,24vw,260px)] shrink-0"
              style={{
                backgroundImage: `url(${texturePath(m.id)})`,
                backgroundSize: "384px 152px",
                backgroundRepeat: "repeat",
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
