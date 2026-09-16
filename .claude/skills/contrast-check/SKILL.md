---
name: contrast-check
description: Measure real text contrast ratios on the rendered page, in both themes, per WCAG AA. Use whenever a colour, token, surface, opacity or background changes — or before shipping any visual change — instead of eyeballing or hand-calculating a ratio.
---

# Contrast check

The house rule is a **4.5:1 floor for text, 3:1 for meaningful non-text**, measured
rather than assumed. A cyan-on-pale-blue icon once shipped at 1.62:1 because it
looked fine. Run the numbers.

## Run it

```bash
.claude/skills/contrast-check/contrast.sh            # both themes @ 1440
.claude/skills/contrast-check/contrast.sh dark       # one theme
.claude/skills/contrast-check/contrast.sh light 900  # theme + viewport width
```

Exit `0` = everything measured is at or above its floor, `1` = a real failure,
`2` = Chrome missing, `3` = the page failed to load.

Check both themes. A token can pass in light and fail in dark — `--text-3` sits
at 4.79:1 light and 4.65:1 dark, so dark has less headroom and fails first.

## Reading the output

```
148 measured · 0 below floor · 0 below floor behind blur · 8 unmeasurable · lowest 4.65:1
```

- **FAIL** — measured below its floor. Fix it.
- **WARN** — below floor, but the text sits over a `backdrop-filter` surface.
  The blur is ignored when flattening, so the number is an estimate. Treat it as
  "go look at this", not a verdict.
- **????** — the backdrop is a gradient, so there is no single colour to measure
  against. Currently 8 nodes: `.cs-hello`, `.btn--primary`, and the
  `.contact-card` block. These need a screenshot and a human eye.

The floor is picked per element: 3:1 for large text (≥24px, or ≥18.66px at
weight ≥700), 4.5:1 otherwise.

## How it works, and why it's built that way

`contrast.sh` renders a throwaway copy of `index.html` with the theme pinned —
the same trick `shots.sh` uses, because `main.js` picks the theme from
localStorage / `prefers-color-scheme` and neither is reachable from the Chrome
CLI. `audit.js` runs inside that page; `report.py` formats what comes back out
of `--dump-dom`.

Two decisions worth not undoing:

**Colours are composited on a canvas, never parsed.** The tokens are `oklch()`
and `color-mix()`, surfaces stack translucent layers, and `getComputedStyle`
returns whatever serialisation Chrome likes — a `color-mix` comes back as
`oklab(0.51555 0.197962 264.183 / 0.11)`. Painting the stack into a 1×1 canvas
and reading the pixel gets the colour a person actually sees, with the alpha
blending done by the browser.

**The page is forced to settle before anything is measured.** Two traps:

1. Theme colours transition over 0.4s. Read too early and `getComputedStyle`
   returns the _previous_ theme's colour. The first version of this script
   reported light-theme text sitting on the dark background for exactly this
   reason — `.site-bg` still read `oklab(0.165 …)` while `--bg` had already
   resolved light.
2. `.reveal` starts at `opacity: 0` and only gains `.in` from an
   IntersectionObserver, so most of the page reads as hidden.

`audit.js` injects `transition: none`, forces `.in` onto every `.reveal`, and
waits for `load`. Don't replace that with a longer timeout — headless
Chrome's virtual clock makes timing-based waits unreliable.

## Sanity check

If you change the maths, verify against a known value. Setting `--text-3` to
`oklch(0.6 0.01 260)` — the value that was measured by hand at 3.78:1 before it
was fixed — must make the script report ~3.79:1:

```bash
sed -i '' 's|--text-3: oklch(0.54 0.01 260);|--text-3: oklch(0.6 0.01 260);|' styles.css
.claude/skills/contrast-check/contrast.sh light | tail -1
git checkout -- styles.css
```

## Limits

Only text that is a direct child text node of an element gets measured, in the
default state. Not covered: hover, focus and active colours; the animated star
canvas drawn into `.site-bg` (the flat `--bg` beneath it is used); non-text
contrast for icons and borders, which still has to be reasoned about by hand
against the 3:1 floor.
