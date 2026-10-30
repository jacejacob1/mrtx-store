"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Photo } from "@/components/Photo";
import { DotText } from "@/components/DotText";
import { saveProduct, type ProductDraft } from "@/app/admin/actions";
import { uploadImage } from "@/components/admin/prepareImage";
import { adminField } from "@/components/admin/LoginForm";
import { SIZES, type Product, type Size } from "@/lib/catalogue";
import type { Media } from "@/lib/media";

type State = {
  name: string;
  tagline: string;
  body: string;
  spec: string;
  price: string;
  mrp: string;
  stock: Record<Size, number>;
  photos: Media[];
  chapterId: string | null;
  artFront: Media | null;
  artBack: Media | null;
};

const fromProduct = (p: Product, chapterId: string | null): State => ({
  name: p.name,
  tagline: p.tagline,
  body: p.body,
  spec: p.spec.join("\n"),
  price: String(Math.round(p.price / 100)),
  mrp: p.mrp === null ? "" : String(Math.round(p.mrp / 100)),
  stock: { ...p.stock },
  photos: p.photos,
  chapterId: chapterId ?? p.photos[0]?.id ?? null,
  artFront: p.art.front ?? null,
  artBack: p.art.back ?? null,
});

/**
 * One tee, every editable thing on one page. Nothing is live until
 * Save; Save sends it to the server, which checks the admin again,
 * validates every field, writes to Supabase and refreshes the shop.
 */
