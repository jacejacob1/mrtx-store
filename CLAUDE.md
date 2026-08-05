# MRTX CLUB — Design System & Build Rules

**Rename this file to `CLAUDE.md` and put it in the root of the new project.**
Claude Code loads `CLAUDE.md` automatically every session; any other name has to
be pasted in manually each time.

This document is the single source of truth for the MRTX CLUB redesign. It was
written from a working, deployed page (the coming-soon landing at
`github.com/jacejacob1/mrtx-club`), so everything in it has already survived
contact with a real browser and a real deploy pipeline. Where something bit us,
it's written down as a rule rather than a suggestion.

**Stack:** Next.js (App Router) + Tailwind CSS + TypeScript. Deployed on Vercel.

---

## 0. THE TWO STANDING RULES

These apply to every single task, forever, without being re-asked.

### RULE 1 — Ship a git push with every change

After **any** change to the codebase, end your response with a changelog and the
exact commands to push it. Never leave the user to work out the commit message.

Use this template verbatim:

````
### Changed
- <what changed, in plain language, one line each>
- <why, if it isn't obvious>

### Files
- `path/to/file.tsx` — <what happened to it>

```bash
cd <project-root>
git add -A
git commit -m "<imperative summary, max 60 chars>"
git push
```
````

Rules for the commit message: imperative mood ("Add product grid", not "Added"),
no trailing full stop, under 60 characters. If the change is risky or touches
deploy config, say so above the commands.

If the change spans several unrelated concerns, split it into multiple commits
and give the commands in order. Don't bundle a bug fix with a redesign.

### RULE 2 — Verify before claiming

Never say something works because it should. Before reporting a change as done:

- Run `tsc --noEmit` and the linter. Report real output, not assumptions.
- If you changed contrast, colour or a blend mode, **compute the contrast ratio**
  (formula in §6). Do not eyeball it.
- If you changed layout, check it against the breakpoints in §9 — at minimum
  360×780, 834×1194, 1440×900, and a short landscape like 852×393.
- If you can't verify something (no browser, no credentials), **say so plainly**
  and name what remains unchecked. An honest gap beats a confident guess.

---

## 1. WHAT THIS BRAND IS

MRTX CLUB is a design brand that behaves like a members' club. The visual system
is built on one idea: **materials seen through an aperture.**

The tone is quiet, technical and slightly withholding. Think laboratory
documentation and mission telemetry, not streetwear hype. The page is mostly
empty. What's there is precise. Nothing shouts.

Reference points that are *correct*: Apple product pages, Teenage Engineering
manuals, HUD/telemetry readouts, Swiss grid typography.

Reference points that are *wrong*: gradient blobs, glassmorphism, drop shadows
on everything, "AI startup" purple, stock-photo lifestyle imagery, emoji.

---

## 2. COLOUR

Six values. There is no seventh. If you need another, you're solving the wrong
problem.

| Token | Light | Dark | Use |
|---|---|---|---|
| `blue` | `#2563EB` | `#2563EB` | The only accent. Never tinted, never gradient. |
| `paper` | `#F2F2F0` | `#0B0B0D` | Page background |
| `ink` | `#101014` | `#F4F4F2` | Primary text, the wordmark |
| `mute` | `#83838C` | `#6E6E78` | Secondary text, labels, HUD |
| `line` | `#DEDEDA` | `#26262C` | Hairlines, input underlines |
| `white` | `#FFFFFF` | — | Type inside the aperture over dark materials |

`#2563EB` is not a taste decision. The launch film literally displays
`HEX #2563EB / RGB 37, 99, 235` on screen. It's the brand's stated blue. Don't
drift it.

**The blue is a scalpel, not a paint roller.** Per screen it should appear on
roughly three things: the status dot, one hairline or key readout, and the focus
state. A blue button next to a blue heading next to a blue border is wrong.

```js
// tailwind.config.ts
colors: {
  blue:  '#2563EB',
  paper: '#F2F2F0',
  ink:   '#101014',
  mute:  '#83838C',
  line:  '#DEDEDA',
}
```

---

## 3. TYPE

**System stack only. No webfonts. Ever.**

