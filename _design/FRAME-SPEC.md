# MRTX home frames — delivery spec

One master per frame. I derive every device size, orientation and format
from it. Nothing here is a preference; the numbers come from the crop
maths at the bottom.

Drop `mrtx-frame-guide-2560.png` into your PSD as a top layer, align to
it, hide it before export.

---

## Canvas

| | |
|---|---|
| Size | **2560 × 2560 px**, square |
| Colour | sRGB, 8-bit, profile embedded |
| Background | fully opaque — no transparency anywhere |
| Format | PNG (or TIFF / flattened PSD) |
| Naming | `mrtx-01.png` … `mrtx-08.png` |

Don't pre-compress. Give me the largest clean file you have; I handle
WebP/AVIF, the responsive sizes and the weight budget.

## The mark box — pixel-exact

The MRTX wordmark must sit **here**, identically in all eight. This is
the whole match cut; a few pixels of drift reads as a jitter.

| | |
|---|---|
| Size | **720 × 180 px** (the mark is exactly 4:1) |
| Left / right | x **920** → **1640** |
| Top / bottom | y **1190** → **1370** |
| Centre | **1280, 1280** — dead centre of canvas |

The wordmark is a 20 × 5 module grid, so 720 / 20 = **36 px per module**.
The guide layer draws that grid — letterforms should land on it.

## Core safe zone

**1152 × 1097 px, centred** — x 704→1856, y 731→1829.

This is the only region guaranteed visible on every device. Anything
essential — a face, the product, the thing the shot is about — must sit
inside it. Everything outside is bleed that some devices will crop.

---

## What each device actually sees

Cover-cropped from the 2560 master, centre-anchored:

| Viewport | Aspect | Visible region | Mark reads as |
|---|---|---|---|
| Ultrawide monitor | 21:9 | 2560 × 1097 | 28 vw |
| Desktop / laptop | 16:9 | 2560 × 1440 | 28 vw |
| MacBook | 3:2 | 2560 × 1707 | 28 vw |
| Tablet landscape | 4:3 | 2560 × 1920 | 28 vw |
| Square | 1:1 | 2560 × 2560 | 28 vw |
| Tablet portrait | 3:4 | 1920 × 2560 | 38 vw |
| Phone | 9:16 | 1440 × 2560 | 50 vw |
| Tall phone | 9:20 | 1152 × 2560 | 63 vw |

The mark grows on narrow screens and settles on wide ones, which is the
behaviour §9 already specifies for the SVG wordmark.

## Why square

With one master and `object-fit: cover`, a viewport wider than the master
crops top and bottom; a viewport taller crops the sides. The worst-case
crop is minimised when the master aspect is the geometric mean of the
two extremes you support:

```
widest supported   21:9  = 2.333
tallest supported  9:20  = 0.450
geometric mean     √(2.333 × 0.450) = 1.025  ≈  1:1
```

Any other aspect makes one orientation measurably worse. A 16:9 master
would show only 24% of its width on a tall phone; a 9:16 master would
show 24% of its height on an ultrawide.

---

## If you'd rather not extend the canvas

Your current frames are 0.568 aspect (tall). Squaring them means either
generating new content at the sides or cropping the composition top and
bottom.

The alternative is **two crops per frame** — one portrait (9:16), one
landscape (16:9), same mark box rules scaled to each canvas. I switch
between them with `<picture>` at a 1:1 breakpoint. Better framing, 16
files instead of 8. Your call; say which and I'll respec.

## What I already know about your current eight

I template-matched the wordmark in all eight uploads before asking for
anything. They are already aligned to within **~1%** — centre 0.4964 to
0.5066 on x, width 0.2016 to 0.2047. Whoever generated them used a
consistent template.

So this is not a rescue job. The residual jitter is small enough that if
extending to square is a hassle, I can normalise the existing files
myself and you'd only notice the difference on a large screen.

## Weight

Eight full-bleed photographs is 570 KB at good quality, against §10's
120 KB first-paint budget. Only the first frame is preloaded; the rest
arrive after `load` and are double-buffered so a cut never shows a gap.
Worth knowing before we commit to eight — six would be lighter and the
rotation would still not feel short.
