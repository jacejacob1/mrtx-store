# MRTX CLUB — coming soon

One page. One file. No framework, no build step, no dependencies, no tracking.

```
index.html          the entire site — markup, styles, behaviour
assets/
  tx/*.webp         10 materials — 9 cut from the launch film, 1 generated
  noise.webp        paper grain tile
  og.jpg            social share card
_source/            originals — video frames, old logo PNGs. Not deployed.
```

All ten materials together are **28 KB**. First paint is **~20 KB** over the
wire; everything else streams in after.

---

## Run it

Double-click `index.html`. There is nothing to install.

To serve it over http locally (only needed if your browser blocks local file
access to the webp assets):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy it

Drag the folder onto Netlify, Cloudflare Pages, or push to GitHub Pages. No
build command, no output directory. It's static.

### vercel.json — don't delete the top four keys

This project used to be React + Vite, and the Vercel project still has
`vite build` saved as a Build Command override. There's no `package.json` any
more, so that command dies with `vite: command not found` (exit 127). These four
keys override the dashboard and keep it overridden:

```json
"framework": null,
"installCommand": "",
"buildCommand": "echo 'static site - nothing to build'",
"outputDirectory": "."
```

Two things that look wrong but aren't:

- **`buildCommand` is a pointless-looking `echo` rather than `null` or `""`.**
  Per Vercel's schema, `null` means *"this value will be automatically
  detected"* — it would fall straight back to `vite build`. An `echo` exits 0,
  does nothing, and says so in the build log.
- **There are no comments in this file.** `vercel.json` is validated against
  `openapi.vercel.sh/vercel.json`, whose root is `additionalProperties: false`.
  Even a `"//"` key fails the build with *"should NOT have additional property"*.
  Hence this section existing here instead.

The rest of the file sets a week of caching on `/assets/*` with
stale-while-revalidate, plus `nosniff`, `Referrer-Policy` and `X-Frame-Options`.

---

## Config

Everything you'd want to change lives in one block at the top of the `<script>`
in `index.html`:

```js
LAUNCH:   "2026-08-14T12:00:00+05:30"   // Fri 14 Aug 2026, 12 noon IST
FORM_ID:  ""                            // ← paste yours, see below
ENTRY_ID: ""                            // ← paste yours, see below
SEED:     41                            // member numbers start at 0042
```

**`LAUNCH`** drives the countdown in the bottom-left. ISO 8601 with a timezone
offset — `+05:30` is IST. A malformed date makes the HUD say
`SET DATE IN CONFIG` rather than silently counting to the wrong moment.

---

## Collecting emails

Signups go straight into a **Google Form**, which fills a **Google Sheet** with a
timestamp on every row. Free, unlimited, no third party, and the data is yours.

You need two IDs out of Google. It takes about five minutes, once.

### 1. Build the form

