import type { Paise } from "@/lib/money";

/**
 * ─────────────────────────────────────────────────────────────────
 *  PLACEHOLDER CATALOGUE
 *
 *  The names, prices and stock counts below are proposals, not facts.
 *  Everything here is designed to be swapped in one edit once the real
 *  catalogue exists. Nothing else in the codebase hardcodes a product.
 *
 *  Decisions worth challenging:
 *
 *  1. NAMES. Each tee is named after the material it is bound to,
 *     which keeps the shop and the hero speaking the same language.
 *     Deliberately avoids colliding with the ten FINISH names
 *     (CHISEL, CARVE, SIGNAL, …) so the HUD never reads ambiguously.
 *
 *  2. PRICES. Every tee sits below ₹2,500 on purpose. GST on apparel
 *     is 5% at or below ₹2,500 per piece and 18% above it — a tee at
 *     ₹2,600 inclusive nets you less than the same tee at ₹2,490.
 *     If you want to price above the line, jump well clear of it.
 *
 *  3. STOCK. These numbers live in the file for now, which means two
 *     people can buy the last unit in the same minute. Real atomic
 *     decrement needs the database — that is Phase 3.
 * ─────────────────────────────────────────────────────────────────
 */

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Variant = {
  size: Size;
  /** Units on hand. 0 renders struck through, never hidden (§14). */
  stock: number;
  sku: string;
};

export type Product = {
  slug: string;
  /** Display name. Sans, uppercase in the grid. */
  name: string;
  /** One line, lowercase, §13 voice. */
  tagline: string;
  /** GST-inclusive, in paise. */
  price: Paise;
  /** Which of the ten materials this product is made of (§6). */
  material: string;
  /** §13: material, weight, fit, origin. Facts, not adjectives. */
  spec: string[];
  /** Long copy. Lowercase, terse, never explains itself. */
  body: string;
  variants: Variant[];
  /** Real alt text describing the garment, never "image" (§11). */
  alt: string;
};

const runFull = (prefix: string, stock: number[]): Variant[] =>
  SIZES.map((size, i) => ({
    size,
    stock: stock[i] ?? 0,
    sku: `${prefix}-${size}`,
  }));

export const PRODUCTS: readonly Product[] = [
  {
    slug: "monolith",
    name: "MONOLITH",
    tagline: "cut into stone.",
    price: 189_000,
    material: "rock",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "garment dyed",
    ],
    body: "the heaviest thing we make that still moves. dyed after cutting, so the seams sit a shade darker than the body. it will fade. that is the point.",
    variants: runFull("MRTX-MON", [6, 14, 18, 11, 4]),
    alt: "Oversized boxy t-shirt in stone grey, drop shoulder, photographed flat",
  },
  {
    slug: "vein",
    name: "VEIN",
    tagline: "cut deep.",
    price: 189_000,
    material: "marble",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "reactive dyed",
    ],
    body: "off-white, but not clean. the print sits under the surface rather than on it, so it survives the wash better than it looks like it should.",
    variants: runFull("MRTX-VEI", [3, 9, 12, 8, 0]),
    alt: "Oversized boxy t-shirt in off-white with a marbled print, drop shoulder",
  },
  {
    slug: "orbit",
    name: "ORBIT",
    tagline: "additive. only ever brightens.",
    price: 219_000,
    material: "orbit",
    spec: [
      "260gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "pigment printed",
    ],
    body: "the darkest piece in the drop. printed light-on-dark in a single pass, which is why the edges are soft and not sharp. we tried it sharp. it looked worse.",
    variants: runFull("MRTX-ORB", [8, 16, 15, 9, 5]),
    alt: "Oversized boxy t-shirt in near-black with a pale print, drop shoulder",
  },
  {
    slug: "flux",
    name: "FLUX",
    tagline: "punched straight through.",
    price: 249_000,
    material: "flux",
    spec: [
      "260gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "discharge printed",
    ],
    body: "the only blue we use, and we use it once. discharge print removes the dye rather than adding ink, so the mark is the fabric, not something sitting on it.",
    variants: runFull("MRTX-FLX", [0, 4, 7, 3, 2]),
    alt: "Oversized boxy t-shirt with a blue discharge-printed mark, drop shoulder",
  },
] as const;

export const productBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug);

export const inStock = (p: Product): boolean =>
  p.variants.some((v) => v.stock > 0);

export const variantFor = (p: Product, size: Size): Variant | undefined =>
  p.variants.find((v) => v.size === size);

/** Free shipping at or above this, per §14 / the shipping policy. */
export const FREE_SHIPPING_THRESHOLD: Paise = 250_000;
/** Flat rate below the threshold. */
export const SHIPPING_FLAT: Paise = 9_000;
