/**
 * Home hero frames — the match cut.
 *
 * Eight 2560 × 2560 masters, each with the MRTX wordmark baked in at
 * exactly 512 px centred on (1280, 1280). Because the mark sits at the
 * dead centre of a square master and the hero uses `object-fit: cover`
 * with `object-position: center`, the mark lands on the same screen
 * pixels at every viewport aspect — so cutting between frames moves the
 * world and leaves the mark completely still. That is the whole trick.
 *
 * The delivered files were within ~16 px of centre and varied 480–500 px
 * in mark width. 16 px on a 2560 master is ~9 px on a desktop, which
 * reads as a twitch on a hard cut, so every frame was re-scaled and
 * re-centred to land the mark on 512 px at (1280, 1280) exactly.
 * Measured by template-matching the actual 20 × 5 wordmark grid, not by
 * eye. See _design/FRAME-SPEC.md.
 *
 * `tone` is which colour the HUD readouts must be over this frame, and
 * `worst` is the measured worst-case WCAG contrast of that colour
 * against the brightest 10% of the corner regions the readouts occupy.
 * Frames below 4.5:1 are why the scrim exists — see .hero-scrim in
 * globals.css, whose alpha was solved for rather than chosen.
 */

export type Frame = {
  id: string;
  /** Real alt text describing the image, never "image" (§11). */
  alt: string;
  /** Which colour the HUD must be over this frame. */
  tone: "white" | "ink";
  /** Measured worst-case contrast for that tone, unaided. */
  worst: number;
};

export const FRAMES: readonly Frame[] = [
  { id: "card",     tone: "white", worst: 3.23, alt: "A blue MRTX card set into a recess in cast concrete" },
  { id: "earth",    tone: "white", worst: 5.10, alt: "Earth seen from orbit at night, city lights along the terminator" },
  { id: "tote",     tone: "white", worst: 13.97, alt: "A blue MRTX tote bag carried against black workwear" },
  { id: "glass",    tone: "white", worst: 2.49, alt: "A clear glass panel embossed with the MRTX mark, held in black gloves" },
  { id: "portrait", tone: "white", worst: 6.19, alt: "A profile portrait in silhouette against a blue field" },
  { id: "stone",    tone: "white", worst: 10.86, alt: "The MRTX mark chiselled into the flat face of a split stone" },
  { id: "icon",     tone: "white", worst: 19.03, alt: "A blue MRTX app icon on a phone home screen" },
  { id: "field",    tone: "white", worst: 3.15, alt: "A blue gradient field crossed by faint grid lines" },
] as const;

/** §7 / Jace: hard cut every 2.5s. Never a crossfade. */
export const CUT_MS = 2500;

const WIDTHS = [640, 1024, 1600, 2560] as const;

export const frameSrc = (id: string, w: number) =>
  `/assets/frames/${id}-${w}.webp`;

export const frameSrcSet = (id: string) =>
  WIDTHS.map((w) => `${frameSrc(id, w)} ${w}w`).join(", ");

/**
 * The master is square and cover-fitted, so the rendered image is as
 * wide as the LONGER viewport axis — on a tall phone the image is much
 * wider than the viewport. `100vw` would under-fetch and the mark would
 * render soft; max() asks for the right one.
 */
export const FRAME_SIZES = "max(100vw, 100vh)";
