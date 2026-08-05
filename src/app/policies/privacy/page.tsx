import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { ENTITY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What we collect, why, and how to get rid of it.",
};

export default function PrivacyPolicy() {
  return (
    <PolicyPage
      title="privacy"
      intro="we collect what an order needs and nothing else. no advertising trackers, no data sold, ever."
    >
      <h2>what we collect</h2>
      <dl>
        <dt>when you order</dt>
        <dd>
          name, email, phone, delivery address. we need all four to get a
          parcel to you and to tell you where it is.
        </dd>
        <dt>when you pay</dt>
        <dd>
          nothing. our payment provider handles the transaction and we
          receive only a payment reference and whether it succeeded. we
          never see your card or UPI details.
        </dd>
        <dt>when you browse</dt>
        <dd>
          your cart, stored in your own browser&apos;s local storage. it
          never reaches our servers and is not linked to you. clear your
          browser data and it is gone.
        </dd>
      </dl>

      <h2>what we do not do</h2>
      <ul>
        <li>no advertising or cross-site tracking cookies</li>
        <li>no selling, renting or sharing your details with anyone</li>
        <li>no marketing email unless you specifically asked for it</li>
        <li>no third-party webfonts, so no font-provider logging</li>
      </ul>

      <h2>who else sees it</h2>
      <p>
        only the parties that make an order work: the courier gets your
        name, address and phone; the payment provider gets what it needs
        to take the payment; our hosting provider processes page requests
        and holds server logs. each uses your data only to do that job.
      </p>

      <h2>how long we keep it</h2>
      <p>
        order and invoice records are kept as long as indian tax law
        requires us to. anything not required for that is deleted when it
        stops being useful.
      </p>

      <h2>your rights</h2>
      <p>
        you can ask for a copy of what we hold about you, ask us to
        correct it, or ask us to delete anything we are not legally
        required to keep. email{" "}
        <a href={`mailto:${ENTITY.email}`}>{ENTITY.email}</a> and we will
        respond within 30 days.
      </p>

      <h2>security</h2>
      <p>
        the site is served over HTTPS. we hold as little as possible,
        which is the only security measure that never fails.
      </p>

      <h2>changes</h2>
      <p>
        if this policy changes materially we will say so on this page
        with a new date rather than quietly editing it.
      </p>
    </PolicyPage>
  );
}
