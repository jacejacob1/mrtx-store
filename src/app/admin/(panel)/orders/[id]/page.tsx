import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { select, type OrderItemRow, type OrderRow } from "@/lib/server/db";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/admin/StatusPill";
import { OrderActions } from "@/components/admin/OrderActions";

export const metadata: Metadata = { title: "Order" };

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : null;

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [o] = await select<(OrderRow & Record<string, string | null>)[]>("orders", `id=eq.${id}&select=*`);
  if (!o) notFound();
  const items = await select<OrderItemRow[]>("order_items", `order_id=eq.${id}&select=*`);

  const timeline = [
    ["Placed", when(o.created_at)],
    ["Paid", when(o.paid_at)],
    ["Shipped", when(o.shipped_at as string | null)],
    ["Delivered", when(o.delivered_at as string | null)],
    ["Cancelled", when(o.cancelled_at as string | null)],
    ["Refunded", when(o.refunded_at as string | null)],
  ].filter(([, t]) => t);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Link href="/admin/orders" className="t-small text-fg-2 hover:text-fg">
          ← Orders
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="t-display t-num">{o.number}</h1>
          <StatusPill status={o.status} />
        </div>
        <p className="t-body mt-2 text-fg-2">
          {o.method === "cod" ? "Cash on delivery" : `Paid online${o.razorpay_payment_id ? ` · ${o.razorpay_payment_id}` : ""}`}
          {o.awb ? ` · AWB ${o.awb}` : ""}
        </p>

        <ul className="mt-10 divide-y divide-line rounded-[24px] bg-surface">
          {items.map((it) => (
            <li key={it.sku} className="flex items-baseline justify-between px-6 py-4">
              <span className="t-body">
                {it.name} <span className="text-fg-2">· {it.size} · ×{it.qty}</span>
              </span>
              <span className="t-num t-body">{formatINR(it.unit_paise * it.qty)}</span>
            </li>
          ))}
          <li className="space-y-1 px-6 py-4 t-small text-fg-2">
            <div className="flex justify-between"><span>Subtotal</span><span className="t-num">{formatINR(o.subtotal_paise)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span className="t-num">{o.shipping_paise ? formatINR(o.shipping_paise) : "Free"}</span></div>
            {o.cod_fee_paise > 0 && <div className="flex justify-between"><span>COD fee</span><span className="t-num">{formatINR(o.cod_fee_paise)}</span></div>}
            <div className="flex justify-between pt-2 t-body text-fg"><span className="font-semibold">Total</span><span className="t-num">{formatINR(o.total_paise)}</span></div>
          </li>
        </ul>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-[24px] bg-surface p-6">
            <p className="t-eyebrow text-fg-2">Ship to</p>
            <p className="t-body mt-3 font-semibold">{o.name}</p>
            <p className="t-body text-fg-2">
              {o.address1}
              {o.address2 ? `, ${o.address2}` : ""}
              <br />
              {o.city}, {o.state} {o.pincode}
            </p>
          </div>
          <div className="rounded-[24px] bg-surface p-6">
            <p className="t-eyebrow text-fg-2">Contact</p>
            <p className="t-body mt-3">
              <a href={`tel:+91${o.phone}`} className="underline underline-offset-4">+91 {o.phone}</a>
            </p>
            <p className="t-body">
              <a href={`mailto:${o.email}`} className="underline underline-offset-4">{o.email}</a>
            </p>
          </div>
        </section>

        <ol className="mt-10 space-y-2">
          {timeline.map(([k, t]) => (
            <li key={k} className="t-small flex gap-4 text-fg-2">
              <span className="w-24 text-fg">{k}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <aside className="lg:col-span-4">
        <div className="rounded-[24px] bg-surface p-6 lg:sticky lg:top-24">
          <OrderActions id={o.id} status={o.status} method={o.method} paid={!!o.razorpay_payment_id} />
        </div>
      </aside>
    </div>
  );
}
