import type { Paise } from "@/lib/money";

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type Variant = {
  size: Size;
  /** Units on hand. 0 renders struck through, never hidden (§14). */
  stock: number;
  sku: string;
};

/**
 * Each design gets its own world — the direction Jace chose over one
 * shared template. `theme` is the mechanism: `ink` inverts the page to
 * the §2 dark column so the product page speaks the garment's own
 * language.
 *
 * This is not decoration. ORIGIN's artwork is white on transparency; on
 * paper the type simply disappears. The theme is a requirement of the
 * artwork, not a preference.
 */
export type Theme = "paper" | "ink";

export type Product = {
  slug: string;
  name: string;
  /** The line that the design is about. Sits under the name. */
  tagline: string;
  /** What the customer pays, GST-inclusive, in paise. */
  price: Paise;
  /** Struck-through reference price. null when there is no offer. */
  mrp: Paise | null;
  theme: Theme;
  /** Artwork stems in /public/assets/products/. */
  art: { front: string; back: string };
  /** §13: material, weight, fit, origin. Facts, not adjectives. */
  spec: string[];
  body: string;
  variants: Variant[];
  alt: { front: string; back: string };
  /** Not shown anywhere until the design exists. */
  draft?: boolean;
};

const run = (prefix: string, stock: number[]): Variant[] =>
  SIZES.map((size, i) => ({
    size,
    stock: stock[i] ?? 0,
    sku: `${prefix}-${size}`,
  }));

export const PRODUCTS: readonly Product[] = [
  {
    slug: "origin",
    name: "ORIGIN",
    tagline: "remember why you started.",
    // Launch offer. ₹699 from ₹1,200 MRP — both well under the ₹2,500
    // GST threshold, so 5% applies either way and the discount costs no
    // margin to tax.
    price: 69_900,
    mrp: 120_000,
    theme: "ink",
    art: { front: "origin-front", back: "origin-back" },
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "discharge printed, front and back",
    ],
    body: "the first one. a face coming apart into dots, and four words that are either encouragement or an accusation depending on the day you read them. printed front and back — the front says it, the back only remembers.",
    variants: run("MRTX-ORG", [8, 18, 22, 14, 6]),
    alt: {
      front:
        "Front print: stippled portrait dissolving into dots beside the words remember why you started, and EST. 2026",
      back: "Back print: the same stippled portrait with the word remember set in a rule box",
    },
  },

  {
    slug: "breathe",
    name: "BREATHE",
    tagline: "let go.",
    price: 69_900,
    mrp: 120_000,
    theme: "paper",
    art: { front: "breathe-front", back: "breathe-back" },
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "discharge printed, front and back",
    ],
    body: "a lily, and one word set small enough that you have to be close to read it. the back says it loud instead — the same word at the size of the whole garment, hollowed out so the flower sits inside the letters.",
    variants: run("MRTX-BRT", [6, 16, 20, 12, 5]),
    alt: {
      front:
        "Front print: a greyscale lily with the word breathe set small in outlined type",
      back: "Back print: BREATHE in tall hollow capitals with a pale blue lily rising through the letters",
    },
  },
  {
    slug: "fly-high",
    name: "FLY HIGH",
    tagline: "no bird soars too high.",
    price: 69_900,
    mrp: 120_000,
    theme: "paper",
    art: { front: "fly-high-front", back: "fly-high-back" },
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "discharge printed, front and back",
    ],
    body: "the loudest thing we make. FLY across the chest in red, birds breaking around it. the back is quieter and higher up — one eagle, and HIGH where you'd expect a label.",
    variants: run("MRTX-FLY", [7, 17, 21, 13, 5]),
    alt: {
      front:
        "Front print: FLY in large red capitals over a flock of birds in flight",
      back: "Back print: an eagle in flight with HIGH set in red at the shoulder",
    },
  },
  {
    slug: "solitude",
    name: "SOLITUDE",
    tagline: "own lane. own race. own pace.",
    price: 69_900,
    mrp: 120_000,
    theme: "paper",
    art: { front: "solitude-front", back: "solitude-back" },
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "discharge printed, front and back",
    ],
    body: "a white tiger with its stripes in red, walking out of the frame. three lines above it that are a instruction, not a boast. the back carries the word alone, curved, small, across the shoulders.",
    variants: run("MRTX-SOL", [6, 15, 19, 12, 4]),
    alt: {
      front:
        "Front print: a white tiger with red stripes below the words own lane, own race, own pace",
      back: "Back print: SOLITUDE set in a shallow arc across the shoulders",
    },
  },
  {
    slug: "be-yourself",
    name: "BE YOURSELF",
    tagline: "everyone else is taken.",
    price: 69_900,
    mrp: 120_000,
    theme: "paper",
    art: { front: "be-yourself-front", back: "be-yourself-back" },
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "discharge printed, front and back",
    ],
    body: "the quietest front we make — just the mark, small, on the chest. everything is on the back: script and serif stacked into a block you can read across a room.",
    variants: run("MRTX-BYS", [5, 14, 18, 11, 4]),
    alt: {
      front: "Front print: the MRTX mark set small at the chest",
      back: "Back print: Be yourself, everyone else is taken set in mixed script and serif above the MRTX mark",
    },
  },
] as const;

/** Everything that should actually appear on the site. */
export const LIVE: readonly Product[] = PRODUCTS.filter((p) => !p.draft);

export const productBySlug = (slug: string): Product | undefined =>
  LIVE.find((p) => p.slug === slug);

export const inStock = (p: Product): boolean =>
  p.variants.some((v) => v.stock > 0);

export const variantFor = (p: Product, size: Size): Variant | undefined =>
  p.variants.find((v) => v.size === size);

/** Free shipping at or above this. */
export const FREE_SHIPPING_THRESHOLD: Paise = 100_000;
/** Flat rate below the threshold. */
export const SHIPPING_FLAT: Paise = 9_000;
