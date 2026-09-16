---
name: visual-review
description: Capture the site with shots.sh and actually look at the PNGs before calling a visual change done. Use after any edit to styles.css, index.html or main.js that affects layout, colour, spacing or content order.
---

# Visual review

**A change is not verified because the reasoning was sound. It is verified
because someone looked at it.** Both of these shipped past careful reasoning and
were caught only by opening the image:

- filled background blocks that read as skeleton loaders — the CSS was correct,
  the result looked broken
- service-card copy sitting one position out of step with its heading — every
  card was individually valid, the pairing was wrong

Neither is detectable from a diff. Capture, then read the files.

## Run it

```bash
./shots.sh              # light + dark, at 500 / 900 / 1440 → .shots/
./shots.sh 1440 dark    # one width, one theme
```

Output is `.shots/<theme>-<width>.png`. Then **Read the PNGs** — the capture is
not the review. Reading one and assuming the rest match is how the two bugs above
survived.

Chrome enforces a ~485px minimum window width on macOS, so a request below that
renders wider than asked and the capture clips. 500 is the practical floor.

Captures are viewport-height, not full-page. Anything below ~1400px tall is
simply absent from the image — if the change is further down the page, the
screenshot may not contain it at all. Check before concluding.

## What to look for

Compare against the previous capture where one exists, and check:

- **Content pairing** — does each heading still sit with its own body copy,
  icons and tool strip? Read them as pairs, not as a list. This is the failure
  mode with the worst track record here.
- **Blocks that read as loading** — a filled rectangle with no content in it
  looks like a skeleton, whatever the CSS intended.
- **Both themes.** Light and dark diverge; dark has less contrast headroom and
  breaks first.
- **All three widths.** The tool strip changes layout twice — 7-column grid
  above 880px, then a 25%-basis flex wrap below 880px and again below 560px.
- **Text that wraps or clips.** `.cs-svc__tool figcaption` is `--fs-3xs` (11px)
  with `white-space: nowrap`; a long caption pushes out rather than wrapping.
- **Spacing rhythm** — uneven gaps between sections read as breakage even when
  every individual value is deliberate.

## What this can't show you

Headless captures render the default, at-rest state. They cannot show hover,
focus, scroll-triggered animation, the cursor effect, the marquee in motion, or
the lightbox and sliders.

`shots.sh` also does not pin the theme the way you might expect from the
filename alone — it renders a temp copy with `data-theme` forced, because
`main.js` reads localStorage / `prefers-color-scheme`, neither reachable from
the Chrome CLI. In headless Chrome `prefers-color-scheme` reports **dark**, so
an unpinned capture is a dark capture regardless of intent.

**Ask Carlo to check anything interactive.** Don't describe it as verified.

## Related

- Colour changed? Run `contrast-check` too — looking at a screenshot does not
  measure a ratio, and this is exactly where eyeballing has failed before.
- There is **no test suite**, only linters (`npm run lint`). Never describe a
  lint pass as "tests passing".