export function ProductEditor({ product, chapterId }: { product: Product; chapterId: string | null }) {
  const router = useRouter();
  const [base, setBase] = useState(() => fromProduct(product, chapterId));
  const [s, setS] = useState(base);
  const [stockFrom, setStockFrom] = useState(product.stock);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(base), [s, base]);
  const set = <K extends keyof State>(k: K, v: State[K]) => {
    setS((x) => ({ ...x, [k]: v }));
    setMsg(null);
  };

  // Don't lose work to a stray tab close.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const price = Number(s.price);
  const mrp = s.mrp === "" ? null : Number(s.mrp);
  const off = mrp && price && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  async function save() {
    setSaving(true);
    setMsg(null);
    const draft: ProductDraft = {
      slug: product.slug,
      name: s.name,
      tagline: s.tagline,
      body: s.body,
      spec: s.spec.split("\n"),
      price,
      mrp,
      stock: s.stock,
      stockFrom,
      photos: s.photos,
      chapterId: s.chapterId,
      artFront: s.artFront,
      artBack: s.artBack,
    };
    const r = await saveProduct(draft).catch(() => ({ ok: false as const, error: "Couldn't reach the server." }));
    setSaving(false);
    if (r.ok) {
      const next = { ...s, stock: r.stock };
      setS(next);
      setBase(next);
      setStockFrom(r.stock);
      setMsg({ ok: true, text: "Saved. It's live on the site." });
      router.refresh();
    } else {
      setMsg({ ok: false, text: r.error });
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 12 - s.photos.length);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const m = await uploadImage(f, product.slug, "photo");
        setS((x) => ({ ...x, photos: [...x.photos, m] }));
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Upload failed." });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function setArt(side: "artFront" | "artBack", file: File | undefined) {
    if (!file) return;
    setUploading((n) => n + 1);
    try {
      set(side, await uploadImage(file, product.slug, "art"));
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading((n) => n - 1);
    }
  }

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= s.photos.length) return;
    const next = [...s.photos];
    [next[i], next[j]] = [next[j], next[i]];
    set("photos", next);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-12 lg:col-span-8">
        <div>
          <Link href="/admin/products" className="t-small text-fg-2 hover:text-fg">
            ← All products
          </Link>
          <div className="mt-6 flex items-center gap-3 text-fg-2">
            <DotText text={product.index} size={11} label="" />
            <span className="t-eyebrow">{product.garment.name} tee</span>
          </div>
          <h1 className="t-display mt-3">{s.name || "Untitled"}</h1>
        </div>

        {/* ── words ── */}
        <Section title="Words">
          <Field label="Name" hint={`${s.name.length}/40`}>
            <input className={adminField} value={s.name} maxLength={40} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Tagline" hint="The one sentence under the name.">
            <input className={adminField} value={s.tagline} maxLength={120} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Description" hint={`${s.body.length}/1200`}>
            <textarea
              className={`${adminField} h-36 py-3 leading-relaxed`}
              value={s.body}
              maxLength={1200}
              onChange={(e) => set("body", e.target.value)}
            />
          </Field>
          <Field label="Details" hint="One per line — fabric, fit, where it's made, print.">
            <textarea className={`${adminField} h-32 py-3 leading-relaxed`} value={s.spec} onChange={(e) => set("spec", e.target.value)} />
          </Field>
        </Section>

        {/* ── price ── */}
        <Section title="Price">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling price (₹)">
              <input className={adminField} inputMode="numeric" value={s.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="MRP — shown struck through (₹)" hint="Leave empty for no offer.">
              <input className={adminField} inputMode="numeric" value={s.mrp} onChange={(e) => set("mrp", e.target.value.replace(/\D/g, ""))} />
            </Field>
          </div>
          {off > 0 && <p className="t-small text-accent">Shows as −{off}% off.</p>}
        </Section>

        {/* ── stock ── */}
        <Section title="Stock" hint="How many of each size you have to sell right now.">
          <div className="grid grid-cols-5 gap-2">
            {SIZES.map((sz) => (
              <label key={sz} className="block text-center">
                <span className="t-eyebrow text-fg-2">{sz}</span>
                <input
                  inputMode="numeric"
                  aria-label={`Stock, size ${sz}`}
                  className={`${adminField} t-num text-center ${s.stock[sz] === 0 ? "text-accent" : ""}`}
                  value={String(s.stock[sz])}
                  onChange={(e) => set("stock", { ...s.stock, [sz]: Math.min(99999, Number(e.target.value.replace(/\D/g, "") || 0)) })}
                />
              </label>
            ))}
          </div>
        </Section>

        {/* ── photos ── */}
        <Section title="Photos" hint="The first is the cover in the shop; the second shows on hover. ★ marks the big photo on the home page.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {s.photos.map((m, i) => (
              <li key={m.id} className="group relative aspect-[4/5] overflow-hidden rounded-[18px] bg-surface">
                <Photo media={m} alt="" sizes="240px" fill className="object-cover" />
                {i === 0 && <span className="t-eyebrow absolute top-3 left-3 rounded-full bg-black/60 px-2 py-1 text-white">Cover</span>}
                <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
                  <Tool label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}>←</Tool>
                  <Tool label="Feature on home page" onClick={() => set("chapterId", m.id)} on={s.chapterId === m.id}>★</Tool>
                  <Tool
                    label="Remove photo"
                    onClick={() => s.photos.length > 1 && set("photos", s.photos.filter((x) => x.id !== m.id))}
                    disabled={s.photos.length <= 1}
                  >
                    ✕
                  </Tool>
                  <Tool label="Move later" onClick={() => move(i, 1)} disabled={i === s.photos.length - 1}>→</Tool>
                </div>
              </li>
            ))}
            {Array.from({ length: uploading }).map((_, i) => (
              <li key={`up-${i}`} className="flex aspect-[4/5] items-center justify-center rounded-[18px] bg-surface">
                <span className="t-small animate-pulse text-fg-2">Uploading…</span>
              </li>
            ))}
            {s.photos.length + uploading < 12 && (
              <li>
                <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-line text-fg-2 transition-colors hover:border-fg hover:text-fg">
                  <span className="t-headline">+</span>
                  <span className="t-small">Add photos</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                </label>
              </li>
            )}
          </ul>
        </Section>

        {/* ── artwork ── */}
        <Section title="Print artwork" hint="The flat design files shown under “The print”. Transparent PNGs look best.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["artFront", "artBack"] as const).map((side) => (
              <figure key={side}>
                <div className="relative aspect-square overflow-hidden rounded-[18px] ring-1 ring-line ring-inset" style={{ background: product.garment.hex }}>
                  {s[side] ? (
                    <Photo media={s[side]} alt="" sizes="400px" fill className="object-contain p-[12%]" />
                  ) : (
                    <span className="t-small absolute inset-0 flex items-center justify-center text-fg-2">No artwork</span>
                  )}
                </div>
                <figcaption className="mt-3 flex items-center justify-between">
                  <span className="t-eyebrow text-fg-2">{side === "artFront" ? "Front" : "Back"}</span>
                  <span className="flex gap-4">
                    <label className="t-small cursor-pointer text-fg hover:underline">
                      {s[side] ? "Replace" : "Upload"}
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { setArt(side, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    {s[side] && (
                      <button type="button" className="t-small text-fg-2 hover:text-fg" onClick={() => set(side, null)}>
                        Remove
                      </button>
                    )}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      </div>

      {/* ── save ── */}
      <aside className="lg:col-span-4">
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 p-4 backdrop-blur-xl lg:sticky lg:top-24 lg:rounded-[24px] lg:border lg:bg-surface lg:p-6">
          <div className="mx-auto max-w-[1240px] lg:max-w-none">
            <p className="t-small hidden text-fg-2 lg:block">Preview</p>
            <p className="t-title hidden lg:mt-2 lg:block">{s.name}</p>
            <p className="t-num t-body hidden lg:block">
              ₹{price.toLocaleString("en-IN")}
              {mrp && mrp > price ? <s className="ml-2 text-fg-2">₹{mrp.toLocaleString("en-IN")}</s> : null}
            </p>
            <div className="flex items-center gap-3 lg:mt-6 lg:block">
              <p role="status" aria-live="polite" className={`t-small min-h-[1.25em] flex-1 lg:mb-3 ${msg ? (msg.ok ? "text-fg" : "text-accent") : "text-fg-2"}`}>
                {msg?.text ?? (uploading ? "Uploading…" : dirty ? "Unsaved changes." : "Everything's saved.")}
              </p>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || saving || uploading > 0}
                className="t-body flex h-12 shrink-0 items-center justify-center rounded-full bg-fg px-8 font-semibold text-bg transition-opacity disabled:opacity-40 lg:w-full"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            <Link href={`/shop/${product.slug}`} target="_blank" className="t-small mt-4 hidden text-fg-2 hover:text-fg lg:block">
              View on the site ↗
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="t-title">{title}</h2>
      {hint && <p className="t-small mt-1 text-fg-2">{hint}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="t-small flex justify-between text-fg-2">
        <span>{label}</span>
        {hint && <span>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Tool({
  label,
  onClick,
  disabled,
  on,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  on?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm backdrop-blur-md transition-colors disabled:opacity-30 ${
        on ? "bg-accent text-on-accent" : "bg-black/55 text-white hover:bg-black/75"
      }`}
    >
      {children}
    </button>
  );
}
