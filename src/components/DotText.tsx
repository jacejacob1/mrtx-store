import { layout, GLYPH_H } from "@/lib/dotfont";

type Props = {
  text: string;
  /** Rendered height of one glyph row-stack, in CSS px. Width follows. */
  size?: number;
  /** Draw the unpowered matrix behind the lit dots. */
  ghost?: boolean;
  /**
   * Power the dots on in a sweep when mounted. Pure CSS — each circle
   * gets its own animation-delay — so there is no JS, and under
   * prefers-reduced-motion every dot is simply on.
   */
  boot?: boolean;
  /** Total sweep duration in ms when booting. */
  bootMs?: number;
  className?: string;
  /** Screen-reader text. Defaults to `text`. Pass "" if decorative. */
  label?: string;
};

/**
 * Text drawn on the MRTX dot-matrix. For machine-ish things only:
 * indices, drop numbers, counts, short labels. Never for sentences —
 * nobody should have to read a paragraph of dots.
 */
export function DotText({
  text,
  size = 14,
  ghost = false,
  boot = false,
  bootMs = 700,
  className,
  label,
}: Props) {
  const { dots, cols } = layout(text);
  if (cols === 0) return null;

  // One cell is 1 unit; the dot fills 76% of it so the grid reads.
  const r = 0.38;
  const w = cols;
  const h = GLYPH_H;
  const px = size / h;

  const a11y =
    label === ""
      ? { "aria-hidden": true as const }
      : { role: "img" as const, "aria-label": label ?? text };

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={size}
      className={className}
      {...a11y}
      style={{ overflow: "visible", flexShrink: 0 }}
    >
      {dots.map((d, i) => {
        if (!d.on && !ghost) return null;
        const cx = d.x + 0.5;
        const cy = d.y + 0.5;
        if (!d.on) {
          return <circle key={i} cx={cx} cy={cy} r={r} className="dot-off" fill="currentColor" />;
        }
        // Sweep left to right with a little vertical jitter, so it reads
        // as a matrix powering up rather than a wipe.
        const delay = boot ? (d.x / w) * bootMs * 0.8 + ((d.y * 37) % 7) * 12 : 0;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="currentColor"
            className={boot ? "dot-boot" : undefined}
            style={boot ? { animationDelay: `${Math.round(delay)}ms` } : undefined}
          />
        );
      })}
    </svg>
  );
}

export default DotText;
