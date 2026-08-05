/**
 * The ten materials — CLAUDE.md §6.
 *
 * Nine cut from the launch film, one (marble) generated from layered
 * value noise. 28,048 bytes for all ten, verified after copying.
 *
 * Each is a 192px slice mirrored into a 384×152 tile, so it repeats
 * seamlessly at native resolution at any screen width. No upscaling,
 * no blur.
 *
 * Each material meets the wordmark through a DIFFERENT blend mode, so
 * the mark isn't sitting *on* the material — it's made of it.
 *
 * `contrast` is not an estimate. Each blend formula was composited
 * over the actual pixels of its own texture and the WCAG ratio of the
 * mark against the surrounding material was computed. §6 law 2: floor
 * is 3:1 for display type, 4.5:1 for anything smaller. Two original
 * picks (`overlay` on slab, `soft-light` on silk) measured 2.98 and
 * 1.34 and were replaced for that reason — do not reinstate them.
 */

export type Finish =
  | "CHISEL"
  | "CARVE"
  | "EMBOSS"
  | "SIGNAL"
  | "STARLIGHT"
  | "STAMP"
  | "KNOCKOUT"
  | "DEBOSS"
  | "INVERT"
  | "HALO";

export type Material = {
  /** Filename stem in /public/assets/tx/ */
  id: string;
  /** Human name, as read out in the HUD. */
  name: string;
  /** The finish label shown in the bottom-right HUD. */
  finish: Finish;
  /** CSS mix-blend-mode. `null` means the mark is punched straight through. */
  blend: React.CSSProperties["mixBlendMode"] | null;
  /** Representative hex, shown in the HUD readout. */
  hex: string;
  /** Whether the mark reads white (true) or ink (false) over this material. */
  light: boolean;
  /** Measured WCAG contrast of mark against material. Never eyeballed. */
  contrast: number;
  /** What the finish reads as, in plain language. */
  reads: string;
};

export const MATERIALS: readonly Material[] = [
  { id: "rock",   name: "moon rock",      finish: "CHISEL",    blend: "multiply",    hex: "#8C8C8C", light: true,  contrast: 5.3,  reads: "cut into stone" },
  { id: "marble", name: "grey marble",    finish: "CARVE",     blend: "color-burn",  hex: "#D8D8D6", light: true,  contrast: 4.2,  reads: "cut deep, veins sharpened" },
  { id: "slab",   name: "concrete slab",  finish: "EMBOSS",    blend: "color-dodge", hex: "#5E5E60", light: false, contrast: 4.9,  reads: "raised, lit from the front" },
  { id: "grid",   name: "blueprint grid", finish: "SIGNAL",    blend: "screen",      hex: "#2F6BEE", light: false, contrast: 4.7,  reads: "burning through" },
  { id: "orbit",  name: "low orbit",      finish: "STARLIGHT", blend: "lighten",     hex: "#0A1024", light: false, contrast: 4.1,  reads: "additive, only ever brightens" },
  { id: "ink",    name: "ink splatter",   finish: "STAMP",     blend: "darken",      hex: "#EDEDEB", light: true,  contrast: 8.1,  reads: "pressed into wet paper" },
  { id: "flux",   name: "flux",           finish: "KNOCKOUT",  blend: null,          hex: "#2563EB", light: false, contrast: 10.8, reads: "punched straight through" },
  { id: "silk",   name: "silk",           finish: "DEBOSS",    blend: "hard-light",  hex: "#E4E4E2", light: true,  contrast: 5.7,  reads: "pressed in, weave intact" },
  { id: "sphere", name: "sphere",         finish: "INVERT",    blend: "difference",  hex: "#14A34A", light: true,  contrast: 3.5,  reads: "the material's exact opposite" },
  { id: "grain",  name: "grain",          finish: "HALO",      blend: "luminosity",  hex: "#2563EB", light: false, contrast: 6.4,  reads: "same blue, lit" },
] as const;

/** §7: auto-advance every 2400ms. Faster is annoying, slower loses the
 *  stop-motion feel. Cuts are cuts — hard frame changes, never fades. */
export const CUT_INTERVAL_MS = 2400;

export const texturePath = (id: string) => `/assets/tx/${id}.webp`;

export const materialById = (id: string): Material | undefined =>
  MATERIALS.find((m) => m.id === id);
