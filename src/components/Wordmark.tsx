/**
 * The MRTX wordmark — a 20 × 5 pixel grid on a 7px module, traced from
 * the launch film. Inline SVG, recolourable with `currentColor`.
 * Never stretch, outline or rotate it.
 */
const PATH =
  "M0 0h7v7h-7zM26 0h7v7h-7zM40 0h22v7h-22zM74 0h29v7h-29zM109 0h8v7h-8z" +
  "M133 0h7v7h-7zM0 7h13v7h-13zM20 7h13v7h-13zM40 7h7v7h-7zM62 7h7v7h-7z" +
  "M85 7h7v7h-7zM115 7h7v7h-7zM128 7h7v7h-7zM0 14h7v7h-7zM13 14h7v7h-7z" +
  "M26 14h7v7h-7zM40 14h22v7h-22zM85 14h7v7h-7zM121 14h8v7h-8zM0 21h7v7h-7z" +
  "M26 21h7v7h-7zM40 21h7v7h-7zM55 21h7v7h-7zM85 21h7v7h-7zM115 21h7v7h-7z" +
  "M128 21h7v7h-7zM0 28h7v7h-7zM26 28h7v7h-7zM40 28h7v7h-7zM62 28h7v7h-7z" +
  "M85 28h7v7h-7zM109 28h8v7h-8zM133 28h7v7h-7z";

export function Wordmark({
  className,
  style,
  decorative = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 140 35"
      className={className}
      style={style}
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img" as const, "aria-label": "MRTX" })}
    >
      <path d={PATH} fill="currentColor" />
    </svg>
  );
}

export default Wordmark;
