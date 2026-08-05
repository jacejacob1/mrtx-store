import { Wordmark } from "@/components/Wordmark";
import { materialById, texturePath } from "@/lib/materials";

type Props = {
  materialId: string;
  /** Real alt text describing the garment, never "image" (§11). */
  alt: string;
  /** Product detail gets the hover sweep; the grid stays still (§14). */
  sweep?: boolean;
  className?: string;
  priority?: boolean;
};

/**
 * Product media — CLAUDE.md §6 and §14.
 *
 * There is no product photography yet. Rather than ship grey boxes,
 * each product is rendered as the material it is bound to, with the
 * mark in that material's finish — which is what §6 says the materials
 * are for: "shoot or composite garments against these materials. They
 * are the brand's world."
 *
 * When real photographs arrive this component is the only thing that
 * changes. Nothing else in the shop knows how a product is depicted.
 *
 * §14: on the product page a slit sweeps once across on hover to
 * reveal the alt view. In the grid it is static — "no hover-zoom",
 * and by extension no motion competing with a calm grid.
 *
 * The sweep is two counter-translated layers, exactly like the hero
 * aperture (§5), so it composites rather than repaints. The inner
 * percentages are the arithmetic inverse of the outer ones — see
 * globals.css.
 */
export function ProductMedia({
  materialId,
  alt,
  sweep = false,
  className,
}: Props) {
  const m = materialById(materialId);
  if (!m) return null;

  const tex = texturePath(m.id);
  const markTone = m.light ? "var(--color-white)" : "var(--color-ink)";
  const altTone = m.light ? "var(--color-ink)" : "var(--color-white)";

  return (
    <div
      className={`pmedia ${sweep ? "pmedia-sweep" : ""} ${className ?? ""}`}
      role="img"
      aria-label={alt}
    >
      <div className="pmedia-layer" style={{ color: markTone }}>
        <div
          className="pmedia-tex"
          style={{ backgroundImage: `url(${tex})` }}
          aria-hidden
        />
        <Wordmark
          decorative
          className="pmedia-mark"
          style={{ ["--finish" as string]: m.blend ?? "normal" }}
        />
      </div>

      {sweep && (
        <div className="pslit" aria-hidden>
          <div className="pslit-inner">
            <div className="pmedia-layer" style={{ color: altTone }}>
              <div
                className="pmedia-tex pmedia-tex-alt"
                style={{ backgroundImage: `url(${tex})` }}
              />
              <Wordmark
                decorative
                className="pmedia-mark"
                style={{ ["--finish" as string]: "normal" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductMedia;