Zero network requests, zero layout shift, and it renders as SF Pro on Apple
hardware — which is exactly the reference. A webfont would cost more than it
adds.

```css
--sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
        "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
```

**Mono is not decoration — it's a semantic.** Anything the machine knows goes in
mono: prices, SKUs, countdowns, sizes, quantities, order numbers, hex values,
HUD readouts, status messages. Anything a human wrote goes in sans.

Numerals that update live (countdowns, cart totals, quantities) **must** carry
`font-variant-numeric: tabular-nums`. Without it the row twitches sideways every
time a digit changes width.

### Scale

Everything is fluid. There are no fixed pixel font sizes in layout.

| Role | Size |
|---|---|
| Display wordmark | `min(72vw, 620px, 96vh)` wide — it's 4:1, cap by height too |
| Page heading | `clamp(28px, 4.5vw, 64px)` |
| Section heading | `clamp(20px, 2.6vw, 32px)` |
| Body | `clamp(15px, 1.1vw, 17px)`, line-height 1.55 |
| Mono readout | `clamp(11px, 1vw, 13px)`, letter-spacing `.16em` |
| HUD / corner label | `10px`, letter-spacing `.18em`, uppercase |

Uppercase always takes letter-spacing (`.14em`–`.34em`). Lowercase never does.

---

## 4. THE WORDMARK

A 20 × 5 pixel grid on a 7px module, traced pixel-for-pixel from the launch
film. **Always inline SVG — never an image file, never a font.** 464 bytes,
crisp at any size, recolourable via `fill`.

```jsx
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 35" role="img" aria-label="MRTX" className={className}>
      <path d="M0 0h7v7h-7zM26 0h7v7h-7zM40 0h22v7h-22zM74 0h29v7h-29zM109 0h8v7h-8zM133 0h7v7h-7zM0 7h13v7h-13zM20 7h13v7h-13zM40 7h7v7h-7zM62 7h7v7h-7zM85 7h7v7h-7zM115 7h7v7h-7zM128 7h7v7h-7zM0 14h7v7h-7zM13 14h7v7h-7zM26 14h7v7h-7zM40 14h22v7h-22zM85 14h7v7h-7zM121 14h8v7h-8zM0 21h7v7h-7zM26 21h7v7h-7zM40 21h7v7h-7zM55 21h7v7h-7zM85 21h7v7h-7zM115 21h7v7h-7zM128 21h7v7h-7zM0 28h7v7h-7zM26 28h7v7h-7zM40 28h7v7h-7zM62 28h7v7h-7zM85 28h7v7h-7zM109 28h8v7h-8zM133 28h7v7h-7z"/>
    </svg>
  );
}
```

Never stretch it, rotate it, outline it, add effects to it, or place it on a
busy background without a finish from §6. `CLUB` when it appears is set in the
sans stack, uppercase, `.18em` tracking — it is not part of the SVG.

---

## 5. THE APERTURE

The signature device. A horizontal slit through which material is visible.

Behind the slit sits a **second, pixel-identical copy of the page** rendered in
a different colour. Outside the band the wordmark is ink on paper; inside, it's
white (or ink) on material. The slit doesn't *cover* the artwork — it
**develops** it, one strip at a time.

### Where it is allowed

| Context | Behaviour |
|---|---|
| Homepage hero | Full effect — tracks the cursor, cuts materials on a timer and on click |
| 404 | Full effect, static material |
| Product images | Reinterpreted — slit sweeps once on hover to reveal the alt shot |
| Route transitions | Reinterpreted — a slit wipes across during navigation, ~380ms |
| Section dividers | A 1px `blue` hairline only. No motion. |

### Where it is banned

**Anywhere the user is trying to read, choose, or pay.** Product listings, cart,
checkout, size guides, account, forms, legal pages. A shop page fighting a
moving band is a bad shop page. On those pages the brand comes from palette,
type, materials-as-stills, and motion timing — not from the slit.

### Implementation

