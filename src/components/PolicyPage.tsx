import { missingEntityFields, POLICY } from "@/lib/legal";

/**
 * Shared shell for the four policy pages.
 *
 * §14 (About): "single column, max-width: 62ch." A policy is read, not
 * browsed — same treatment. §6: no materials anywhere near it.
 *
 * If the legal entity details are still placeholders the page says so
 * at the top, loudly. A policy that looks finished but names no legal
 * entity is worse than one that admits it isn't ready.
 */
export function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const missing = missingEntityFields();

  return (
    <article className="mx-auto max-w-[62ch] px-5 py-14">
      <p className="label text-mute">POLICY</p>
      <h1
        className="mt-3 text-ink"
        style={{ fontSize: "var(--text-section)", lineHeight: 1.15 }}
      >
        {title}
      </h1>

      {intro && (
        <p className="mt-4 text-[16px] leading-[1.7] text-ink">{intro}</p>
      )}

      {missing.length > 0 && (
        <div
          role="note"
          className="mt-8 border border-line p-4"
        >
          <p className="label text-mute">DRAFT — NOT YET BINDING</p>
          <p className="mono mt-2 text-readout text-ink">
            missing: {missing.join(", ")}
          </p>
          <p className="mt-2 text-[14px] leading-[1.6] text-ink">
            these pages are a starting draft, not legal advice. fill in
            src/lib/legal.ts and have a lawyer read them before taking a
            real payment.
          </p>
        </div>
      )}

      <div className="policy mt-10">{children}</div>

      <p className="mono mt-14 border-t border-line pt-6 text-readout text-mute">
        LAST UPDATED {POLICY.lastUpdated.toUpperCase()}
      </p>
    </article>
  );
}

export default PolicyPage;
