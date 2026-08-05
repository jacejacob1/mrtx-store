import { Wordmark } from "@/components/Wordmark";
import { CountdownView, type Parts } from "@/components/Countdown";
import type { Material } from "@/lib/materials";

type Props = {
  material: Material;
  index: number;
  parts: Parts;
  /**
   * `base` is the page itself — ink on paper.
   * `lit` is the copy inside the aperture, where the mark is made of
   * the material via that material's blend mode.
   */
  variant: "base" | "lit";
};

/**
 * The hero, rendered twice.
 *
 * §5: behind the slit sits a second, pixel-identical copy of the page
 * in a different colour. The slit doesn't *cover* the artwork — it
 * *develops* it, one strip at a time. Both copies sit at the same
 * coordinates; the band's overflow does the rest.
 *
 * The reference build clones this with `cloneNode(true)`, then has to
 * strip every `id` and re-set every `tabIndex` afterwards or screen
 * readers announce the page twice and duplicate form fields fight for
 * focus. Rendering the component twice sidesteps that: the lit copy
 * never receives an id in the first place, and `inert` handles focus.
 */
export function HeroPlane({ material, index, parts, variant }: Props) {
  const lit = variant === "lit";

  // In the lit copy every element inherits the plane's colour, which is
  // white or ink depending on the material (§6). In the base copy the
  // page uses its normal tokens.
  const tone = lit ? "currentColor" : undefined;

  return (
    <div
      className="pointer-events-none absolute inset-0 grid place-items-center px-6"
      style={{ height: "var(--vh)" }}
      // §5 + §11: the duplicate copy carries inert and aria-hidden, or
      // the page is announced twice.
      {...(lit ? { inert: true, "aria-hidden": true } : {})}
    >
      <div className="flex w-full flex-col items-center gap-[clamp(18px,3.4vh,34px)]">
        <p
          className="label flex items-center gap-2.5"
          style={{ color: tone ?? "var(--color-mute)" }}
        >
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: tone ?? "var(--color-blue)" }}
            aria-hidden
          />
          IDX 001 / SS26
        </p>

        {/* §9: a 4:1 mark, capped by height as well as width so it
            scales proportionally in landscape instead of letterboxing
            inside its own box. */}
        <Wordmark
          decorative={lit}
          className="mrtx-mark"
          style={{ width: "min(72vw, 620px, 96vh)" }}
        />

        <p
          className="text-center"
          style={{
            fontSize: "clamp(13px, 1.5vw, 17px)",
            color: tone ?? "var(--color-ink)",
          }}
        >
          <i className="not-italic opacity-55">opening </i>
          <b className="tracking-[.18em] uppercase">the club</b>
          <i className="not-italic opacity-55"> soon</i>
        </p>

        {/* §6 law 1: finishes apply to display type only — never to
            body copy, labels, prices or HUD. Small type stays solid. */}
        <CountdownView
          parts={parts}
          className={lit ? undefined : "text-mute"}
        />
      </div>

      <p
        className="label absolute"
        style={{
          color: tone ?? "var(--color-mute)",
          right: "max(16px, env(safe-area-inset-right))",
          bottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        MAT.{String(index + 1).padStart(2, "0")} {material.finish}{" "}
        {material.hex}
      </p>
    </div>
  );
}

export default HeroPlane;
