"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Photo } from "@/components/Photo";
import { DotText } from "@/components/DotText";
import { closeBag, setQty, useBagOpen, useBagTotals } from "@/lib/cart";
import { formatINR, TAX_NOTE } from "@/lib/money";

/**
 * The bag, as a sheet from the right.
 *
 * Built on the native <dialog>: showModal() gives a real focus trap,
 * Escape to close and an inert page behind it for free — things a
 * hand-rolled div drawer gets subtly wrong. Motion only animates the
 * panel inside it.
 */
export function BagDrawer() {
  const open = useBagOpen();
  const t = useBagTotals();
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    // Closing waits for the exit animation — see onExitComplete below.
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Bag"
      onCancel={(e) => {
        e.preventDefault(); // let the exit animation run first
        closeBag();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBag(); // backdrop click
      }}
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-transparent"
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open && (
          <>
            <motion.div
              key="scrim"
              aria-hidden
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={closeBag}
            />
            <motion.aside
              key="panel"
              data-ground="light"
              className="fixed top-0 right-0 bottom-0 flex w-full max-w-[440px] flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="t-title">Bag</span>
                  {t.count > 0 && <DotText text={String(t.count).padStart(2, "0")} size={10} />}
                </div>
                <button
                  type="button"
                  onClick={closeBag}
                  className="t-small -m-2 p-2 text-fg-2 hover:text-fg"
                >
                  Close
                </button>
              </div>

              {t.count === 0 ? (
                <div className="flex flex-1 flex-col items-start justify-center px-6">
                  <p className="t-headline">Your bag is empty.</p>
                  <Link
                    href="/shop"
                    onClick={closeBag}
                    className="t-body mt-6 text-accent underline underline-offset-4"
                  >
                    See the drop
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="flex-1 overflow-y-auto px-6">
                    {t.rows.map((r) => (
                      <li
                        key={`${r.slug}-${r.size}`}
                        className="flex gap-4 border-b border-line py-5"
                      >
                        <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                          <Photo
                            id={r.product.photos[0]}
                            alt=""
                            sizes="80px"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-baseline justify-between gap-3">
                            <div>
                              <p className="t-body font-semibold">{r.product.name}</p>
                              <p className="t-small text-fg-2">
                                {r.size} · {r.product.garment.name}
                              </p>
                            </div>
                            <p className="t-num t-small">{formatINR(r.total)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Stepper
                              qty={r.qty}
                              max={r.product.stock[r.size]}
                              label={`${r.product.name} size ${r.size}`}
                              onChange={(q) => setQty(r.slug, r.size, q)}
                            />
                            <button
                              type="button"
                              onClick={() => setQty(r.slug, r.size, 0)}
                              className="t-small text-fg-2 hover:text-fg"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-line px-6 py-6">
                    <div className="flex items-baseline justify-between">
                      <span className="t-body">Subtotal</span>
                      <span className="t-num t-title">{formatINR(t.subtotal)}</span>
                    </div>
                    <p className="t-small mt-1 text-fg-2">
                      {t.toFree > 0
                        ? `${formatINR(t.toFree)} more for free shipping. ${TAX_NOTE}`
                        : `Free shipping. ${TAX_NOTE}`}
                    </p>
                    <Link
                      href="/checkout"
                      onClick={closeBag}
                      className="t-body mt-5 flex h-12 w-full items-center justify-center rounded-full bg-fg font-semibold text-bg transition-opacity hover:opacity-85"
                    >
                      Check out
                    </Link>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}

function Stepper({
  qty,
  max,
  label,
  onChange,
}: {
  qty: number;
  max: number;
  label: string;
  onChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-line">
      <button
        type="button"
        aria-label={`One fewer ${label}`}
        onClick={() => onChange(qty - 1)}
        className="t-num h-8 w-8"
      >
        −
      </button>
      <span className="t-num t-small w-6 text-center" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label={`One more ${label}`}
        disabled={qty >= max}
        onClick={() => onChange(qty + 1)}
        className="t-num h-8 w-8 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

export default BagDrawer;
