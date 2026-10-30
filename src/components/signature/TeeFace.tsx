import type { Media } from "@/lib/media";

/**
 * One side of a tee, drawn — not photographed — so it can be any garment
 * colour, carry any uploaded print, and turn in 3D without a model.
 *
 * Boxy, drop shoulder, short sleeve: the MRTX cut. The front neckline
 * dips lower than the back, the way a real tee does, so you can tell
 * which side you're looking at even before the print reads.
 *
 * Shading is a soft vertical falloff plus a few fold shadows, mixed
 * toward black on light garments and toward white on the black one, so
 * the cloth reads as cloth on every colour.
 */

const NECK = { front: "Q 500 200 630 92", back: "Q 500 132 630 92" };
const BODY = (side: "front" | "back") =>
  `M 370 92 ${NECK[side]} L 800 140 L 968 398 L 846 470 L 790 424 L 796 1062 Q 500 1076 204 1062 L 210 424 L 154 470 L 32 398 L 200 140 Z`;

// Where the print sits: chest on the front, a bigger panel on the back.
const PRINT = {
  front: { x: 300, y: 236, w: 400, h: 514 },
  back: { x: 262, y: 196, w: 476, h: 612 },
};

function luma(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function TeeFace({
  side,
  hex,
  art,
  uid,
  className,
  label,
}: {
  side: "front" | "back";
  hex: string;
  art?: Media | null;
  /** Unique per instance on the page — SVG ids are global. */
  uid: string;
  className?: string;
  label?: string;
}) {
  const id = `${uid}-${side}`;
  // "dark" picks the shading colour (black and red both shade toward
  // white); "black" alone gets the screen blend — on red it would erase
  // black lettering, as SOLITUDE's collar print showed.
  const dark = luma(hex) < 90;
  const black = luma(hex) < 40;
  const shade = dark ? "#ffffff" : "#000000";
  const p = PRINT[side];

  return (
    <svg
      viewBox="0 0 1000 1100"
      className={className}
      {...(label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={BODY(side)} />
        </clipPath>
        <linearGradient id={`${id}-fall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade} stopOpacity={dark ? 0.07 : 0} />
          <stop offset="0.55" stopColor={shade} stopOpacity="0" />
          <stop offset="1" stopColor={shade} stopOpacity={dark ? 0 : 0.09} />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={dark ? 0.35 : 0.1} />
          <stop offset="0.18" stopColor="#000" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.35 : 0.1} />
        </linearGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <path d={BODY(side)} fill={hex} />

      {art && (
        // Outside the clipped group on purpose: a blend mode inside a
        // clipped group only sees the group, not the cloth under it.
        <image
          href={art.src}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          preserveAspectRatio="xMidYMid meet"
          // Some print files carry a solid black background. On a dark
          // garment, "screen" drops the black and keeps the ink — the
          // way the print actually sits on the cloth.
          style={black ? { mixBlendMode: "screen" } : undefined}
        />
      )}

      <g clipPath={`url(#${id}-clip)`}>
        {/* folds: the drag lines that fall from the underarm */}
        <g filter={`url(#${id}-soft)`} opacity={dark ? 0.35 : 0.22}>
          <path d="M 222 440 Q 300 520 262 640" stroke={shade} strokeOpacity="0.35" strokeWidth="26" fill="none" />
          <path d="M 778 440 Q 700 520 738 640" stroke={shade} strokeOpacity="0.35" strokeWidth="26" fill="none" />
        </g>
        <rect width="1000" height="1100" fill={`url(#${id}-fall)`} />
        <rect width="1000" height="1100" fill={`url(#${id}-side)`} />
      </g>

      {/* rib collar and seams */}
      <path
        d={`M 370 92 ${NECK[side]}`}
        fill="none"
        stroke={shade}
        strokeOpacity={dark ? 0.18 : 0.14}
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M 200 140 L 210 424 M 800 140 L 790 424"
        fill="none"
        stroke={shade}
        strokeOpacity="0.06"
        strokeWidth="3"
      />
    </svg>
  );
}

export default TeeFace;
