import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { ENTITY, POLICY } from "@/lib/legal";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Where we ship, how long it takes, what it costs.",
};

export default function ShippingPolicy() {
  return (
    <PolicyPage
      title="shipping"
      intro="we ship within india only. prices include GST. no hidden charges at delivery."
    >
      <h2>where we ship</h2>
      <p>
        india only, to any address a courier will serve. we do not ship
        internationally, and we do not deliver to PO boxes.
      </p>

      <h2>what it costs</h2>
      <dl>
        <dt>orders {formatINR(FREE_SHIPPING_THRESHOLD)} and above</dt>
        <dd>free.</dd>
        <dt>below {formatINR(FREE_SHIPPING_THRESHOLD)}</dt>
        <dd>{formatINR(SHIPPING_FLAT)} flat, anywhere in india.</dd>
      </dl>

      <h2>how long it takes</h2>
      <p>
        orders are dispatched within {POLICY.dispatchDays} working days.
        we do not dispatch on sundays or public holidays.
      </p>
      <ul>
        <li>
          metro cities — {POLICY.transitMetro} working days in transit
        </li>
        <li>
          everywhere else — {POLICY.transitRest} working days in transit
        </li>
      </ul>
      <p>
        you get a tracking link by email when the parcel leaves us. the
        link is the courier&apos;s, not ours, and it is the most current
        information either of us has.
      </p>

      <h2>if something goes wrong</h2>
      <p>
        if tracking has not moved for four working days, write to{" "}
        <a href={`mailto:${ENTITY.email}`}>{ENTITY.email}</a> with your
        order number and we will chase the courier. if a parcel is marked
        delivered and you do not have it, tell us within{" "}
        {POLICY.defectDays} days and we will open a claim.
      </p>

      <h2>address accuracy</h2>
      <p>
        we send what you type. a wrong pin code is the single most common
        reason a parcel comes back, and a returned parcel is re-shipped
        at the flat rate above. check the address before you pay.
      </p>
    </PolicyPage>
  );
}
