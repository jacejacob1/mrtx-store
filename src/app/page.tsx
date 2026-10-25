import { Hero } from "@/components/home/Hero";
import { Statement } from "@/components/home/Statement";
import { ProductRail } from "@/components/home/ProductRail";
import { Chapter } from "@/components/home/Chapter";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { PRODUCTS } from "@/lib/catalogue";

/**
 * Home.
 *
 *   hero        — the shoot, drawing back into a card as you scroll
 *   statement   — one line, lit word by word
 *   the drop    — all four on a shelf
 *   chapters    — one per design, each on its own garment's ground
 *   the shoot   — a slow river of photographs
 *
 * Ground sequence: dark → dark → light → dark/light/light/red → dark.
 * The nav reads whichever is under it and follows.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <ProductRail />
      {PRODUCTS.map((p, i) => (
        <Chapter key={p.slug} product={p} flip={i % 2 === 1} />
      ))}
      <GalleryStrip />
    </>
  );
}
