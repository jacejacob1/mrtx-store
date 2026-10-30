import { Hero } from "@/components/home/Hero";
import { Statement } from "@/components/home/Statement";
import { ProductRail } from "@/components/home/ProductRail";
import { Chapter } from "@/components/home/Chapter";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { TurnAround } from "@/components/signature/TurnAround";
import { BehindYou } from "@/components/signature/BehindYou";
import { getCatalogue } from "@/lib/server/catalogue";

/**
 * Home.
 *
 *   hero        — the shoot, drawing back into a card as you scroll
 *   statement   — one line, lit word by word
 *   turn around — the tee turns: front for you, back for them
 *   the drop    — every tee on a shelf
 *   chapters    — one per design, each on its own garment's ground
 *   behind you  — every tee from the front; a lens reads their backs
 *   the shoot   — a slow river of photographs
 *
 * Ground sequence: dark → dark → light → dark/light/light/red → dark.
 * The nav reads whichever is under it and follows.
 */
export default async function Home() {
  const products = await getCatalogue();
  return (
    <>
      <Hero />
      <Statement />
      <TurnAround />
      <ProductRail />
      {products.map((p, i) => (
        <Chapter key={p.slug} product={p} flip={i % 2 === 1} />
      ))}
      <BehindYou />
      <GalleryStrip />
    </>
  );
}
