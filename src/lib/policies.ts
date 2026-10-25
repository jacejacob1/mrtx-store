import { FREE_SHIPPING_AT, SHIPPING_FLAT, COD_FEE, RETURN_DAYS } from "@/lib/catalogue";
import { formatINR, GST_REGISTERED } from "@/lib/money";

/**
 * DRAFTS, built from Jace's decisions: cash on delivery yes, no
 * exchanges, refunds within 7 days, not GST-registered yet. Anything in
 * [brackets] is still open. Have these reviewed before taking payments —
 * Razorpay checks for live terms, refund and privacy pages at activation.
 */
export type Policy = { slug: string; title: string; sections: { h: string; p: string[] }[] };

export const POLICIES: Policy[] = [
  {
    slug: "shipping",
    title: "Shipping",
    sections: [
      {
        h: "Cost",
        p: [
          `Free on orders of ${formatINR(FREE_SHIPPING_AT)} or more. Below that, a flat ${formatINR(SHIPPING_FLAT)}.`,
        ],
      },
      {
        h: "Cash on delivery",
        p: [
          COD_FEE > 0
            ? `Available across serviceable PIN codes, with a ${formatINR(COD_FEE)} COD fee. Please keep exact change ready.`
            : "Available across serviceable PIN codes. Please keep exact change ready.",
          "We may confirm COD orders by phone before dispatch.",
        ],
      },
      {
        h: "When it ships",
        p: [
          "Orders are packed within [X] working days. Delivery usually takes [X–Y] days after dispatch, depending on your PIN code.",
          "You'll get a tracking link by email when it leaves.",
        ],
      },
      { h: "Where", p: ["We ship within India."] },
    ],
  },
  {
    slug: "returns",
    title: "Returns & refunds",
    sections: [
      {
        h: "Refunds",
        p: [
          `Changed your mind or the fit isn't right? Ask for a refund within ${RETURN_DAYS} days of delivery. The tee must be unworn, unwashed and still have its tags.`,
          "We arrange the pickup. Once it reaches us and passes a quick check, we refund within [X] working days.",
        ],
      },
      {
        h: "Where the money goes",
        p: [
          "Paid online: back to the same UPI ID, card or bank account.",
          "Paid cash on delivery: to a bank account or UPI ID you give us.",
        ],
      },
      { h: "Exchanges", p: ["We don't do exchanges. Return the tee for a refund and order the size you want."] },
      {
        h: "Damaged or wrong item",
        p: ["Email us within 48 hours of delivery with a photo and we'll refund it in full, shipping included."],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms",
    sections: [
      {
        h: "Prices",
        p: [
          GST_REGISTERED
            ? "Prices are in Indian rupees and include GST. Offer prices apply while the offer runs and stock lasts."
            : "Prices are in Indian rupees. Offer prices apply while the offer runs and stock lasts.",
        ],
      },
      {
        h: "Orders",
        p: [
          "A prepaid order is confirmed when payment succeeds; a cash-on-delivery order when we confirm it. If something sells out after you've paid, we refund it in full.",
        ],
      },
      { h: "Seller", p: ["[Legal business name, address, contact email, phone.]"] },
      { h: "Grievance officer", p: ["[Name, email and phone of the person who handles complaints.]"] },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    sections: [
      {
        h: "What we collect",
        p: ["Your name, email, phone and delivery address — only what's needed to deliver your order and contact you about it."],
      },
      {
        h: "Who sees it",
        p: ["Our payment processor and our courier, for those purposes only. We don't sell your data. Card details never touch our servers."],
      },
      {
        h: "On this device",
        p: ["Your bag is saved in your browser's local storage so it survives a refresh. Clearing site data removes it."],
      },
      { h: "Contact", p: ["[Contact email] — to see, correct or delete what we hold about you."] },
    ],
  },
];

export const policyBySlug = (slug: string) => POLICIES.find((p) => p.slug === slug);
