import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { ENTITY, POLICY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Returns and exchanges",
  description: "Size exchanges within 7 days. Damaged or wrong items, 3 days.",
};

export default function ReturnsPolicy() {
  return (
    <PolicyPage
      title="returns and exchanges"
      intro="we exchange for size. we refund when we got it wrong. read which one applies before you write to us."
    >
      <h2>size exchange</h2>
      <p>
        if it doesn&apos;t fit, you have {POLICY.exchangeDays} days from
        delivery to ask for a different size. the piece must come back
        unworn, unwashed, with tags attached and in its original packing.
      </p>
      <ul>
        <li>one exchange per item</li>
        <li>
          you pay return shipping; we pay to send the replacement out
        </li>
        <li>
          subject to the replacement size being in stock — we do not
          restock, so if it has sold out we refund instead
        </li>
      </ul>

      <h2>damaged, defective or wrong item</h2>
      <p>
        tell us within {POLICY.defectDays} days of delivery, with photos
        of the item and the packing. if we sent the wrong thing or it
        arrived faulty, we cover shipping both ways and you choose a
        replacement or a full refund.
      </p>
      <p>
        garment dyeing and discharge printing produce variation between
        pieces. slight differences in shade, and print edges that are
        soft rather than sharp, are how these processes work and are not
        defects.
      </p>

      <h2>what we cannot take back</h2>
      <ul>
        <li>anything worn, washed, altered or scented</li>
        <li>anything without its tags</li>
        <li>
          anything returned after the windows above, which we have no way
          to verify
        </li>
      </ul>

      <h2>refunds</h2>
      <p>
        refunds go back to the original payment method. we process within
        3 working days of the item reaching us and passing inspection;
        your bank then takes its own time, usually 5–7 working days, and
        that part is out of our hands.
      </p>
      <p>
        shipping charges are refunded only where the fault was ours.
      </p>

      <h2>how to start</h2>
      <p>
        email <a href={`mailto:${ENTITY.email}`}>{ENTITY.email}</a> with
        your order number and what you want to happen. we reply within
        two working days. do not ship anything back before we confirm —
        unannounced returns cannot be traced to an order.
      </p>

      <h2>cancellations</h2>
      <p>
        you can cancel any time before dispatch for a full refund. once
        it has shipped, the exchange terms above apply instead.
      </p>
    </PolicyPage>
  );
}
