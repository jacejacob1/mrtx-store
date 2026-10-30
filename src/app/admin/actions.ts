"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import {
  ACCESS,
  REFRESH,
  REFRESH_MAX_AGE,
  cookieOptions,
  isAdminEmail,
  passwordLogin,
  requireAdmin,
  revokeSession,
} from "@/lib/server/admin-auth";
import { DbError, rpc, select, update, type OrderRow } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { refundPayment } from "@/lib/server/razorpay";
import { CATALOGUE_TAG } from "@/lib/server/catalogue";
import { SIZES, type Size } from "@/lib/catalogue";
import type { Media } from "@/lib/media";

/* ── login ─────────────────────────────────────────────────────────── */

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const session = await passwordLogin(email, password).catch(() => null);
  // Same message for "wrong password" and "not an admin" — don't tell a
  // stranger which emails have accounts.
  if (!session || !(await isAdminEmail(email))) {
    if (session) await revokeSession(session.access_token);
    return { error: "That email and password don't match an admin account." };
  }

  const jar = await cookies();
  jar.set(ACCESS, session.access_token, cookieOptions(session.expires_in));
  jar.set(REFRESH, session.refresh_token, cookieOptions(REFRESH_MAX_AGE));
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(ACCESS)?.value;
  if (token) await revokeSession(token);
  jar.delete({ name: ACCESS, path: "/admin" });
  jar.delete({ name: REFRESH, path: "/admin" });
  redirect("/admin/login");
}

/* ── products ──────────────────────────────────────────────────────── */

export type ProductDraft = {
  slug: string;
  name: string;
  tagline: string;
  body: string;
  spec: string[];
  price: number; // rupees
  mrp: number | null; // rupees
  stock: Record<Size, number>;
  /** Stock as it was when the editor opened — saves apply the difference. */
  stockFrom: Record<Size, number>;
  photos: Media[];
  chapterId: string | null;
  artFront: Media | null;
  artBack: Media | null;
};

export type SaveResult = { ok: true; stock: Record<Size, number> } | { ok: false; error: string };

const STORAGE_PUBLIC = () => `${env.supabaseUrl}/storage/v1/object/public/media/`;

/** Only images we host: built-in /media/… files or our own storage bucket. */
function cleanMedia(m: unknown): Media | null {
  if (!m || typeof m !== "object") return null;
  const x = m as Record<string, unknown>;
  const src = String(x.src ?? "");
  const ours = /^\/media\/(shoots|art)\/[\w.-]+\.webp$/.test(src) || src.startsWith(STORAGE_PUBLIC());
  const w = Number(x.w), h = Number(x.h);
  const blur = String(x.blur ?? "");
  if (!ours || !(w > 0 && w < 10000) || !(h > 0 && h < 10000)) return null;
  if (blur && !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(blur)) return null;
  return { id: String(x.id ?? src).slice(0, 200), src, w, h, blur: blur.slice(0, 4000) };
}

