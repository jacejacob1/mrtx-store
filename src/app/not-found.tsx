import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { materialById, texturePath } from "@/lib/materials";

/**
 * 404 — CLAUDE.md §14: "Full aperture, static material, `no signal.` in
 * the tagline slot."
 *
 * Static rather than the live cursor-tracking band: §5 allows the full
 * effect here, but a page whose only job is to get you somewhere else
 * shouldn't ask you to play with it. Per §16, the quieter option.
 * SIGNAL is the finish, which is the joke.
 */
export default function NotFound() {
  const m = materialById("grid");

  return (
    <div
      className="relative grid place-items-center overflow-hidden px-6"
      style={{ minHeight: "calc(var(--vh) - 57px)" }}
    >
      {m && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 -translate-y-1/2"
          style={{
            height: "clamp(96px, 19vh, 168px)",
            backgroundImage: `url(${texturePath(m.id)})`,
            backgroundSize: "384px 152px",
            backgroundRepeat: "repeat",
            isolation: "isolate",
          }}
        />
      )}

      <div className="relative flex flex-col items-center gap-8 text-center">
        <Wordmark
          className="text-ink"
          style={{ width: "min(58vw, 420px, 62vh)" }}
        />
        <p className="text-[15px] text-ink">no signal.</p>
        <Link
          href="/"
          className="mono border-b-2 border-blue pb-1 text-[15px] tracking-[.14em] text-ink uppercase"
        >
          back
        </Link>
      </div>
    </div>
  );
}
