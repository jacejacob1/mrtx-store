import manifest from "@/data/media.json";

export type MediaEntry = { src: string; w: number; h: number; blur: string };

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

/** Every shoot id, in filename order. */
export const allShoots = (): string[] => Object.keys(m.shoots).sort();