export async function saveProduct(d: ProductDraft): Promise<SaveResult> {
  await requireAdmin();

  const name = d.name.trim();
  const tagline = d.tagline.trim();
  const body = d.body.trim();
  const spec = d.spec.map((s) => s.trim()).filter(Boolean);
  if (name.length < 1 || name.length > 40) return { ok: false, error: "Name must be 1–40 characters." };
  if (tagline.length > 120) return { ok: false, error: "Tagline is over 120 characters." };
  if (body.length > 1200) return { ok: false, error: "Description is over 1,200 characters." };
  if (spec.length > 8 || spec.some((s) => s.length > 80)) return { ok: false, error: "Up to 8 spec lines, 80 characters each." };

  const price = Math.round(Number(d.price));
  const mrp = d.mrp === null || d.mrp === undefined || String(d.mrp) === "" ? null : Math.round(Number(d.mrp));
  if (!(price >= 1 && price <= 100000)) return { ok: false, error: "Price must be between ₹1 and ₹1,00,000." };
  if (mrp !== null && !(mrp >= price && mrp <= 100000)) return { ok: false, error: "MRP must be at least the price." };

  const photos = (Array.isArray(d.photos) ? d.photos : []).map(cleanMedia);
  if (photos.some((p) => !p)) return { ok: false, error: "One of the photos isn't valid. Remove it and upload again." };
  if (photos.length === 0) return { ok: false, error: "Keep at least one photo — it's the cover in the shop." };
  if (photos.length > 12) return { ok: false, error: "Up to 12 photos per tee." };
  const artFront = d.artFront ? cleanMedia(d.artFront) : null;
  const artBack = d.artBack ? cleanMedia(d.artBack) : null;
  if ((d.artFront && !artFront) || (d.artBack && !artBack)) return { ok: false, error: "The artwork file isn't valid. Upload it again." };
  const chapterId = photos.some((p) => p!.id === d.chapterId) ? d.chapterId : photos[0]!.id;

  for (const s of SIZES) {
    const n = Number(d.stock?.[s]);
    if (!Number.isInteger(n) || n < 0 || n > 99999) return { ok: false, error: `Stock for ${s} must be a whole number.` };
  }

  try {
    const rows = await update<unknown[]>("products", `slug=eq.${encodeURIComponent(d.slug)}`, {
      name,
      tagline,
      body,
      spec,
      price_paise: price * 100,
      mrp_paise: mrp === null ? null : mrp * 100,
      photos,
      chapter_id: chapterId,
      art_front: artFront,
      art_back: artBack,
      updated_at: new Date().toISOString(),
    });
    if (!rows.length) return { ok: false, error: "That product no longer exists." };

    const stock = {} as Record<Size, number>;
    for (const s of SIZES) {
      stock[s] = await rpc<number>("admin_adjust_stock", {
        p_slug: d.slug,
        p_size: s,
        p_from: Number(d.stockFrom?.[s] ?? d.stock[s]),
        p_to: Number(d.stock[s]),
      });
    }
    updateTag(CATALOGUE_TAG); // the shop shows the change on its next request
    return { ok: true, stock };
  } catch (e) {
    console.error("saveProduct", e);
    return { ok: false, error: e instanceof DbError ? e.message : "Couldn't save. Try again." };
  }
}

/**
 * A one-time upload address for a single image, valid for a couple of
 * hours. The browser sends the (already resized) file straight to
 * Supabase Storage — big photos never pass through our server.
 */
export async function createUpload(slug: string, kind: "photo" | "art", ext: "webp" | "jpg" | "png") {
  await requireAdmin();
  if (!/^[a-z0-9-]{1,40}$/.test(slug) || !["photo", "art"].includes(kind) || !["webp", "jpg", "png"].includes(ext)) {
    throw new Error("bad upload request");
  }
  const rand = crypto.randomUUID().slice(0, 8);
  const path = `uploads/${slug}/${kind}-${Date.now()}-${rand}.${ext}`;
  const res = await fetch(`${env.supabaseUrl}/storage/v1/object/upload/sign/media/${path}`, {
    method: "POST",
    headers: { apikey: env.supabaseServiceKey, Authorization: `Bearer ${env.supabaseServiceKey}`, "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`storage ${res.status}`);
  const { url } = (await res.json()) as { url: string };
  return {
    uploadUrl: `${env.supabaseUrl}/storage/v1${url}`,
    publicUrl: `${STORAGE_PUBLIC()}${path}`,
    path,
  };
}

/* ── orders ────────────────────────────────────────────────────────── */

export type OrderActionResult = { ok: true } | { ok: false; error: string };

const TRANSITION_ERRORS: Record<string, string> = {
  BAD_TRANSITION: "That order has moved on since you opened it — refresh the page.",
  NO_ORDER: "That order doesn't exist.",
};

export async function orderAction(
  orderId: string,
  action: "confirm" | "ship" | "deliver" | "cancel" | "refund",
  opts: { awb?: string; restock?: boolean } = {},
): Promise<OrderActionResult> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false, error: "Bad order id." };

  try {
    if (action === "refund") {
      const [o] = await select<OrderRow[]>("orders", `id=eq.${orderId}&select=*`);
      if (!o) return { ok: false, error: "That order doesn't exist." };
      // Money first: if Razorpay refuses, nothing changes here.
      if (o.method === "online" && o.razorpay_payment_id) {
        await refundPayment(o.razorpay_payment_id);
      }
    }
    await rpc("admin_order_action", {
      p_order: orderId,
      p_action: action,
      p_awb: opts.awb?.slice(0, 60) ?? null,
      p_restock: opts.restock ?? true,
    });
    if (action === "cancel" || action === "refund") updateTag(CATALOGUE_TAG); // stock came back
    return { ok: true };
  } catch (e) {
    console.error("orderAction", action, e);
    const code = e instanceof Error ? e.message.split(":")[0] : "";
    return { ok: false, error: TRANSITION_ERRORS[code] ?? (e instanceof Error ? e.message : "Something went wrong.") };
  }
}
