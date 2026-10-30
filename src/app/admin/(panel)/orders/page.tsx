import type { Metadata } from "next";
import Link from "next/link";
import { select, type OrderRow } from "@/lib/server/db";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/admin/StatusPill";

export const metadata: Metadata = { title: "Orders" };

const VIEWS = {
  todo: { label: "To do", filter: "status=in.(cod_pending,confirmed)" },
  shipped: { label: "Shipped", filter: "status=in.(shipped,delivered)" },
  problems: { label: "Refunds", filter: "status=in.(refund_requested,refunded)" },
  all: { label: "All", filter: "status=not.in.(pending_payment,expired)" },
} as const;
type View = keyof typeof VIEWS;

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const v = ((await searchParams).view ?? "todo") as View;
  const view: View = v in VIEWS ? v : "todo";
  const orders = await select<(OrderRow & { order_items: { qty: number }[] })[]>(
    "orders",
    `${VIEWS[view].filter}&order=created_at.desc&limit=200&select=id,number,status,method,name,city,total_paise,created_at,order_items(qty)`,
  );

  return (
    <>
      <h1 className="t-display">Orders.</h1>
      <nav aria-label="Order views" className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5">
        {(Object.keys(VIEWS) as View[]).map((k) => (
          <Link
            key={k}
            href={`/admin/orders?view=${k}`}
            aria-current={k === view ? "page" : undefined}
            className={`t-small shrink-0 rounded-full border px-4 py-2 ${
              k === view ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:text-fg"
            }`}
          >
            {VIEWS[k].label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="t-body mt-12 text-fg-2">Nothing here right now.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[24px] bg-surface">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-fg/5 sm:grid-cols-[8rem_1fr_6rem_8rem_7rem]">
                <span className="t-num t-body font-semibold">{o.number}</span>
                <span className="t-body order-3 col-span-2 text-fg-2 sm:order-none sm:col-span-1">
                  {o.name} · {o.city}
                </span>
                <span className="t-small hidden text-fg-2 sm:block">
                  {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                  {" · "}
                  {o.order_items.reduce((n, i) => n + i.qty, 0)} pc
                </span>
                <span className="t-num t-body text-right sm:text-left">
                  {formatINR(o.total_paise)} <span className="t-small text-fg-2">{o.method === "cod" ? "COD" : "paid"}</span>
                </span>
                <span className="hidden sm:block">
                  <StatusPill status={o.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
