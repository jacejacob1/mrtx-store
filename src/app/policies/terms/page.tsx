import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";
import { ENTITY } from "@/lib/legal";
import { GST } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms and conditions of sale.",
};

export default function TermsPolicy() {
  return (
    <PolicyPage
      title="terms"
      intro="the terms you agree to when you buy from this site."
    >
      <h2>who you are buying from</h2>
      <dl>
        <dt>legal entity</dt>
        <dd>{ENTITY.legalName}</dd>
        <dt>trading as</dt>
        <dd>{ENTITY.tradeName}</dd>
        <dt>GSTIN</dt>
        <dd className="mono">{ENTITY.gstin}</dd>
        <dt>registered address</dt>
        <dd>{ENTITY.address}</dd>
        <dt>contact</dt>
        <dd>
          <a href={`mailto:${ENTITY.email}`}>{ENTITY.email}</a>
        </dd>
      </dl>

      <h2>prices and tax</h2>
      <p>
        all prices are in indian rupees and include GST. apparel is taxed
        at {GST.RATE_AT_OR_BELOW}% where the sale value is ₹2,500 or less
        per piece and {GST.RATE_ABOVE}% above that. the HSN code for our
        knitted cotton t-shirts is {GST.HSN_TSHIRT}.
      </p>
      <p>
        a tax invoice carrying our GSTIN and the HSN code is emailed with
        every order.
      </p>

      <h2>orders</h2>
      <p>
        an order is an offer to buy. it is accepted when we dispatch it,
        not when you pay. if we cannot fulfil an order — most often
        because the last unit of a size sold in the same minute — we
        cancel it and refund in full.
      </p>
      <p>
        we do not restock. quantities shown are what exists.
      </p>

      <h2>payment</h2>
      <p>
        payments are processed by our payment provider. we never see or
        store your card details.
      </p>

      <h2>the garments</h2>
      <p>
        our pieces are garment dyed, pigment printed or discharge
        printed. these processes produce variation between units. colour
        on your screen will not match the fabric exactly, and no two
        pieces are identical. this is a property of the product, not a
        fault.
      </p>

      <h2>intellectual property</h2>
      <p>
        the MRTX mark, the aperture treatment, the ten materials and
        everything else on this site belong to {ENTITY.tradeName}. buying
        a garment does not transfer any of it.
      </p>

      <h2>liability</h2>
      <p>
        our liability for any order is limited to what you paid for it.
        nothing here limits liability that cannot be limited under indian
        law, including under the Consumer Protection Act, 2019.
      </p>

      <h2>governing law</h2>
      <p>
        these terms are governed by the laws of india. the courts at{" "}
        {ENTITY.jurisdiction} have exclusive jurisdiction.
      </p>

      <h2>related</h2>
      <p>
        <Link href="/policies/shipping">shipping</Link>,{" "}
        <Link href="/policies/returns">returns and exchanges</Link>,{" "}
        <Link href="/policies/privacy">privacy</Link>.
      </p>
    </PolicyPage>
  );
}
