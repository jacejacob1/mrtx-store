import { GST } from "@/lib/config";

/**
 * Money is stored in PAISE as integers, never rupees as floats.
 *
 * `0.1 + 0.2 !== 0.3`. A cart that adds three items and shows
 * ₹5,669.999999 once is a cart nobody trusts again. Integer paise
 * everywhere; convert to rupees only at the moment of display.
 */
export type Paise = number;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** ₹1,890 — no decimals, because every price here is a whole rupee. */
export function formatINR(paise: Paise): string {
  return inr.format(Math.round(paise / 100));
}

/**
 * GST split on a GST-INCLUSIVE price — see CLAUDE.md notes and
 * src/lib/config.ts.
 *
 *   ≤ ₹2,500 per piece  →   5%
 *   > ₹2,500 per piece  →  18%
 *
 * The threshold is tested against the inclusive price shown to the
 * customer. Whether the law tests the inclusive figure or the
 * backed-out taxable value is a question for a CA — it only bites for
 * prices in the ₹2,500–₹2,950 band, and every current product sits
 * below that deliberately. I am not a tax adviser.
 */
export type GstSplit = {
  /** What the customer pays. */
  gross: Paise;
  /** Ex-GST value that appears on the invoice. */
  taxable: Paise;
  /** Tax amount. */
  tax: Paise;
  /** 5 or 18. */
  rate: number;
};

export function splitGst(gross: Paise): GstSplit {
  const rate =
    gross > GST.THRESHOLD_PAISE ? GST.RATE_ABOVE : GST.RATE_AT_OR_BELOW;
  const taxable = Math.round((gross * 100) / (100 + rate));
  return { gross, taxable, tax: gross - taxable, rate };
}

/**
 * Splits a whole order. Computed per line rather than on the order
 * total, because the rate depends on the per-piece price — a ₹1,890 tee
 * and a ₹3,200 jacket in the same cart attract different rates, and
 * splitting the total would silently apply one rate to both.
 */
/**
 * Launch pricing.
 *
 * §14 bans badges and "SALE" starbursts, and it is right to. But a real
 * launch price is a fact, not a manufactured urgency device, and hiding
 * it would cost Jace money on the drop that matters most. The
 * resolution: state it the way this brand states every other number —
 * mono, the old figure struck through, no colour, no badge, no
 * countdown-to-the-end-of-the-offer. The discount is information, not
 * decoration.
 *
 * Returns null when there is no offer, so callers render nothing rather
 * than a zero.
 */
export function discount(
  price: Paise,
  mrp: Paise | null,
): { saved: Paise; percent: number } | null {
  if (mrp === null || mrp <= price) return null;
  return {
    saved: mrp - price,
    percent: Math.round(((mrp - price) / mrp) * 100),
  };
}

export function splitOrderGst(
  lines: { unit: Paise; qty: number }[],
): { taxable: Paise; tax: Paise; gross: Paise; rates: number[] } {
  let taxable = 0;
  let tax = 0;
  let gross = 0;
  const rates = new Set<number>();

  for (const l of lines) {
    const s = splitGst(l.unit);
    taxable += s.taxable * l.qty;
    tax += s.tax * l.qty;
    gross += s.gross * l.qty;
    rates.add(s.rate);
  }

  return { taxable, tax, gross, rates: [...rates].sort((a, b) => a - b) };
}
