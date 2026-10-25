#!/usr/bin/env node
/**
 * npm run media
 *
 * Turns the source media into web-sized files and a manifest.
 *
 *   MRTX Shoots/*.jpg|png   ->  public/media/shoots/<id>.webp   2400px long edge
 *   DESIGNS/**, 17.png      ->  public/media/art/<slug>-<side>.webp  (alpha kept)
 *                           ->  src/data/media.json   w, h, tiny blur placeholder
 *
 * The originals are several hundred MB and are gitignored. The outputs are
 * small, committed, and served from Vercel's CDN; next/image then serves
 * each visitor the smallest size that fills their screen.
 *
 * Incremental: a source is skipped when its output is newer. Delete
 * public/media to force a full rebuild.
 */
import { readdir, mkdir, stat, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_SHOOTS = path.join(ROOT, "public/media/shoots");
const OUT_ART = path.join(ROOT, "public/media/art");
const MANIFEST = path.join(ROOT, "src/data/media.json");

/**
 * Which file is which print. Front is what the chest shows when worn;
 * back is the large print. Checked against the shoot, not assumed —
 * e.g. REMEMBER's boxed word is on the chest and the full sentence is
 * on the back (IMG_0119), the opposite of how the files were numbered.
 */
const ART = [
  { key: "remember-front", file: "DESIGNS/REMEMBER/front.png" },
  { key: "remember-back", file: "DESIGNS/REMEMBER/back.png" },
  { key: "breathe-front", file: "DESIGNS/BREATHE/front.png" },
  { key: "breathe-back", file: "DESIGNS/BREATHE/back.png" },
  { key: "fly-high-front", file: "DESIGNS/FLY HIGH/front.png" },
  { key: "fly-high-back", file: "DESIGNS/FLY HIGH/back.png" },
  { key: "solitude-front", file: "DESIGNS/SOLITUDE/front.png" },
  { key: "solitude-back", file: "DESIGNS/SOLITUDE/back.png" },
  { key: "be-yourself-front", file: "DESIGNS/BE YOURSELF/front.png" },
  { key: "be-yourself-back", file: "DESIGNS/BE YOURSELF/back.png" },
];

/** "IMG_0034 (1).jpg" -> "0034-1",  "IMG_0168-2.jpg" -> "0168-2" */
const idFor = (name) =>
  path
    .parse(name)
    .name.replace(/^IMG_/i, "")
    .replace(/\s*\((\d+)\)/, "-$1")
    .replace(/[^a-z0-9-]+/gi, "-")
    .toLowerCase();

async function newer(src, out) {
  if (!existsSync(out)) return true;
  const [a, b] = await Promise.all([stat(src), stat(out)]);
  return a.mtimeMs > b.mtimeMs;
}

async function blur(input) {
  const buf = await sharp(input).rotate().resize(16).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

// Not named `process`: a hoisted function by that name shadows Node's
// global and `process.cwd()` at the top of this file would call it.
async function encode(src, out, { long, quality, alpha }) {
  const img = sharp(src, { limitInputPixels: false }).rotate(); // honour EXIF
  if (await newer(src, out)) {
    await img
      .clone()
      .resize({ width: long, height: long, fit: "inside", withoutEnlargement: true })
      .webp({ quality, alphaQuality: alpha ? 90 : 100, effort: 5 })
      .toFile(out);
  }
  const meta = await sharp(out).metadata();
  return { w: meta.width, h: meta.height, blur: await blur(out) };
}

async function main() {
  await mkdir(OUT_SHOOTS, { recursive: true });
  await mkdir(OUT_ART, { recursive: true });

  let manifest = { shoots: {}, art: {} };
  if (existsSync(MANIFEST)) {
    try {
      manifest = { shoots: {}, art: {}, ...JSON.parse(await readFile(MANIFEST, "utf8")) };
    } catch {
      /* rebuild from scratch */
    }
  }

  /* ── shoots ─────────────────────────────────────────────────── */
  const shootDir = path.join(ROOT, "MRTX Shoots");
  if (existsSync(shootDir)) {
    const files = (await readdir(shootDir)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
    for (const f of files) {
      const id = idFor(f);
      const out = path.join(OUT_SHOOTS, `${id}.webp`);
      const r = await encode(path.join(shootDir, f), out, { long: 2400, quality: 78 });
      manifest.shoots[id] = { src: `/media/shoots/${id}.webp`, ...r, file: f };
      console.log(`  shoot  ${id.padEnd(10)} ${r.w}x${r.h}`);
    }
  } else {
    console.warn("  ! 'MRTX Shoots' not found — skipping shoots");
  }

  /* ── artwork ────────────────────────────────────────────────── */
  for (const { key, file } of ART) {
    const src = path.join(ROOT, file);
    if (!existsSync(src)) {
      console.warn(`  ! missing ${file} — ${key} skipped`);
      continue;
    }
    const out = path.join(OUT_ART, `${key}.webp`);
    const r = await encode(src, out, { long: 2000, quality: 82, alpha: true });
    manifest.art[key] = { src: `/media/art/${key}.webp`, ...r };
    console.log(`  art    ${key.padEnd(16)} ${r.w}x${r.h}`);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
  console.log(
    `\n  ${Object.keys(manifest.shoots).length} shoots, ${Object.keys(manifest.art).length} artworks -> src/data/media.json`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
