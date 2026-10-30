import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DotText } from "@/components/DotText";
import { Photo } from "@/components/Photo";
import { ClearBag } from "@/components/checkout/ClearBag";
import { select, type OrderItemRow, type OrderRow } from "@/lib/server/db";
import { hasDb } from "@/lib/server/env";
import { productBySlug, RETURN_DAYS } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/server/catalogue";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HEADLINE: Record<OrderRow["status"], [string, string]> = {
  pending_payment: ["Waiting for payment.", "If you've paid, this page updates in a moment — refresh it."],
  cod_pending: ["Order placed.", "We'll call to confirm your cash-on-delivery order before it ships."],
  confirmed: ["It's yours.", "Paid and confirmed. We'll email you when it ships."],
  shipped: ["On its way.", "Your order has shipped."],
  delivered: ["Delivered.", `Not right? You can ask for a refund within ${RETURN_DAYS} days.`],
  cancelled: ["Cancelled.", "This order was cancelled. If you were charged, the refund is on its way."],
  expired: ["Payment didn't go through.", "Nothing was charged and the items were released. You can try again."],
  refund_requested: ["Refund in progress.", "We'll email you when it's done."],
  refunded: ["Refunded.", "The money is on its way back to you."],
};

/**
 * The order, by its unguessable id. The UUID is the only key — knowing
 * an order number (MRTX-1042) is not enough to see someone's address.
 */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id) || !hasDb()) notFound();

  const [order] = await select<OrderRow[]>("orders", `id=eq.${id}&select=*`);
  if (!order) notFound();
  const items = await select<OrderItemRow[]>("order_items", `order_id=eq.${id}&select=*`);
  const products = await getCatalogue();
  const [title, line] = HEADLINE[order.status];
  const live = ["confirmed", "cod_pending", "shipped", "delivered"].includes(order.status);

  return (
    <section data-ground={live ? "dark" : "light"} className="min-h-[100svh] px-5 pt-32 pb-24 md:pt-40">
      {live && <ClearBag />}
      <div className="mx-auto max-w-[720px]">
        <div className="flex items-center gap-3 text-fg-2">
          {live && <span className="live-dot" aria-hidden />}
          <DotText text={order.number} size={12} label={`Order ${order.number}`} />
        </div>
        <h1 className="t-display mt-6">{title}</h1>
        <p className="t-title mt-4 text-fg-2">{line}</p>

        <ul className="mt-14 space-y-5 border-t border-line pt-8">
          {items.map((it) => {
            const p = productBySlug(it.product_slug, products);
            return (
              <li key={it.sku} className="flex items-center gap-4">
                <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {p && <Photo media={p.photos[0]} alt="" sizes="64px" fill className="object-cover" />}
                </div>
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <div>
                    <p className="t-body font-semibold">{it.name}</p>
                    <p className="t-small text-fg-2">
                      {it.size} · Qty {it.qty}
                    </p>
                  </div>
                  <p className="t-num t-small">{formatINR(it.unit_paise * it.qty)}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <dl className="t-small mt-8 space-y-2 border-t border-line pt-6">
          <Row k="Subtotal" v={formatINR(order.subtotal_paise)} />
          <Row k="Shipping" v={order.shipping_paise ? formatINR(order.shipping_paise) : "Free"} />
          {order.cod_fee_paise > 0 && <Row k="Cash on delivery" v={formatINR(order.cod_fee_paise)} />}
          <div className="flex justify-between border-t border-line pt-4">
            <dt className="t-body font-semibold">{order.method === "cod" ? "To pay on delivery" : "Paid"}</dt>
            <dd className="t-num t-title">{formatINR(order.total_paise)}</dd>
          </div>
        </dl>

        <div className="t-small mt-10 rounded-2xl bg-surface p-6 text-fg-2">
          <p className="t-eyebrow">Delivering to</p>
          <p className="mt-2 text-fg">{order.name}</p>
          <p>
            {order.address1}
            {order.address2 ? `, ${order.address2}` : ""}, {order.city}, {order.state} {order.pincode}
          </p>
          <p>{order.phone}</p>
        </div>

        <Link href="/shop" className="t-body mt-10 inline-block text-accent underline underline-offset-4">
          Back to the drop
        </Link>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-2">{k}</dt>
      <dd className="t-num">{v}</dd>
    </div>
  );
}
