"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/Photo";
import { DotText } from "@/components/DotText";

export type Frame = { id: string; product: { slug: string; name: string } | null };

/**
 * Every frame from the shoot, in a masonry of CSS columns, with a
 * filter by design and a full-screen viewer.
 *
 * The viewer is a native <dialog>: focus trap, Escape and an inert page
 * for free. Arrow keys and swipes step through whatever the filter shows.
 */
export function GalleryView({
  frames,
  filters,
}: {
  frames: Frame[];
  filters: { slug: string; name: string }[];
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDialogElement | null>(null);
  const touchX = useRef<number | null>(null);

  const shown = filter ? frames.filter((f) => f.product?.slug === filter) : frames;
  const current = open !== null ? shown[open] : null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const step = (by: number) =>
    setOpen((i) => (i === null ? i : (i + by + shown.length) % shown.length));

  const alt = (f: Frame) =>
    f.product ? `${f.product.name} tee — SS26 shoot, frame ${f.id}` : `MRTX SS26 shoot, frame ${f.id}`;

  return (
    <>
      <div role="group" aria-label="Filter by design" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {[{ slug: null, name: "All" } as { slug: string | null; name: string }, ...filters].map((f) => {
          const on = filter === f.slug;
          return (
            <button
              key={f.name}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.slug)}
              className={`t-small shrink-0 rounded-full border px-4 py-2 transition-colors duration-200 ${
                on ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:border-fg hover:text-fg"
              }`}
            >
              {f.name}
            </button>
          );
        })}
      </div>

      <ul className="mt-10 columns-2 gap-3 md:columns-3 md:gap-4">
        {shown.map((f, i) => (
          <li key={f.id} className="mb-3 break-inside-avoid md:mb-4">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block w-full overflow-hidden rounded-2xl bg-surface"
              aria-label={`Open ${alt(f)}`}
            >
              <Photo
                id={f.id}
                alt=""
                sizes="(min-width: 768px) 33vw, 50vw"
                eager={i < 4}
                className="h-auto w-full transition-transform duration-[1200ms] ease-sheet group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={ref}
        aria-label="Photo viewer"
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        className="m-0 h-full max-h-none w-full max-w-none bg-black p-0 text-white backdrop:bg-black"
      >
        {current && open !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-5 py-4">
              <DotText
                text={`${String(open + 1).padStart(2, "0")}/${String(shown.length).padStart(2, "0")}`}
                size={11}
                label={`Photo ${open + 1} of ${shown.length}`}
              />
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="t-small -m-2 p-2 text-white/70 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1">
              <Photo
                key={current.id}
                id={current.id}
                alt={alt(current)}
                sizes="100vw"
                fill
                eager
                className="page-in object-contain"
              />
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => step(-1)}
                className="absolute inset-y-0 left-0 hidden w-1/4 cursor-w-resize md:block"
              />
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => step(1)}
                className="absolute inset-y-0 right-0 hidden w-1/4 cursor-e-resize md:block"
              />
            </div>

            <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-4">
              {current.product ? (
                <Link
                  href={`/shop/${current.product.slug}`}
                  onClick={() => setOpen(null)}
                  className="t-small rounded-full bg-white px-4 py-2 font-semibold text-black"
                >
                  Shop {current.product.name}
                </Link>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 hover:border-white"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 hover:border-white"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

export default GalleryView;
