/**
 * Launch configuration.
 *
 * LAUNCH matches the countdown on the deployed coming-soon page —
 * changing it here does not change that page, which is a separate
 * deployment. Keep them in sync by hand until the store takes over
 * the domain.
 */
export const CONFIG = {
  /** Fri 14 Aug 2026, 12 noon IST. ISO 8601 with an explicit offset. */
  LAUNCH: "2026-08-14T12:00:00+05:30",
  TZ_LABEL: "IST",
  DOMAIN: "https://mrtx.club",
} as const;

/**
 * GST — India, apparel. Verified against the rates effective
 * 22 Sept 2025: the old ₹1,000 / 12% figures are stale.
 *
 *   sale value ≤ ₹2,500 per piece  →   5%
 *   sale value >  ₹2,500 per piece  →  18%
 *
 * Prices in this store are GST-INCLUSIVE, so the displayed figure is
 * what the customer pays and the tax is backed out for the invoice.
 *
 * NOTE: whether the ₹2,500 threshold is tested against the inclusive
 * price or the backed-out taxable value is a question for a CA, not
 * for this file. It matters — an inclusive price of ₹2,600 is over
 * the line, but its taxable value at 18% is ₹2,203, which is under.
 * Confirm before pricing anything near ₹2,500. I am not a tax adviser.
 */
export const GST = {
  HSN_TSHIRT: "610910", // knitted cotton T-shirts
  THRESHOLD_PAISE: 250_000, // ₹2,500 per piece
  RATE_AT_OR_BELOW: 5,
  RATE_ABOVE: 18,
} as const;
