import manifest from "@/data/media.json";

export type MediaEntry = { src: string; w: number; h: number; blur: string };

/**
 * An image as products carry it: where it lives, how big it is, and its
 * blur placeholder. `id` is the shoot id ("0119"), art key
 * ("remember-back"), or a storage path for dashboard uploads
 * ("uploads/remember/…webp").
 */
export type Media = MediaEntry & { id: string };

type Manifest = {
  shoots: Record<string, MediaEntry & { file?: string }>;
  art: Record<string, MediaEntry>;
};

const m = manifest as unknown as Manifest;

/** A shoot photo by id ("0119"), or null if `npm run media` hasn't made it. */
export const shoot = (id: string): MediaEntry | null => m.shoots[id] ?? null;

/** A print artwork by key ("remember-back"). */
export const art = (key: string | undefined): MediaEntry | null =>
  key ? (m.art[key] ?? null) : null;

const pick = (id: string, e: MediaEntry | null): Media | null =>
  e ? { id, src: e.src, w: e.w, h: e.h, blur: e.blur } : null;

export const shootMedia = (id: string) => pick(id, shoot(id));
export const artMedia = (key: string) => pick(key, art(key));

/** Every shoot id, in filename order. */
export const allShoots = (): string[] => Object.keys(m.shoots).sort();
