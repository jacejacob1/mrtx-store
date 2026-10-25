"use client";

import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product, type Size, FREE_SHIPPING_AT, SHIPPING_FLAT } from "@/lib/catalogue";
import { splitGst, type Paise } from "@/lib/money";

export type Line = { slug: string; size: Size; qty: number };

const KEY = "mrtx.bag";

/**
 * The bag is an external store, not Context + useState. localStorage
 * IS an external store; hydrating it with setState in an effect
 * cascades a second render and React 19's linter rejects it.
 * `lines` is always replaced, never mutated, so snapshots stay stable.
 */
let lines: Line[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const EMPTY: Line[] = [];

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode or quota — the bag still works for this visit */
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return;
    // Drop anything no longer in the catalogue so a stale bag can never
    // resurrect a discontinued item at checkout.
    lines = parsed.filter(
      (l): l is Line =>
        !!l &&
        typeof l === "object" &&
        typeof (l as Line).qty === "number" &&
        (l as Line).qty > 0 &&
        PRODUCTS.some((p) => p.slug === (l as Line).slug && (l as Line).size in p.stock),
    );
  } catch {
    lines = [];
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    hydrated = false;
    hydrate();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const useBag = () =>
  useSyncExternalStore(subscribe, () => lines, () => EMPTY);

export function addToBag(p: Product, size: Size): "added" | "clamped" | "gone" {
  const have = p.stock[size];
  if (have <= 0) return "gone";
  const existing = lines.find((l) => l.slug === p.slug && l.size === size);
  const want = (existing?.qty ?? 0) + 1;
  const qty = Math.min(want, have);
  lines = existing
    ? lines.map((l) => (l === existing ? { ...l, qty } : l))
    : [...lines, { slug: p.slug, size, qty }];
  emit();
  return qty < want ? "clamped" : "added";
}

export function setQty(slug: string, size: Size, qty: number) {
  const p = PRODUCTS.find((x) => x.slug === slug);
  const q = Math.max(0, Math.min(qty, p?.stock[size] ?? 0));
  lines =
    q === 0
      ? lines.filter((l) => !(l.slug === slug && l.size === size))
      : lines.map((l) => (l.slug === slug && l.size === size ? { ...l, qty: q } : l));
  emit();
}

export function clearBag() {
  lines = [];
  emit();
}

export function totals(ls: Line[]) {
  const rows = ls.flatMap((l) => {
    const product = PRODUCTS.find((p) => p.slug === l.slug);
    return product ? [{ ...l, product, unit: product.price, total: product.price * l.qty }] : [];
  });
  // GST per line, because the rate depends on per-piece price.
  let taxable = 0;
  let tax = 0;
  let gross = 0;
  for (const r of rows) {
    const s = splitGst(r.unit);
    taxable += s.taxable * r.qty;
    tax += s.tax * r.qty;
    gross += s.gross * r.qty;
  }
  const shipping: Paise = rows.length === 0 || gross >= FREE_SHIPPING_AT ? 0 : SHIPPING_FLAT;
  return {
    rows,
    count: rows.reduce((n, r) => n + r.qty, 0),
    subtotal: gross,
    taxable,
    tax,
    shipping,
    total: gross + shipping,
    toFree: Math.max(0, FREE_SHIPPING_AT - gross),
  };
}

export const useBagTotals = () => totals(useBag());

/* ── bag drawer open/close — tiny store so any button can open it ── */

let open = false;
const openListeners = new Set<() => void>();
const setOpen = (v: boolean) => {
  open = v;
  openListeners.forEach((l) => l());
};
export const openBag = () => setOpen(true);
export const closeBag = () => setOpen(false);

// Module-level so React doesn't tear down and re-subscribe every render.
const subscribeOpen = (cb: () => void) => {
  openListeners.add(cb);
  return () => {
    openListeners.delete(cb);
  };
};
const getOpen = () => open;
const getOpenServer = () => false;

export const useBagOpen = () => useSyncExternalStore(subscribeOpen, getOpen, getOpenServer);
