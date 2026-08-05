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

Measured per route, gzipped, modern browsers:

| route | HTML | CSS | JS | total |
|---|---|---|---|---|
| `/` | 5.3 | 5.2 | 140.0 | 150.4 |
| `/shop` | 4.3 | 5.2 | 136.2 | 145.6 |
| `/shop/[slug]` | 4.7 | 5.2 | 137.0 | 146.9 |
| `/cart` | 3.4 | 5.2 | 138.5 | 147.0 |
| `/checkout` | 3.4 | 5.2 | 138.1 | 146.7 |
| `/lookbook` | 5.0 | 5.2 | 136.2 | 146.4 |

An empty Next 16 + React 19 page costs **128.9 KB** of JS before a line
of application code. The entire store — aperture, cursor rain, material
cuts, countdown, catalogue, persisted cart, checkout, 16 routes — adds
**7 to 11 KB** on top of that. The overage against §10's 90 KB is
framework, not us, and cutting features cannot recover it.

## Contrast

Computed, never judged (§6 law 2, §11). Every text and control pair in
the store clears its floor. Two fixes were needed and both came out of
measurement, not review:

- `--mute` moved from `#83838C` (3.35:1 on paper — **fails** the 4.5:1
  body floor on six separate pairs) to `#6B6B74` (4.71:1). §2's own dark
  value `#6E6E78` was the obvious candidate and measures 4.4985:1 — it
  misses by 0.0015. Still six colours; one of them moved.
- Control boundaries (field underlines, size chips) use `--mute`, not
  `--line`. `--line` is 1.20:1 on paper — correct for a decorative
  section rule, invisible as a form field edge under WCAG 1.4.11.

## Not done yet

- **Product pages are one shared template.** Four bespoke per-design
  layouts are the agreed direction; they need the actual designs.
- **Payment is not wired.** Checkout validates and stops. No keys.
- **Stock does not decrement.** Counts live in `products.ts`; two people
  can buy the last unit. Needs the database.
- **No photography.** Products are rendered as their bound material.
- **Catalogue is placeholder.** Names, prices and stock are proposals.
- **Legal entity is placeholder.** See `src/lib/legal.ts`; the policy
  pages say so on the page until it is filled in.
