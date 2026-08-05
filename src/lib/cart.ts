"use client";

import { useSyncExternalStore } from "react";
import { PRODUCTS, type Size, type Product } from "@/lib/products";
import { splitOrderGst, type Paise } from "@/lib/money";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
  variantFor,
} from "@/lib/products";

export type Line = { slug: string; size: Size; qty: number };

const KEY = "mrtx.cart";

/**
 * A plain external store rather than Context + useState.
 *
 * Hydrating a cart from localStorage inside an effect means calling
 * setState during mount, which cascades a second render and is exactly
 * what React 19's linter rejects. `useSyncExternalStore` is the right
 * primitive: localStorage IS an external store.
 *
 * `lines` is replaced, never mutated, so getSnapshot stays
 * referentially stable and React only re-renders on real change.
 */
let lines: Line[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

/**
 * One module-level array, so the server snapshot is identity-stable
 * across renders. Returning a fresh `[]` from getServerSnapshot would
 * make React think the store changed on every render and loop forever.
 * Nothing mutates it — every mutation below replaces `lines` outright.
 */
const EMPTY: Line[] = [];

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode, quota, or a disabled storage API. The cart still
    // works for this session — losing it on refresh beats crashing.
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    // Drop anything that no longer exists in the catalogue, or a size
    // that has since been removed. A stale cart must never resurrect a
    // discontinued SKU at checkout.
    lines = parsed.filter(
      (l): l is Line =>
        !!l &&
        typeof l === "object" &&
        typeof (l as Line).slug === "string" &&
        typeof (l as Line).qty === "number" &&
        (l as Line).qty > 0 &&
        PRODUCTS.some(
          (p) =>
            p.slug === (l as Line).slug &&
            p.variants.some((v) => v.size === (l as Line).size),
        ),
    );
  } catch {
    lines = [];
  }
}

function emit() {
  persist();
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  // Keep tabs in sync — two tabs, one cart.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    hydrated = false;
    hydrate();
    for (const l of listeners) l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => lines;
const getServerSnapshot = () => EMPTY;

export function useCart(): Line[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ── mutations ─────────────────────────────────────────────────── */

/** Adds, clamped to available stock. Returns what actually happened. */
export function addToCart(
  product: Product,
  size: Size,
  qty = 1,
): "added" | "clamped" | "unavailable" {
  const v = variantFor(product, size);
  if (!v || v.stock <= 0) return "unavailable";

  const existing = lines.find(
    (l) => l.slug === product.slug && l.size === size,
  );
  const want = (existing?.qty ?? 0) + qty;
  const next = Math.min(want, v.stock);

  lines = existing
    ? lines.map((l) => (l === existing ? { ...l, qty: next } : l))
    : [...lines, { slug: product.slug, size, qty: next }];

  emit();
  return next < want ? "clamped" : "added";
}

export function setQty(slug: string, size: Size, qty: number) {
  const product = PRODUCTS.find((p) => p.slug === slug);
  const stock = product ? (variantFor(product, size)?.stock ?? 0) : 0;
  const clamped = Math.max(0, Math.min(qty, stock));

  lines =
    clamped === 0
      ? lines.filter((l) => !(l.slug === slug && l.size === size))
      : lines.map((l) =>
          l.slug === slug && l.size === size ? { ...l, qty: clamped } : l,
        );

  emit();
}

export function removeLine(slug: string, size: Size) {
  lines = lines.filter((l) => !(l.slug === slug && l.size === size));
  emit();
}

export function clearCart() {
  lines = [];
  emit();
}

/* ── derived ───────────────────────────────────────────────────── */

export type CartLine = Line & { product: Product; unit: Paise; total: Paise };

export function resolve(ls: Line[]): CartLine[] {
  return ls.flatMap((l) => {
    const product = PRODUCTS.find((p) => p.slug === l.slug);
    if (!product) return [];
    return [
      {
        ...l,
        product,
        unit: product.price,
        total: product.price * l.qty,
      },
    ];
  });
}

export function totals(ls: Line[]) {
  const resolved = resolve(ls);
  const gst = splitOrderGst(resolved.map((l) => ({ unit: l.unit, qty: l.qty })));
  const shipping =
    resolved.length === 0 || gst.gross >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FLAT;

  return {
    lines: resolved,
    count: resolved.reduce((n, l) => n + l.qty, 0),
    subtotal: gst.gross,
    taxable: gst.taxable,
    tax: gst.tax,
    rates: gst.rates,
    shipping,
    total: gst.gross + shipping,
    toFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - gst.gross),
  };
}

export function useCartTotals() {
  return totals(useCart());
}
