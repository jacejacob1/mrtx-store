import { Hero } from "@/components/Hero";

/**
 * Home — CLAUDE.md §14.
 *
 * "Aperture hero at full effect. Below it, one drop, one lookbook
 * strip, nothing else. Resist adding sections."
 *
 * The drop and the lookbook strip both need a catalogue and product
 * photography, neither of which exists yet. Per §16, the quieter option
 * is to ship the hero alone rather than fill the space with
 * placeholders — so that is what this is. Those two sections go in when
 * there is something real to put in them.
 */
export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <Hero />
    </main>
  );
}
