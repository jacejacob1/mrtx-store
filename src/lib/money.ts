/**
 * Money is integer PAISE, never rupees as floats. Convert only to
 * display. A cart that shows ₹5,669.999999 once is never trusted again.
 */
export type Paise = number;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatINR = (p: Paise) => inr.format(Math.round(p / 100));

/**
 * GST on apparel, effective 22 Sept 2025: 5% at or below ₹2,500 per
 * piece, 18% above. Prices here are GST-inclusive, so tax is backed out.
 * Whether the threshold tests the inclusive or taxable value is a
 * question for a CA — every current price is far below it either way.
 */
export const GST = {
  HSN: "610910",
  THRESHOLD: 250_000 as Paise,
  LOW: 5,
  HIGH: 18,
};

/**
 * MRTX isn't GST-registered yet (application filed, TRN issued). An
 * unregistered seller may not collect GST or print it on a bill, so
 * until the GSTIN arrives every tax line is off and prices are just
 * prices. The day it arrives: set NEXT_PUBLIC_GST_REGISTERED=true in
 * .env.local and on Vercel, add the GSTIN, and every line returns.
 * The ₹699 price stays the same either way, because it's tax-inclusive.
 */
export const GST_REGISTERED = process.env.NEXT_PUBLIC_GST_REGISTERED === "true";

/** One short line for under prices. Empty while unregistered. */
export const TAX_NOTE = GST_REGISTERED ? "Prices include GST." : "";

export function splitGst(gross: Paise) {
  if (!GST_REGISTERED) return { gross, taxable: gross, tax: 0, rate: 0 };
  const rate = gross > GST.THRESHOLD ? GST.HIGH : GST.LOW;
  const taxable = Math.round((gross * 100) / (100 + rate));
  return { gross, taxable, tax: gross - taxable, rate };
}

export function discount(price: Paise, mrp: Paise | null) {
  if (mrp === null || mrp <= price) return null;
  return { saved: mrp - price, percent: Math.round(((mrp - price) / mrp) * 100) };
}
