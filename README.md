# MRTX CLUB — store

Next.js (App Router) + TypeScript + Tailwind v4. Deployed on Vercel.

`CLAUDE.md` is the design system and the build rules. Read it before
changing anything. This README only records decisions that have nowhere
else to live — per §12, `vercel.json` cannot carry comments.

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

---

## Where things are

```
src/app/globals.css     design tokens — §2 colour, §3 type, §7 motion
src/components/         Wordmark (§4); aperture + rain land in Phase 1
src/lib/materials.ts    the ten materials, their finishes and measured contrast
src/lib/config.ts       launch date, domain, GST constants
public/assets/tx/       the ten materials — 28,048 bytes, do not re-encode
public/assets/noise.webp paper grain tile
```

## Decisions worth knowing

**Tokens live in CSS, not `tailwind.config.ts`.** Tailwind v4 is
CSS-first. §2 shows the palette as a JS config block; the equivalent is
the `@theme` block at the top of `globals.css`. Declaring the six
colours as the only `--color-*` entries *replaces* Tailwind's default
palette rather than extending it, so `bg-blue-500` does not exist —
only `bg-blue`. The six-colour rule is enforced by the build.

**`vercel.json` is a Next config, not the static-site one.** The
coming-soon repo sets `buildCommand: "echo …"` and
`outputDirectory: "."`. Pointing a Next app at that deploys an empty
directory and reports success. `framework: "nextjs"` is set explicitly
so a stale dashboard override can't win (§12).

**The materials are byte-for-byte from the coming-soon repo.** Each is a
192px slice mirrored into a 384×152 tile so it repeats seamlessly at
native resolution. Re-encoding or resizing them breaks the tiling and
invalidates every contrast figure in `materials.ts`.

**No webfonts, no icon package, no animation library.** §3 and §10.
Adding any of the three needs justifying in the changelog first.

## Bundle budget

§10 sets ≤ 90 KB gzipped JS. Next 16 + React 19 ships **~128 KB before
a single line of application code** — measured on both Turbopack and
webpack builds of a page with zero client components. The budget as
written is unreachable with this framework. See the Phase 0 notes for
the options; do not quietly ignore the number.

Measured on `/`, gzipped:

| | Phase 0 | Phase 1 |
|---|---|---|
| HTML | 2.4 KB | 2.7 KB |
| CSS | 2.2 KB | 2.8 KB |
| JS (modern browsers) | 128.9 KB | 133.7 KB |
| JS (`noModule` polyfills, skipped by modern browsers) | 39.5 KB | 38.6 KB |

Phase 1 added the aperture, the cursor rain, the material cuts and the
countdown for **+4.8 KB**. The 43 KB overage is entirely framework, not
application code — which is the argument for amending the number rather
than cutting features.

## Not done yet

The home page is the hero only. §14 also calls for a drop and a lookbook
strip below it; both need a catalogue and photography, so per §16 they
are omitted rather than faked. There is no shop, no cart, no checkout.
