"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { orderAction } from "@/app/admin/actions";
import { adminField } from "@/components/admin/LoginForm";
import type { OrderRow } from "@/lib/server/db";

type Props = { id: string; status: OrderRow["status"]; method: OrderRow["method"]; paid: boolean };

/**
 * What can happen to this order next — and only that. The database
 * enforces the same rules, so a stale tab can't push an order backwards.
 */
export function OrderActions({ id, status, method, paid }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [awb, setAwb] = useState("");
  const [restock, setRestock] = useState(true);
  const [err, setErr] = useState("");

  async function run(action: Parameters<typeof orderAction>[1], confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setErr("");
    const r = await orderAction(id, action, { awb, restock });
    setBusy(false);
    if (r.ok) router.refresh();
    else setErr(r.error);
  }

  const primary =
    "t-body flex h-12 w-full items-center justify-center rounded-full bg-fg font-semibold text-bg transition-opacity disabled:opacity-40";
  const quiet = "t-small w-full rounded-full border border-line py-3 text-fg-2 hover:border-fg hover:text-fg disabled:opacity-40";
  const canRefund = ["confirmed", "shipped", "delivered", "refund_requested"].includes(status);
  const tookStock = ["confirmed", "shipped", "delivered"].includes(status);

  return (
    <div className="space-y-4">
      <p className="t-eyebrow text-fg-2">Next step</p>

      {status === "cod_pending" && (
        <>
          <p className="t-small text-fg-2">Call the customer to check the order is real, then confirm it.</p>
          <button className={primary} disabled={busy} onClick={() => run("confirm")}>Confirm order</button>
        </>
      )}

      {status === "confirmed" && (
        <>
          <label className="t-small block text-fg-2">
            Tracking / AWB number (optional)
            <input className={adminField} value={awb} onChange={(e) => setAwb(e.target.value)} />
          </label>
          <button className={primary} disabled={busy} onClick={() => run("ship")}>Mark as shipped</button>
        </>
      )}

      {status === "shipped" && (
        <button className={primary} disabled={busy} onClick={() => run("deliver")}>Mark as delivered</button>
      )}

      {["pending_payment", "expired", "cancelled", "refunded"].includes(status) && (
        <p className="t-small text-fg-2">Nothing to do — this order is closed.</p>
      )}

      {canRefund && (
        <div className="space-y-3 border-t border-line pt-4">
          {tookStock && (
            <label className="t-small flex items-center gap-3 text-fg-2">
              <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
              Put the tee back in stock
            </label>
          )}
          <button
            className={quiet}
            disabled={busy}
            onClick={() =>
              run(
                "refund",
                method === "online" && paid
                  ? "Refund the full amount to the customer through Razorpay? This can't be undone."
                  : "Mark this order as refunded? Only do this after you've paid the customer back.",
              )
            }
          >
            {method === "online" && paid ? "Refund through Razorpay" : "Mark as refunded"}
          </button>
        </div>
      )}

      {(status === "cod_pending" || (status === "confirmed" && method === "cod")) && (
        <button className={quiet} disabled={busy} onClick={() => run("cancel", "Cancel this order? The stock goes back on sale.")}>
          Cancel order
        </button>
      )}

      <p role="alert" aria-live="polite" className="t-small min-h-[1.25em] text-accent">
        {busy ? "Working…" : err}
      </p>
    </div>
  );
}
