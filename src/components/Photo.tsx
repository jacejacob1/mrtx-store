import Image from "next/image";
import { shoot, art, type MediaEntry } from "@/lib/media";

type Props = {
  /** A shoot id ("0119") or an artwork key ("remember-back"). */
  id: string;
  kind?: "shoot" | "art";
  /** Real alt text describing what's in the frame — never "image". */
  alt: string;
  /** What fraction of the viewport this renders at. Drives srcset. */
  sizes: string;
  /** Fill the positioned parent instead of sizing intrinsically. */
  fill?: boolean;
  /** Above the fold — load now, at high priority. */
  eager?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Every photograph on the site goes through here.
 *
 * Reads dimensions and a 16px blur placeholder from media.json, so the
 * layout never jumps and every image fades in from its own colours
 * rather than from grey. If `npm run media` hasn't produced an entry,
 * it renders a quiet surface instead of crashing the build — a missing
 * photo should be visible, not fatal.
 */
export function Photo({
  id,
  kind = "shoot",
  alt,
  sizes,
  fill = false,
  eager = false,
  className,
  style,
}: Props) {
  const entry: MediaEntry | null = kind === "art" ? art(id) : shoot(id);

  if (!entry) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-surface ${fill ? "absolute inset-0" : "aspect-[4/5] w-full"} ${className ?? ""}`}
        style={style}
        data-missing-media={id}
      />
    );
  }

  const common = {
    src: entry.src,
    alt,
    sizes,
    placeholder: "blur" as const,
    blurDataURL: entry.blur,
    loading: eager ? ("eager" as const) : ("lazy" as const),
    fetchPriority: eager ? ("high" as const) : ("auto" as const),
    className,
    style,
  };

  return fill ? (
    <Image {...common} alt={alt} fill />
  ) : (
    <Image {...common} alt={alt} width={entry.w} height={entry.h} />
  );
}

export default Photo;
