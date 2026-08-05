import { Wordmark } from "@/components/Wordmark";

/**
 * Phase 0 holding page.
 *
 * Deliberately not the hero — the aperture, the cursor rain and the
 * material cuts are Phase 1. This exists to prove the token layer
 * renders: paper background, ink wordmark, mono readout, and blue
 * used exactly once (§2: the blue is a scalpel, not a paint roller).
 */
export default function Home() {
  return (
    <main
      className="flex flex-col items-center justify-center gap-10 px-6"
      style={{ minHeight: "var(--vh)" }}
    >
      <p className="label flex items-center gap-2.5 text-mute">
        <span className="inline-block size-1.5 rounded-full bg-blue" aria-hidden />
        Phase 0 — foundation
      </p>

      {/* §9: a 4:1 mark, so it is capped by height as well as width.
          In landscape the 96vh term binds first and it scales down
          proportionally instead of letterboxing inside its own box. */}
      <Wordmark
        className="text-ink"
        style={{ width: "min(72vw, 620px, 96vh)" }}
      />

      <p className="mono text-readout text-mute tracking-[.16em]">
        TOKENS OK / MAT.10 / 28 KB
      </p>
    </main>
  );
}
