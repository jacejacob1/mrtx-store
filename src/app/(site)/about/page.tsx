import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { DotText } from "@/components/DotText";
import { Reveal } from "@/components/Reveal";
import { Wordmark } from "@/components/Wordmark";
import { getCatalogue } from "@/lib/server/catalogue";

export const metadata: Metadata = {
  title: "About",
  description: "MRTX CLUB makes oversized tees with one sentence each. Est. 2026.",
};

// DRAFT COPY — Jace to rewrite in his own words. Every fact below comes
// from the catalogue (fabric, fit, origin) or the garments (EST. 2026).
export default async function AboutPage() {
  const products = await getCatalogue();
  return (
    <>
      <section data-ground="dark" className="px-5 pt-36 pb-24 md:pt-48 md:pb-32">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <Wordmark className="h-auto w-[132px] text-fg" decorative />
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="t-hero mt-10 max-w-[13ch]">The quiet part goes on the front.</h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="t-title mt-8 max-w-[38ch] text-fg-2">
              MRTX CLUB makes oversized tees with one sentence each. A small mark on the chest
              for you. The whole sentence on the back, for whoever walks behind you.
            </p>
          </Reveal>
        </div>
      </section>

      <section data-ground="dark" className="px-5 pb-24 md:pb-32">
        <Reveal className="mx-auto max-w-[1240px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] md:aspect-[16/10]">
            <Photo
              id="9666"
              alt="Two people in BREATHE tees — one showing the small front print, one the large back print"
              sizes="(min-width: 1240px) 1240px, 100vw"
              fill
              className="object-cover object-[50%_35%]"
            />
          </div>
        </Reveal>
      </section>

      <section data-ground="light" className="px-5 py-24 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <h2 className="t-display max-w-[16ch]">Made plainly, so the words can be loud.</h2>
          </Reveal>
          <dl className="mt-16 grid gap-10 sm:grid-cols-3">
            {[
              ["240", "gsm", "Combed cotton, heavy enough to hold its shape."],
              ["01", "fit", "Boxy, drop shoulder. One cut, every design."],
              ["TN", "made", "Cut and sewn in Tirupur."],
            ].map(([n, k, v], i) => (
              <Reveal key={k} delay={i * 0.08}>
                <div className="border-t border-line pt-6">
                  <dt className="flex items-end gap-3">
                    <DotText text={n} size={40} label="" />
                    <span className="t-eyebrow text-fg-2">{k}</span>
                  </dt>
                  <dd className="t-body mt-5 text-fg-2">{v}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section data-ground="red" className="px-5 py-24 md:py-32">
        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <div className="flex items-center gap-3">
              <DotText text="DROP 001" size={11} label="Drop 001" />
              <span className="t-eyebrow">Est. 2026</span>
            </div>
            <h2 className="t-display mt-6">Five tees. Five sentences.</h2>
          </Reveal>
          <ul className="mt-14 border-t border-fg/25">
            {products.map((p) => (
              <li key={p.slug} className="border-b border-fg/25">
                <Link
                  href={`/shop/${p.slug}`}
                  className="group flex items-center justify-between gap-6 py-6 md:py-8"
                >
                  <span className="flex items-center gap-5 md:gap-8">
                    <DotText text={p.index} size={14} label="" />
                    <span className="t-headline">{p.name}</span>
                  </span>
                  <span className="t-body hidden max-w-[30ch] text-right md:block">{p.tagline}</span>
                  <span
                    aria-hidden
                    className="t-title transition-transform duration-300 ease-sheet group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