```
#band            position:fixed, height clamp(96px, 19vh, 168px)
                 overflow:hidden, transform:translate3d(0, y, 0)
                 pointer-events:none            ← see §12, this is load-bearing
  #bandInner     height:100vh, transform:translate3d(0, -y, 0)
                 isolation:isolate              ← see §12, also load-bearing
    #tex         the material, transform:translate3d(-drift, +y, 0)
    .lit         the duplicate page copy, inert + aria-hidden
```

Two stacked transforms and an `overflow:hidden`. Nothing repaints — it's all
compositor work. Do not reimplement this with `clip-path` animated per frame;
that repaints and drops frames on mid-range Android.

The duplicate copy **must** carry `inert` and `aria-hidden="true"`, and every
`id` inside it must be stripped, or screen readers announce the whole page twice
and duplicate form fields fight for focus.

---

## 6. MATERIALS & FINISHES

Ten materials, nine cut from the launch film, one generated. They live in
`/public/assets/tx/` — **28 KB for all ten.** Each is a 192px slice mirrored
into a 384×152 tile, so it repeats seamlessly at native resolution at any screen
width. No upscaling, no blur.

Each material meets the wordmark through a **different blend mode**, so the mark
isn't sitting *on* the material — it's made of it.

| # | file | finish | blend | contrast | reads as |
|---|---|---|---|---|---|
| 01 | `rock` | CHISEL | `multiply` | 5.3:1 | cut into stone |
| 02 | `marble` | CARVE | `color-burn` | 4.2:1 | cut deep, veins sharpened |
| 03 | `slab` | EMBOSS | `color-dodge` | 4.9:1 | raised, lit from the front |
| 04 | `grid` | SIGNAL | `screen` | 4.7:1 | burning through |
| 05 | `orbit` | STARLIGHT | `lighten` | 4.1:1 | additive, only brightens |
| 06 | `ink` | STAMP | `darken` | 8.1:1 | pressed into wet paper |
| 07 | `flux` | KNOCKOUT | *none* | 10.8:1 | punched straight through |
| 08 | `silk` | DEBOSS | `hard-light` | 5.7:1 | pressed in, weave intact |
| 09 | `sphere` | INVERT | `difference` | 3.5:1 | the material's opposite |
| 10 | `grain` | HALO | `luminosity` | same blue, lit |

Fills are **semi-transparent on purpose**. The material has to read *through* the
letterform — that's what sells it as depth rather than paint.

### The three laws of finishes

1. **Finishes apply to display type only.** Never to body copy, labels, prices,
   HUD or form text. Small type stays solid ink or solid white with a halo.
2. **Measure, don't eyeball.** Composite the blend formula over the actual
   pixels of the actual texture and compute WCAG contrast. Two of the original
   picks (`overlay` on slab, `soft-light` on silk) looked fine and measured
   2.98:1 and 1.34:1. They were replaced for that reason. **3:1 is the floor for
   display type, 4.5:1 for anything smaller.**
3. **Always provide a fallback.** Wrap finishes in
   `@supports not (mix-blend-mode: multiply)` and fall back to a solid mark. An
   old browser should get something plain, not something half-invisible.

### Where materials belong on the full site

- **Product photography** — shoot or composite garments against these materials.
  They are the brand's world.
- **Category headers** — one material as a full-bleed band, wordmark in its
  finish.
- **Lookbook** — materials as page backgrounds, editorial images floated on top.
- **Loading / empty states** — a still material strip instead of a spinner.
- **Never** behind body copy, tables, forms, or anything with a price on it.

---

## 7. MOTION

One easing curve for everything: `cubic-bezier(.16, 1, .3, 1)`. It's a fast-out,
long-settle curve — things arrive quickly then ease into place. Never `linear`,
never `ease-in-out`.

| Event | Duration |
|---|---|
| Hover / focus state | 250ms |
| Element entrance | 700–900ms, staggered 80–170ms apart |
| Route transition | 380ms |
| Material cut | instant — it's a **cut**, not a fade |
| Shutter jolt after a cut | 260ms, decaying sine |

**Cuts are cuts.** The launch film is a match-cut piece; material changes are
hard frame changes with a one-frame blowout, never crossfades. This is the
single most brand-defining motion decision. Don't soften it.

Auto-advance materials every **2400ms**. Faster is annoying, slower loses the
stop-motion feel.

