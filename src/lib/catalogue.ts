import type { Paise } from "@/lib/money";

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

/**
 * Which section ground a product lives on. Chosen by the colour of the
 * garment it is printed on, because the page should feel like the tee:
 * REMEMBER is printed on black, SOLITUDE on red, the rest on white.
 */
export type Ground = "dark" | "light" | "red";

export type Product = {
  slug: string;
  /** Dot-matrix index, shown wherever the product is listed. */
  index: string;
  name: string;
  /** The sentence the design is about. */
  tagline: string;
  /** Garment colour as worn — also what the artwork swatch sits on. */
  garment: { name: string; hex: string };
  ground: Ground;
  price: Paise;
  mrp: Paise | null;
  /** Keys into media.json → art. Either side may be missing. */
  art: { front?: string; back?: string };
  /**
   * Shoot photo ids, best first. The first is the cover in listings,
   * the second is what a card shows on hover. Assigned by looking at
   * the photographs, not by filename.
   */
  photos: string[];
  /** The single frame that tells this design's story best. */
  chapter: string;
  /** §13 voice: material, weight, fit, origin. Facts, not adjectives. */
  spec: string[];
  body: string;
  stock: Record<Size, number>;
  sku: string;
};

// Festive offer: ₹1,299 MRP slashed to ₹699. Both far below the ₹2,500
// GST line, so 5% applies either way and the discount costs no tax margin.
const price = 69_900; // ₹699
const mrp = 129_900; // ₹1,299

/** Shown beside the struck MRP wherever the offer is mentioned. */
export const OFFER_LABEL = "Festive offer";

export const PRODUCTS: readonly Product[] = [
  {
    slug: "remember",
    index: "001",
    name: "REMEMBER",
    tagline: "remember why you started.",
    garment: { name: "black", hex: "#0b0b0d" },
    ground: "dark",
    price,
    mrp,
    art: { front: "remember-front", back: "remember-back" },
    photos: ["0119", "0149", "0191", "0023", "0124", "0012"],
    chapter: "0119",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "printed front, back and side seam",
    ],
    body: "the first one. a face coming apart into dots, running down the side seam. the chest says one word in a box; the back finishes the sentence.",
    stock: { S: 8, M: 18, L: 22, XL: 14, XXL: 6 },
    sku: "MRTX-RMB",
  },
  {
    slug: "breathe",
    index: "002",
    name: "BREATHE",
    tagline: "let go.",
    garment: { name: "white", hex: "#f4f3ef" },
    ground: "light",
    price,
    mrp,
    art: { front: "breathe-front", back: "breathe-back" },
    photos: ["9707", "0200", "9666", "0220", "9659", "0237"],
    chapter: "0237",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "printed front and back",
    ],
    body: "a lily, and one word set small enough that you have to be close to read it. the back says it loud — the word as tall as the garment, the flower growing through it.",
    stock: { S: 6, M: 16, L: 20, XL: 12, XXL: 5 },
    sku: "MRTX-BRT",
  },
  {
    slug: "fly-high",
    index: "003",
    name: "FLY HIGH",
    tagline: "no bird soars too high.",
    garment: { name: "white", hex: "#f4f3ef" },
    ground: "light",
    price,
    mrp,
    art: { front: "fly-high-front", back: "fly-high-back" },
    photos: ["0317", "0287", "0069", "0303", "0294", "0012"],
    chapter: "0317",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "printed front and back",
    ],
    body: "the loudest back we make. FLY in red, birds breaking around it. the front stays quiet — one eagle and HIGH, small, where a logo would sit.",
    stock: { S: 7, M: 17, L: 21, XL: 13, XXL: 5 },
    sku: "MRTX-FLY",
  },
  {
    slug: "solitude",
    index: "004",
    name: "SOLITUDE",
    tagline: "own lane. own race. own pace.",
    garment: { name: "red", hex: "#e3201b" },
    ground: "red",
    price,
    mrp,
    art: { front: "solitude-front", back: "solitude-back" },
    photos: ["9754", "0263", "9895", "0271"],
    chapter: "9895",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "printed collar and back",
    ],
    body: "the word curved around the collar like a necklace. on the back, a white tiger with red stripes walking out of the frame, under three lines that are an instruction, not a boast.",
    stock: { S: 6, M: 15, L: 19, XL: 12, XXL: 4 },
    sku: "MRTX-SOL",
  },
  {
    slug: "be-yourself",
    index: "005",
    name: "BE YOURSELF",
    tagline: "everyone else is taken.",
    garment: { name: "white", hex: "#f4f3ef" },
    ground: "light",
    price,
    mrp,
    art: { front: "be-yourself-front", back: "be-yourself-back" },
    photos: ["0253", "0251"],
    chapter: "0253",
    spec: [
      "240gsm combed cotton",
      "boxy, drop shoulder",
      "cut and sewn in tirupur",
      "printed front and back",
    ],
    body: "the front is only the mark — MRTX in pixels, where a pocket would be. the back is the sentence, half script and half serif, with the fine print underneath.",
    // Placeholder counts, like the others — the real numbers live in the database once it's seeded.
    stock: { S: 6, M: 15, L: 18, XL: 12, XXL: 4 },
    sku: "MRTX-BYS",
  },
];

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const skuFor = (p: Product, size: Size) => `${p.sku}-${size}`;
export const inStock = (p: Product) => SIZES.some((s) => p.stock[s] > 0);

/**
 * Which design each shoot frame shows, tagged by looking at the photos.
 * Untagged frames still appear in the gallery, just without a product
 * link. 0012 shows REMEMBER and FLY HIGH together; it's filed under the
 * one in front.
 */
export const SHOOT_TAGS: Record<string, string> = {
  "0012": "remember", "0023": "remember", "0034-1": "remember", "0119": "remember",
  "0124": "remember", "0127": "remember", "0132": "remember", "0135": "remember",
  "0139": "remember", "0149": "remember", "0161": "remember", "0168": "remember",
  "0191": "remember",
  "0069": "fly-high", "0287": "fly-high", "0294": "fly-high", "0303": "fly-high",
  "0317": "fly-high",
  "0200": "breathe", "0220": "breathe", "0237": "breathe", "9659": "breathe",
  "9666": "breathe", "9707": "breathe",
  "0263": "solitude", "0271": "solitude", "9754": "solitude", "9895": "solitude",
  "0251": "be-yourself", "0253": "be-yourself",
};

/** Exact duplicates of another frame — kept on disk, left out of the gallery. */
export const HIDDEN_SHOOTS = new Set(["0161-2", "0168-2"]);

/** Free shipping at or above this. */
export const FREE_SHIPPING_AT: Paise = 100_000;
export const SHIPPING_FLAT: Paise = 9_000;

/**
 * Extra charged for cash on delivery. ₹0 until decided — couriers bill
 * a COD handling charge per parcel, so many brands pass on ₹30–50.
 */
export const COD_FEE: Paise = 0;

/** Days after delivery a refund can be requested. No exchanges. */
export const RETURN_DAYS = 7;
