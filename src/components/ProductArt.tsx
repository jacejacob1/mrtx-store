import type { Product } from "@/lib/products";

const WIDTHS = [640, 900, 1280] as const;

const src = (stem: string, w: number) => `/assets/products/${stem}-${w}.webp`;
const srcSet = (stem: string) =>
  WIDTHS.map((w) => `${src(stem, w)} ${w}w`).join(", ");

type Props = {
  product: Product;
  /** Product detail gets the hover sweep; the grid stays still (§14). */
  sweep?: boolean;
  sizes?: string;
  priority?: boolean;
};

/**
 * Product artwork — CLAUDE.md §14.
 *
 * "Aperture reinterpreted: on hover a slit sweeps once across the image
 * to reveal the alt shot." Here the alt shot is the back print, which
 * is the most useful thing a slit could reveal on a tee that is printed
 * both sides.
 *
 * The ground is baked into the files rather than supplied by CSS. The
 * artwork is white on transparency, so it only ever sits on ink — and
 * flattening it saved ~40% on files that are otherwise incompressible
 * stipple. Nothing is lost because there is no light-ground use for it.
 *
 * These are the PRINT ARTWORKS, not garment photographs. They show what
 * is on the tee, not what the tee looks like on a person. That is still
 * a gap and the photoshoot still closes it.
 */
export function ProductArt({
  product,
  sweep = false,
  sizes = "(min-width: 768px) 46vw, 92vw",
  priority = false,
}: Props) {
  return (
    <div
      className={`pmedia ${sweep ? "pmedia-sweep" : ""}`}
      style={{
        aspectRatio: "1280 / 1646",
        // Matches the ground baked into the files. ORIGIN's artwork is
        // white on transparency so it sits on ink; the rest are black
        // on transparency and sit on paper. Getting this wrong shows as
        // a hairline of the wrong colour around the image.
        background: product.theme === "ink" ? "#0B0B0D" : "#F2F2F0",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src(product.art.front, 900)}
        srcSet={srcSet(product.art.front)}
        sizes={sizes}
        alt={product.alt.front}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="absolute inset-0 size-full object-cover"
      />

      {sweep && (
        <div className="pslit" aria-hidden>
          <div className="pslit-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src(product.art.back, 900)}
              srcSet={srcSet(product.art.back)}
              sizes={sizes}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductArt;
