import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, type OrderRow, type OrderItemRow } from "@/lib/db";
import { paymentsConfigured } from "@/lib/env";
import { formatINR } from "@/lib/money";
import { ENTITY, isPlaceholder } from "@/lib/legal";
import { GST } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ id: string }> };

/**
 * Order confirmation.
 *
 * §13: state only what actually happened. In particular this page does
 * NOT say "check your inbox" — no confirmation email is sent yet, and
 * promising one is the fastest way to lose someone who just paid.
 *
 * The order id is a v4 UUID, which is unguessable, so this page is
 * reachable by anyone holding the link and by nobody else. It is
 * noindex for the same reason. Names and addresses are deliberately not
 * shown — the customer knows where they live, and a leaked link should
 * not leak an address.
 */
export default async function OrderPage({ params }: Params) {
  const { id } = await params;

  if (!paymentsConfigured()) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supa = db();
  const { data } = await supa
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as OrderRow;

  const { data: itemRows } = await supa
    .from("order_items")
    .select("sku, product_slug, name, size, qty, unit_paise, hsn, gst_rate")
    .eq("order_id", order.id);
  const items = (itemRows ?? []) as OrderItemRow[];

  // The webhook may not have landed in the second it took to redirect.
  const settled = order.status !== "created";

  return (
    <div className="mx-auto max-w-[62ch] px-5 py-16">
      <p className="label text-mute">ORDER {order.order_no}</p>

      <h1
        className="mt-3 text-ink"
        style={{ fontSize: "var(--text-page)", lineHeight: 1.05 }}
      >
        {order.status === "oversold" ? "we owe you a refund." : "access granted."}
      </h1>

      {order.status === "oversold" ? (
        <p className="mt-4 text-[16px] leading-[1.7] text-ink">
          your payment went through, but the last one in your size sold in
          the same minute. we are refunding you in full — it takes 5 to 7
          working days to reach your bank. nothing else is needed from you.
        </p>
      ) : (
        <p className="mt-4 text-[16px] leading-[1.7] text-ink">
          {settled
            ? "paid. it ships within 2 to 4 working days."
            : "payment received. it may take a moment to settle — this page is safe to refresh."}
        </p>
      )}

      <div className="mt-10 border-t border-line pt-6">
        <p className="label text-mute">WHAT YOU BOUGHT</p>
        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li
              key={i.sku}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="text-[15px] text-ink">
                {i.name}{" "}
                <span className="mono text-mute">
                  {i.size} ×{i.qty}
                </span>
              </span>
              <span className="mono text-readout text-ink">
                {formatINR(i.unit_paise * i.qty)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-6 space-y-2 border-t border-line pt-6">
        <Row label="taxable value" value={formatINR(order.taxable_paise)} muted />
        <Row label="GST" value={formatINR(order.tax_paise)} muted />
        <Row
          label="shipping"
          value={
            order.shipping_paise === 0
              ? "free"
              : formatINR(order.shipping_paise)
          }
          muted
        />
      </dl>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
        <p className="text-[15px] text-ink">paid</p>
        <p className="mono text-[19px] text-ink">
          {formatINR(order.amount_paise)}
        </p>
      </div>

      {order.awb && (
        <p className="mono mt-8 text-readout text-ink">
          TRACKING {order.awb}
        </p>
      )}

      <div className="mt-12 border-t border-line pt-6">
        <p className="mono text-readout text-mute">
          tax invoice {order.order_no} · HSN {GST.HSN_TSHIRT}
          {!isPlaceholder(ENTITY.gstin) && <> · GSTIN {ENTITY.gstin}</>}
        </p>
        <p className="mono mt-2 text-readout text-mute">
          questions: <a href={`mailto:${ENTITY.email}`} className="underline">
            {ENTITY.email}
          </a>{" "}
          — quote order {order.order_no}
        </p>
      </div>

      <Link
        href="/shop"
        className="mono mt-10 inline-block border-b-2 border-blue pb-1 text-[15px] tracking-[.14em] text-ink uppercase"
      >
        back to the drop
      </Link>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`text-[14px] ${muted ? "text-mute" : "text-ink"}`}>
        {label}
      </dt>
      <dd className={`mono text-readout ${muted ? "text-mute" : "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}
