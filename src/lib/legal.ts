/**
 * ─────────────────────────────────────────────────────────────────
 *  LEGAL ENTITY DETAILS — ALL PLACEHOLDERS
 *
 *  Every value marked TODO must be replaced before taking a single
 *  real payment. A GST-registered seller in India is required to show
 *  its legal name, principal place of business and GSTIN, and to issue
 *  a tax invoice carrying the GSTIN and HSN code.
 *
 *  The policy pages read from this file, so filling it in updates
 *  every page at once. If a value is still TODO the pages say so in
 *  plain sight rather than rendering a blank — an incomplete policy
 *  that looks complete is worse than one that admits it.
 * ─────────────────────────────────────────────────────────────────
 */

export const TODO = "[TODO]" as const;

export const ENTITY = {
  /** Registered legal name, e.g. "Mrtx Club Private Limited". */
  legalName: TODO,
  tradeName: "MRTX CLUB",
  /** 15-character GSTIN. */
  gstin: TODO,
  /** Principal place of business, as registered. */
  address: TODO,
  state: TODO,
  email: "hello@mrtx.club",
  phone: TODO,
  /** Courts of this city have exclusive jurisdiction. */
  jurisdiction: TODO,
} as const;

export const isPlaceholder = (v: string) => v === TODO;

/** Anything still TODO, for the banner on the policy pages. */
export function missingEntityFields(): string[] {
  return Object.entries(ENTITY)
    .filter(([, v]) => isPlaceholder(v as string))
    .map(([k]) => k);
}

export const POLICY = {
  /** Working days to dispatch. */
  dispatchDays: "2–4",
  /** Working days in transit, metro / rest of India. */
  transitMetro: "2–4",
  transitRest: "4–8",
  /** Window to raise an exchange, from delivery. */
  exchangeDays: 7,
  /** Window to raise a damaged/wrong-item claim, from delivery. */
  defectDays: 3,
  lastUpdated: "August 2026",
} as const;
