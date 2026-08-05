import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { MATERIALS, texturePath } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Ten materials. SS26.",
};

/**
 * Lookbook — CLAUDE.md §14.
 *
 * "The most expressive surface. Materials as full-bleed backgrounds,
 * editorial images floated over them, minimal captions in mono. This is
 * where the system gets to breathe."
 *
 * There is no editorial photography yet, so this is the materials
 * alone — full-bleed bands, each meeting the mark through its own
 * finish, with the measured contrast stated in the caption. When
 * photographs arrive they float on top of these bands; nothing here
 * has to change.
 *
 * §6 law 1: finishes apply to display type only. Every caption is
 * solid, never blended.
 */
export default function LookbookPage() {
  return (
    <div>
      <header className="mx-auto max-w-[1180px] px-5 py-14">
        <p className="label text-mute">SS26 / TEN MATERIALS</p>
        <h1
          className="mt-3 text-ink"
          style={{ fontSize: "var(--text-page)", lineHeight: 1.05 }}
        >
          lookbook
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] text-ink">
          nine cut from the launch film, one built from noise. each one
          meets the mark through a different blend, so the mark isn&apos;t
          sitting on the material — it&apos;s made of it.
        </p>
      </header>

      <div>
        {MATERIALS.map((m, i) => (
          <section key={m.id} aria-label={`${m.name}, ${m.finish} finish`}>
            <div
              className="relative grid place-items-center overflow-hidden"
              style={{
                height: "clamp(240px, 46vh, 460px)",
                // §6: 384x152 tiles repeat seamlessly at native
                // resolution at any width. Never resize them.
                backgroundImage: `url(${texturePath(m.id)})`,
                backgroundSize: "384px 152px",
                backgroundRepeat: "repeat",
                // §12: the mark blends only within its own isolated
                // group, so the group is this band.
                isolation: "isolate",
                color: m.light ? "var(--color-white)" : "var(--color-ink)",
              }}
            >
              <Wordmark
                decorative
                className="pmedia-mark"
                style={{
                  width: "min(46vw, 380px)",
                  ["--finish" as string]: m.blend ?? "normal",
                }}
              />
            </div>

            <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-4">
              <p className="label text-mute">
                MAT.{String(i + 1).padStart(2, "0")} {m.name}
              </p>
              <p className="label text-mute">
                {m.finish} / {m.blend ?? "none"} / {m.contrast.toFixed(1)}:1
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