### `prefers-reduced-motion`

Not an afterthought. When set: no auto-cuts, no drift, no rain, no grain
animation, no parallax. The page stays fully functional and completely legible.
Test it — it's one toggle in macOS Accessibility settings.

---

## 8. THE CURSOR

Matrix rain falling **from** the user's pointer. The real system cursor stays
visible — do not hide it, that was tried and it made the email field feel broken.

- Glyphs spawn 5px right and 15px below the hotspot, so the arrow never covers
  them
- Snapped to a 15px column grid
- Capped at **130 glyphs**, single `<canvas>`, one `requestAnimationFrame` loop
- Blue over paper; burns **white** the instant a glyph crosses into the aperture
- Head glyph of each column gets an 8px glow
- Move faster → rain harder
- Character set: half-width katakana + `0-9A-F` + `MRTX`

**Never initialises on coarse pointers.** `(hover: hover) and (pointer: fine)`
only. On touch it's invisible battery drain.

---

## 9. RESPONSIVE

**No fixed pixel sizes in layout. Only `clamp()` against viewport width, height,
or both.** Breakpoints tighten type and chrome; they never rearrange the design.

| Breakpoint | Purpose |
|---|---|
| `max-width: 900px` | Tablet — tighten HUD, widen form fields |
| `max-width: 600px` | Phone — resize display type, safe-area insets |
| `max-width: 380px` | Narrow — drop optional HUD elements |
| `max-height: 480px` | Short landscape — compress vertical rhythm |

Three rules that are not negotiable:

- **`--vh`, never `100vh`.** iOS Safari's collapsing toolbar makes `100vh`
  taller than the screen and pushes fixed bottom elements off-screen. Write
  `visualViewport.height` into a `--vh` custom property and size everything off
  that. Re-measure on `resize`, `orientationchange`, and
  `visualViewport.resize`, debounced 60ms.
- **Cap wide elements by height too.** The wordmark is 4:1, so
  `min(72vw, 620px, 96vh)`. In landscape the height term binds first and it
  scales proportionally instead of letterboxing inside its own box.
- **Every input is `font-size: 16px` on phones.** Anything smaller and iOS zooms
  the page on focus — and on a fixed-position layout the user cannot zoom back
  out.

Use `env(safe-area-inset-*)` for anything pinned to a screen edge.

---

## 10. PERFORMANCE BUDGET

The coming-soon page ships **21 KB on first paint**. A full store won't match
that, but the discipline carries.

| Metric | Budget |
|---|---|
| First-paint transfer | ≤ 120 KB |
| Total JS (gzipped) | ≤ 90 KB |
| Any single image | ≤ 60 KB |
| Webfonts | **0** |
| LCP on 4G | ≤ 1.5s |
| CLS | ≤ 0.02 |

Rules:

- WebP or AVIF. Always. Use `next/image` with explicit `sizes`.
- Never animate anything but `transform` and `opacity`. If you're animating
  `background-position`, `width`, `top` or `filter` in a loop, you've made a
  mistake — the fix is a wider element and a `translate3d`.
- Preload only the first material. Lazy-load the rest after `load`.
- No animation library. Everything so far is CSS transitions plus one rAF loop.
  If you reach for Framer Motion, justify it in the changelog first.
- No UI kit. No icon package — inline the four or five SVGs actually used.

---

## 11. ACCESSIBILITY

- Contrast is **computed, not judged**. 4.5:1 body, 3:1 display and UI.
- The aperture's duplicate copy is `inert` + `aria-hidden` with all `id`s
  stripped.
- Full keyboard operation. Visible focus rings — `blue`, 2px, `offset: 2px`.
  Never `outline: none` without a replacement.
- Decorative canvas is `aria-hidden` and `pointer-events: none`.
- Form errors are announced (`role="status"`, `aria-live="polite"`) and are
  never colour-only.
- `prefers-reduced-motion` is fully honoured.
- Every product image needs real alt text describing the garment, not "image".

---

## 12. GOTCHAS THAT ALREADY COST US TIME

Read this section before debugging anything that "should work".

