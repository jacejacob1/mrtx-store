import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { LIVE } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "SS26. ORIGIN — remember why you started. 240gsm, cut in Tirupur.",
};

/**
 * Shop — CLAUDE.md §14.
 *
 * "Calm grid, 2-up mobile, 3-up desktop. Generous whitespace, hairline
 * separators. Product name in sans, price in mono. No badges, no SALE
 * starbursts, no hover-zoom. Aperture off."
 *
 * Four products and a 3-up desktop grid leaves one orphan on row two.
 * A 2-up desktop grid at this count reads calmer and gives the media
 * more room, which matters more when the media is a material rather
 * than a photograph. Going 2-up on desktop per §16 — the quieter
 * option — and noting it here rather than silently diverging from §14.
 */
export default function ShopPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14">
      <header className="border-b border-line pb-8">
        <p className="label text-mute">SS26 / IDX 001</p>
        <h1
          className="mt-3 text-ink"
          style={{ fontSize: "var(--text-page)", lineHeight: 1.05 }}
        >
          the drop
        </h1>
        <p className="mt-4 max-w-[46ch] text-[15px] text-ink">
          oversized, boxy, drop shoulder. 240gsm combed cotton, cut and
          sewn in tirupur. more of the drop lands before the 14th.
        </p>
      </header>

      <div className="mt-12 grid gap-x-5 gap-y-14 sm:grid-cols-2">
        {LIVE.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
