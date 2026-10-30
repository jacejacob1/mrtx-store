"use client";

import { createUpload } from "@/app/admin/actions";
import type { Media } from "@/lib/media";

/**
 * Get a picked file ready for the website, in the browser:
 *   - honour the phone's rotation,
 *   - shrink to the size the site actually shows (2400px photos, 2000px
 *     artwork) — the same as `npm run media` does for the built-in shoot,
 *   - encode WebP (JPEG/PNG where the browser can't), keeping
 *     transparency for artwork,
 *   - make the 16px blur placeholder the site fades in from.
 */
async function prepare(file: File, kind: "photo" | "art") {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const max = kind === "photo" ? 2400 : 2000;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);

  const toBlob = (type: string, q?: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  let blob = await toBlob("image/webp", 0.82);
  let ext: "webp" | "jpg" | "png" = "webp";
  if (!blob || blob.type !== "image/webp") {
    // Safari can't encode WebP from a canvas.
    if (kind === "art") {
      blob = await toBlob("image/png");
      ext = "png";
    } else {
      blob = await toBlob("image/jpeg", 0.85);
      ext = "jpg";
    }
  }
  if (!blob) throw new Error(`Couldn't process ${file.name}.`);

  const tiny = document.createElement("canvas");
  tiny.width = 16;
  tiny.height = Math.max(1, Math.round((16 * h) / w));
  tiny.getContext("2d")!.drawImage(bmp, 0, 0, tiny.width, tiny.height);
  let blur = tiny.toDataURL("image/webp", 0.4);
  if (!blur.startsWith("data:image/webp")) blur = tiny.toDataURL("image/png");

  bmp.close();
  return { blob, ext, w, h, blur };
}

/** Prepare and upload one image; returns the record to store on the product. */
export async function uploadImage(file: File, slug: string, kind: "photo" | "art"): Promise<Media> {
  const img = await prepare(file, kind);
  const { uploadUrl, publicUrl, path } = await createUpload(slug, kind, img.ext);
  const body = new FormData();
  body.append("cacheControl", "31536000");
  body.append("", img.blob);
  const res = await fetch(uploadUrl, { method: "PUT", body });
  if (!res.ok) throw new Error(`Upload failed (${res.status}). Try again.`);
  return { id: path, src: publicUrl, w: img.w, h: img.h, blur: img.blur };
}