**`isolation: isolate` is load-bearing.** `mix-blend-mode` only blends with the
backdrop inside its own isolated group. If the material is a *sibling* of the
element being blended, all ten finishes silently do nothing — no error, no
warning, just a flat mark. The texture must live inside the same isolated group.

**The aperture needs `pointer-events: none`.** It tracks the cursor, so it is
always directly under it. Without this it swallows every click before the
element beneath receives one. The email field appeared completely broken and the
field was fine.

**`vercel.json` allows no comments.** It's validated against
`openapi.vercel.sh/vercel.json`, whose root is `additionalProperties: false`.
Even a `"//"` key fails the build with *"should NOT have additional property"*.
Document config decisions in the README instead.

**`buildCommand: null` means auto-detect, not "no build".** Vercel's schema says
*"When null is used this value will be automatically detected"* — so `null` (and
probably `""`) falls back to whatever's saved in the dashboard. To genuinely skip
a build, use a command that does nothing and exits 0:
`"buildCommand": "echo 'nothing to build'"`.

**Google Forms send no CORS headers.** Waitlist/newsletter posts to a Google Form
must use `mode: "no-cors"`, which returns an **opaque** response — you cannot
tell success from failure. Always keep a `localStorage` copy as a diagnostic, and
never write success copy that promises an email nobody sends.

**Stale Vercel project settings survive a repo rewrite.** A project that was once
React + Vite keeps `vite build` saved as an override. `vercel.json` overrides it;
the dashboard does not update itself.

---

## 13. VOICE

Lowercase. Terse. Never explains itself. Confident without hype.

The success state after joining the waitlist reads:

> **access granted.**
> member no.0042 · keep it to yourself.

Not "Thanks for subscribing! We'll be in touch soon 🎉".

Rules:

- Lowercase for sentences, UPPERCASE for labels and system readouts.
- Never exclamation marks. Never emoji.
- Never promise something the system doesn't do. The waitlist copy deliberately
  never says "check your inbox" because no email is sent — the first person to
  check an empty inbox stops trusting everything else.
- Error messages are dry, not apologetic: *"that's not an email. / nice try
  though"*.
- Product copy: material, weight, fit, origin. Facts, not adjectives.
  *"300gsm combed cotton. boxy. cut and sewn in tirupur."*

---

## 14. PAGE DIRECTION

**Home** — Aperture hero at full effect. Below it, one drop, one lookbook strip,
nothing else. Resist adding sections.

**Shop / category** — Calm grid, 2-up mobile, 3-up desktop. Generous whitespace,
hairline separators. Product name in sans, price in mono. No badges, no "SALE"
starbursts, no hover-zoom. Aperture off.

**Product** — Image left/top, detail right/bottom. Aperture reinterpreted: on
hover a slit sweeps once across the image to reveal the alt shot. Size selector
as mono chips, out-of-stock struck through not hidden. One `blue` element on the
page: the add-to-cart underline.

**Lookbook** — The most expressive surface. Materials as full-bleed backgrounds,
editorial images floated over them, minimal captions in mono. This is where the
system gets to breathe.

**About** — Long-form, single column, `max-width: 62ch`. Body sans, pull-quotes
in the display treatment. One material band as a divider.

**Cart / checkout** — Boring on purpose. Pure ink-on-paper, mono for every
number, zero motion beyond 250ms state changes. Nothing here should ever be
clever.

**404** — Full aperture, static material, `no signal.` in the tagline slot.

---

## 15. ASSETS TO COPY FROM THE COMING-SOON REPO

From `github.com/jacejacob1/mrtx-club`:

```
assets/tx/*.webp     10 materials, 28 KB total  →  public/assets/tx/
assets/noise.webp    paper grain tile, 2.4 KB   →  public/assets/
_source/frames/      30 launch-film stills, for new textures
```

The wordmark path is in §4 — copy it from there, not from the old repo's HTML.

---

## 16. WHEN IN DOUBT

Remove it. This system is defined more by what isn't on the page than what is.
If a decision is genuinely 50/50, pick the quieter option and say so in the
changelog — the user would rather add something back than strip something out.

And if you're about to say something works, re-read RULE 2 first.
