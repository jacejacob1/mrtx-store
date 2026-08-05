import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { materialById, texturePath } from "@/lib/materials";

export const metadata: Metadata = {
  title: "About",
  description: "MRTX CLUB. A design brand like nothing.",
};

/**
 * About — CLAUDE.md §14.
 *
 * "Long-form, single column, max-width: 62ch. Body sans, pull-quotes in
 * the display treatment. One material band as a divider."
 *
 * ─────────────────────────────────────────────────────────────────
 *  PLACEHOLDER COPY. Jace is supplying the real brand story. Every
 *  paragraph below is written in §13 voice — lowercase, terse, facts
 *  not adjectives — so the replacement has a shape to slot into, but
 *  none of it is a claim MRTX has actually made. Read it as layout,
 *  not as content.
 * ─────────────────────────────────────────────────────────────────
 */

const DIVIDER_MATERIAL = "ink";

export default function AboutPage() {
  const m = materialById(DIVIDER_MATERIAL);

  return (
    <div>
      <div className="mx-auto max-w-[1180px] px-5 py-14">
        <p className="label text-mute">ABOUT</p>
        <h1
          className="mt-3 max-w-[16ch] text-ink"
          style={{ fontSize: "var(--text-page)", lineHeight: 1.05 }}
        >
          a design brand like nothing.
        </h1>
      </div>

      {/* §14: one material band as a divider. §6: never behind body
          copy — so it sits between sections, carrying only the mark. */}
      {m && (
        <div
          className="relative grid place-items-center overflow-hidden"
          style={{
            height: "clamp(160px, 26vh, 280px)",
            backgroundImage: `url(${texturePath(m.id)})`,
            backgroundSize: "384px 152px",
            backgroundRepeat: "repeat",
            isolation: "isolate",
            color: m.light ? "var(--color-white)" : "var(--color-ink)",
          }}
          aria-hidden
        >
          <Wordmark
            decorative
            className="pmedia-mark"
            style={{
              width: "min(38vw, 300px)",
              ["--finish" as string]: m.blend ?? "normal",
            }}
          />
        </div>
      )}

      <article className="mx-auto max-w-[62ch] px-5 py-16">
        <p className="label text-mute">PLACEHOLDER — AWAITING REAL COPY</p>

        <div className="mt-8 space-y-6 text-[16px] leading-[1.7] text-ink">
          <p>
            mrtx club started as a film. a slit moving across a surface,
            one material at a time, the mark locked in the centre. the
            clothes came after, and they were made to the same rule:
            one idea, executed exactly, nothing added.
          </p>

          <p>
            everything is cut and sewn in tirupur. 240 to 260gsm combed
            cotton, boxy, drop shoulder. we make four pieces at a time
            because four is what we can check by hand.
          </p>
        </div>

        <blockquote
          className="my-12 border-l-2 border-blue pl-6 text-ink"
          style={{ fontSize: "var(--text-section)", lineHeight: 1.25 }}
        >
          materials seen through an aperture.
        </blockquote>

        <div className="space-y-6 text-[16px] leading-[1.7] text-ink">
          <p>
            the ten materials in the lookbook are the brand&apos;s world.
            nine were cut from the launch film frame by frame. the tenth,
            the marble, isn&apos;t in the footage at all — it&apos;s built
            from layered noise, because the shot we wanted never existed.
          </p>

          <p>
            we don&apos;t restock. when a size is gone it stays gone, and
            the next drop is a different set of four.
          </p>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="label text-mute">CONTACT</p>
          <p className="mono mt-3 text-readout text-ink">
            hello@mrtx.club
          </p>
        </div>
      </article>
    </div>
  );
}
