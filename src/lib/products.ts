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

  /* ─────────────────────────────────────────────────────────────────
     Three more pieces are planned. They have no artwork yet, so they
     are marked draft and render nowhere. §13: never promise something
     the system doesn't do — a grid padded with placeholders is a
     promise the drop can't keep.
     ───────────────────────────────────────────────────────────────── */
  {
    slug: "two",
    name: "TBC",
    tagline: "",
    price: 69_900,
    mrp: 120_000,
    theme: "paper",
    art: { front: "", back: "" },
    spec: [],
    body: "",
    variants: run("MRTX-002", [0, 0, 0, 0, 0]),
    alt: { front: "", back: "" },
    draft: true,
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
