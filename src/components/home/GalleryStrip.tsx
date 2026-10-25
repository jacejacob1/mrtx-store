import Link from "next/link";
import { Photo } from "@/components/Photo";
import { DotText } from "@/components/DotText";
import { allShoots } from "@/lib/media";
import { HIDDEN_SHOOTS } from "@/lib/catalogue";

/**
 * A slow river of the shoot. Two identical copies side by side, the
 * whole track translating -50% on a loop, so the seam is invisible.
 * Pauses on hover. Under reduced motion it stops and becomes an
 * ordinary horizontal scroller.
 *
 * Pure CSS: this is decoration and should cost no JavaScript at all.
 */
const FRAMES = ["9659", "0119", "9895", "0294", "9707", "0012", "0237", "9754", "0317"];

export function GalleryStrip() {
  const row = (hidden: boolean) =>
    FRAMES.map((id) => (
      <li key={`${hidden ? "b" : "a"}-${id}`} className="mr-4 shrink-0" aria-hidden={hidden || undefined}>
        <Photo
          id={id}
          alt={hidden ? "" : "From the MRTX SS26 shoot"}
          sizes="(min-width: 768px) 340px, 240px"
          className="h-[300px] w-auto rounded-[22px] object-cover md:h-[420px]"
        />
      </li>
    ));

  // Counted from the manifest, never typed in — the folder will grow.
  const count = allShoots().filter((id) => !HIDDEN_SHOOTS.has(id)).length;

  return (
    <section data-ground="dark" className="relative z-10 overflow-hidden py-24 md:py-32" aria-labelledby="gal-h">
      <div className="mx-auto flex max-w-[1240px] items-end justify-between gap-6 px-5">
        <div>
          {count > 0 && (
            <div className="flex items-center gap-2.5 text-fg-2">
              <DotText text={`${count} FRAMES`} size={10} label={`${count} frames`} />
            </div>
          )}
          <h2 id="gal-h" className="t-display mt-3">
            From the shoot.
          </h2>
        </div>
        <Link href="/gallery" className="t-body hidden text-accent underline-offset-4 hover:underline md:inline">
          Open the gallery
        </Link>
      </div>

      <div className="marquee-host no-scrollbar mt-14 overflow-x-auto">
        <ul className="marquee" style={{ ["--marquee-duration" as string]: "80s" }}>
          {row(false)}
          {row(true)}
        </ul>
      </div>

      <div className="mx-auto mt-10 max-w-[1240px] px-5 md:hidden">
        <Link href="/gallery" className="t-body text-accent">
          Open the gallery
        </Link>
      </div>
    </section>
  );
}

export default GalleryStrip;
