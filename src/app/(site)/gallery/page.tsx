import type { Metadata } from "next";
import { DotText } from "@/components/DotText";
import { Reveal } from "@/components/Reveal";
import { GalleryView, type Frame } from "@/components/gallery/GalleryView";
import { SHOOT_TAGS, HIDDEN_SHOOTS, productBySlug } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/server/catalogue";
import { allShoots } from "@/lib/media";

export const metadata: Metadata = {
  title: "Gallery",
  description: "The MRTX SS26 shoot — every frame.",
};

export default async function GalleryPage() {
  const products = await getCatalogue();
  const frames: Frame[] = allShoots()
    .filter((id) => !HIDDEN_SHOOTS.has(id))
    .map((id) => {
      const p = SHOOT_TAGS[id] ? productBySlug(SHOOT_TAGS[id], products) : undefined;
      return { id, product: p ? { slug: p.slug, name: p.name } : null };
    });

  return (
    <section data-ground="dark" className="min-h-[100svh] px-5 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-[1240px]">
        <Reveal>
          <div className="flex items-center gap-3 text-fg-2">
            <DotText text={`${frames.length} FRAMES`} size={11} label={`${frames.length} frames`} />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="t-hero mt-6">The shoot.</h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="t-body mt-5 mb-12 max-w-[44ch] text-fg-2">
            SS26, on the coast and in the trees. Tap any frame to see it whole.
          </p>
        </Reveal>
        <GalleryView frames={frames} filters={products.map((p) => ({ slug: p.slug, name: p.name }))} />
      </div>
    </section>
  );
}