1. Go to [forms.new](https://forms.new) — it opens a blank form.
2. Name it something like `MRTX CLUB — waitlist`.
3. Click the existing question. Set the title to `Email` and the type to
   **Short answer**.
4. Open **Settings** (the gear) and confirm all three are **off**:
   - *Collect email addresses*
   - *Limit to 1 response*
   - *Restrict to users in your organisation*

   Any of these being on makes Google require a sign-in, and every submission
   from the site will be rejected — silently, because of the CORS limitation
   described below.

### 2. Get `FORM_ID`

Click **Send** → the link icon (🔗) → copy. You get something like:

```
https://docs.google.com/forms/d/e/1FAIpQLSc8xK.../viewform
                                  └──────┬──────┘
                                    this is FORM_ID
```

Copy the `1FAIpQLSc…` segment. Not the whole URL, not the `/viewform`.

### 3. Get `ENTRY_ID`

In the form editor, click the **⋮** menu (top right) → **Get pre-filled link**.
Type `TEST` into the email box, click **Get link**, then **Copy link**. Paste it
somewhere and look at it:

```
https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform?usp=pp_url&entry.1234567890=TEST
                                                                        └────┬────┘
                                                                        ENTRY_ID
```

Copy **just the digits** — `1234567890`. Not the `entry.` prefix.

### 4. Connect the Sheet

Back in the form, open the **Responses** tab → click the green Sheets icon →
**Create new spreadsheet**. Every signup now appears there as a timestamped row.

### 5. Paste both into `index.html`

```js
FORM_ID:  "1FAIpQLSc8xK...",
ENTRY_ID: "1234567890",
```

Commit, push, and test it once on the live site with your own address. The row
should show up in the Sheet within a second or two.

### The one caveat, and why the backup exists

Google serves no CORS headers on `formResponse`, so the request has to go out as
`mode: "no-cors"`. That works — the row lands — but the browser hands back an
**opaque response**, meaning the page genuinely cannot tell success from failure.
A visitor sees "access granted" either way.

That's why every email is **also** written to the visitor's own browser
(`localStorage`, key `mrtx.queue`). It won't help you recover a stranger's
address, but it makes the failure mode debuggable: if your own test submission
shows up locally and not in the Sheet, the problem is the two IDs or a form
setting, not the page.

To check on any device you've used:

```js
JSON.parse(localStorage.getItem("mrtx.queue"))
```

**The success copy never says "check your inbox"** — a Google Form doesn't send
one. Promising an email that never arrives is the fastest way to lose someone
who just opted in. If you later add a confirmation email, the lines live in the
`WIN` array directly above the submit handler; add it there.

### If you'd rather not use Google

The submit handler is about eight lines. Swap the `fetch` for any endpoint that
accepts a POST — Formspree, Resend, Supabase, Buttondown, your own API. A real
endpoint with CORS headers also gets you genuine success/failure states back,
which the Google route can't give you.

---

## How it works

The launch film is a **slit** — a thin horizontal band of material sliding
between match cuts, wordmark locked in the centre. The page turns that slit into
an instrument.

**The aperture.** A band tracks your cursor down the page. Behind it sits a
second, pixel-identical copy of the page rendered in white. Outside the band the
wordmark is black on paper; inside, white on material. So the slit doesn't
*cover* the artwork — it **develops** it, one strip at a time. Two stacked
`translate3d` transforms and an `overflow:hidden`; nothing repaints.

**The match cut.** Ten materials cutting every 2.4s, or instantly on click, tap,
or keypress. Each cut fires a shutter jolt and a one-frame blowout. The
bottom-right HUD reads out the material, its finish, and its hex.

**The finishes.** Every material meets the wordmark through a different blend
mode, so the mark isn't sitting *on* the material — it's made of it.

| # | material | finish | blend | reads as |
|---|---|---|---|---|
| 01 | moon rock | CHISEL | `multiply` | cut into stone |
| 02 | grey marble | CARVE | `color-burn` | cut deep, veins sharpened |
| 03 | concrete slab | EMBOSS | `color-dodge` | raised, lit from the front |
| 04 | blueprint grid | SIGNAL | `screen` | burning through |
| 05 | low orbit | STARLIGHT | `lighten` | additive, only ever brightens |
| 06 | ink splatter | STAMP | `darken` | pressed into wet paper |
| 07 | flux | KNOCKOUT | *none* | a hole punched straight through |
| 08 | silk | DEBOSS | `hard-light` | pressed in, weave intact |
| 09 | sphere | INVERT | `difference` | the material's exact opposite |
| 10 | grain | HALO | `luminosity` | same blue, lit |

The fills are semi-transparent on purpose — the material has to read *through*
the letterform, which is what sells it as depth rather than paint.

Three things make this work, and two of them are easy to break:

- **`isolation:isolate` on `#bandInner` is load-bearing.** `mix-blend-mode` only
  blends with the backdrop inside its own isolated group, so the material has to
  live in the *same* group as the wordmark. That's why `#tex` sits inside
  `#bandInner` and is counter-translated back into place every frame rather than
  being a sibling. Move it out and all ten finishes silently do nothing.
- **Every finish was measured, not eyeballed.** Each blend formula was
  composited over the actual pixels of its own texture; contrast of mark against
  material lands between 3.5:1 and 10.8:1, all clear of the 3:1 large-text line.
  Two early picks (`overlay` on the slab, `soft-light` on the silk) came in at
  2.98 and 1.34 and were replaced for that reason.
- **The small type never blends.** Eyebrow, tagline, HUD and form stay solid ink
  or solid white with a halo, so legibility holds no matter what the mark does.
  A `@supports not (mix-blend-mode:multiply)` block falls every finish back to a
  plain solid mark for browsers that can't blend.

**The marble is generated, not filmed.** It isn't in the footage — it's built
from layered value noise: long diagonal veins warped by low-frequency
turbulence, a second hairline family crossing them, and broad soft clouding for
the stone body. 4.3 KB, and `color-burn` amplifies its own veining inside the
letters so the carve looks deeper than it is.

**The cursor.** Your normal pointer, untouched — matrix rain just falls out from
under it. Glyphs spawn 5px right and 15px below the hotspot so the arrow never
covers them, snap to a 15px column grid, and are capped at 130 on a single
canvas. Blue over paper, burning white the instant they cross into the aperture.
The head of each column gets a short glow. Move faster, rain harder.

**Weight.** All nine textures together are 24 KB. They're 192px slices mirrored
into 384px tiles, so they repeat seamlessly at native resolution at any screen
width — no upscaling, no blur. Only the first is preloaded; the rest arrive
after `load`.

**Type.** System stack only — SF Pro on Apple, Segoe on Windows, Roboto on
Android. Zero webfont requests, zero layout shift. The `MRTX` wordmark is 33
inline SVG rectangles traced pixel-for-pixel off the film, so it's crisp at any
size and costs 463 bytes.

---

## Things to try

| | |
|---|---|
| Move the mouse | the aperture follows |
| Click anywhere | hard cut to the next material |
| Any key | same |
| `←` | cut backwards |
| Type **MRTX** | inverts the whole signal |
| Scroll / trackpad | drives the aperture too |

Leave it alone and the band drifts on its own.

---

## Behaviour

- **Mobile** — aperture follows your finger, tap to cut, no cursor canvas
  (saves the battery, and there's no pointer to trail anyway).
- **`prefers-reduced-motion`** — no auto-cuts, no rain, no drift, no grain
  animation. Static, legible, complete.
- **No JavaScript** — the wordmark, the words and the form still render.
- **Screen readers** — the aperture copy is `inert` + `aria-hidden`, so the page
  is announced once, not twice.

## Responsive

Every dimension is fluid — there are no fixed pixel sizes in the layout, only
`clamp()` against viewport width, viewport height, or both. Breakpoints at
900px (tablet), 600px (phone), 380px (narrow) and 480px *height* (landscape)
tighten the type and chrome rather than rearranging anything.

The tagline uses a `1fr auto 1fr` grid rather than a centred flex row, so **THE
CLUB** sits on the container's exact centre line — the same axis the wordmark is
centred on. Centring the whole phrase would push it right, because "opening" is
the longer word.

Three more details worth knowing about:

- **`--vh`, not `100vh`.** iOS Safari's collapsing toolbar makes `100vh` taller
  than the screen, which pushes the bottom HUD out of sight. JS writes the real
  `visualViewport.height` into a `--vh` custom property and everything sizes off
  that, re-measured on resize, rotate, and toolbar collapse (debounced 60ms).
- **The wordmark is capped by height, not just width.** It's a 4:1 mark, so its
  width is `min(72vw, 620px, 96vh)` — in landscape the height term binds first
  and it scales down proportionally instead of letterboxing inside its own box.
- **The email input is 16px on phones.** Anything smaller and iOS zooms the
  whole page on focus, which on a fixed-position layout you cannot zoom back out
  of.

Verified by simulating the box model across 15 device sizes, from a 320×568
Android up to a 3440×900 ultrawide. Nothing overflows, and the tagline stays on
one line everywhere — though `flex-wrap` is on, so it would break gracefully if
it ever didn't.

**Performance on mobile:** the material drift runs on `transform` rather than
`background-position`, so it composites instead of repainting the band every
frame. The cursor canvas doesn't initialise at all on coarse pointers. Total
JS is ~9 KB gzipped and there is no framework underneath it.

---

## Brand

| | |
|---|---|
| Blue | `#2563EB` — lifted from the film, which spells it out on screen |
| Paper | `#F2F2F0` |
| Ink | `#101014` |
| Type | system UI stack; mono for every HUD readout |
| Wordmark | 20 × 5 pixel grid, 7px module |

---

## History

This folder used to hold a React + Vite storefront — cart, 3D tee configurator,
lookbook, four routes, a 37 MB `.glb`. All of it is intact in the initial git
commit:

```bash
git log --oneline
git checkout <commit> -- src/          # bring any of it back
```

Nothing was lost. It just isn't what a coming-soon page needs to be.
