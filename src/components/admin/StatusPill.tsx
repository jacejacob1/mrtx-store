import type { OrderRow } from "@/lib/server/db";

const LABEL: Record<OrderRow["status"], [string, "hot" | "ok" | "dim"]> = {
  pending_payment: ["Awaiting payment", "dim"],
  cod_pending: ["Confirm COD", "hot"],
  confirmed: ["To ship", "hot"],
  shipped: ["Shipped", "ok"],
  delivered: ["Delivered", "ok"],
  cancelled: ["Cancelled", "dim"],
  expired: ["Expired", "dim"],
  refund_requested: ["Refund needed", "hot"],
  refunded: ["Refunded", "dim"],
};

export function StatusPill({ status }: { status: OrderRow["status"] }) {
  const [label, tone] = LABEL[status];
  return (
    <span
      className={`t-small inline-flex items-center gap-2 rounded-full px-3 py-1 ${
        tone === "hot" ? "bg-accent text-on-accent" : tone === "ok" ? "bg-fg text-bg" : "bg-fg/10 text-fg-2"
      }`}
    >
      {label}
    </span>
  );
}
