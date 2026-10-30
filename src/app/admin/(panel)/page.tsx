import Link from "next/link";
import { DotText } from "@/components/DotText";
import { rpc } from "@/lib/server/db";
import { formatINR } from "@/lib/money";

type Overview = {
  to_confirm: number;
  to_ship: number;
  to_refund: number;
  today_orders: number;
  today_sales: number;
  low_stock: { sku: string; name: string; size: string; stock: number }[];
};

export default async function Today() {
  const o = await rpc<Overview>("admin_overview", {});
  const tiles = [
    { n: o.to_confirm, label: "COD to confirm", href: "/admin/orders?view=todo", hot: o.to_confirm > 0 },
    { n: o.to_ship, label: "Ready to ship", href: "/admin/orders?view=todo", hot: o.to_ship > 0 },
    { n: o.to_refund, label: "Refunds needed", href: "/admin/orders?view=problems", hot: o.to_refund > 0 },
  ];

  return (
    <>
      <h1 className="t-display">Today.</h1>
      <p className="t-title mt-2 text-fg-2">
        {o.today_orders} {o.today_orders === 1 ? "order" : "orders"} · {formatINR(o.today_sales)}
      </p>

      <ul className="mt-12 grid gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block rounded-[24px] bg-surface p-6 transition-transform hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                {t.hot && <span className="live-dot" aria-hidden />}
                <DotText text={String(t.n).padStart(2, "0")} size={36} label={String(t.n)} />
              </div>
              <p className="t-body mt-4 text-fg-2">{t.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-14">
        <h2 className="t-title">Running low</h2>
        {o.low_stock.length === 0 ? (
          <p className="t-body mt-3 text-fg-2">Every size has more than 3 left.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-[24px] bg-surface">
            {o.low_stock.map((s) => (
              <li key={s.sku} className="flex items-center justify-between px-6 py-4">
                <span className="t-body">
                  {s.name} <span className="text-fg-2">· {s.size}</span>
                </span>
                <span className={`t-num t-body ${s.stock === 0 ? "text-accent" : ""}`}>
                  {s.stock === 0 ? "Sold out" : `${s.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
