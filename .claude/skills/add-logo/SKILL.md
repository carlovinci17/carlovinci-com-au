---
name: add-logo
description: Add a tech/product logo to img/logos and place it in a service card tool strip or project card. Use when adding, replacing or theming any brand mark, and when working the "tech icons on project cards" TODO item.
---

# Add a logo

Covers the asset, the markup, and the theme inversion — all three, or the mark
will look wrong in one theme.

## 1. The asset

Save to `img/logos/logo_<name>.svg` — lowercase, hyphens for spaces
(`logo_kontent-ai.svg`, `logo_ms-teams.svg`). SVG preferred; `.webp` exists for
marks only published as raster (`logo_claude.webp`, `logo_react.webp`).

Requirements:

- a `viewBox` (the markup sets the display size, so `width`/`height` on the root
  can be `1em` or absent — never a hardcoded px that fights the 24×24 render)
- renders correctly at 24×24; strip detail that turns to mush at that size
- keep it small. Most here are under 4KB; `logo_postman.svg` at 16KB is the
  outlier, not the target
- keep the official mark's proportions — don't restyle brand assets

`fill="currentColor"` does **not** work. These load through `<img>`, which is an
isolated document, so `currentColor` resolves to black rather than inheriting
page colour. `logo_mcp.svg` is built that way, which is exactly why it needs the
`--dark` modifier below.

## 2. The markup

One `<figure>` per logo inside `.cs-svc__tools`:

```html
<figure class="cs-svc__tool">
  <img
    src="img/logos/logo_azure.svg"
    alt="Microsoft Azure"
    width="24"
    height="24"
    loading="lazy"
  />
  <figcaption>Azure</figcaption>
</figure>
```

- `width`/`height` are always `24` — `htmlhint` also requires `alt`
- `alt` is the full product name ("Microsoft Azure", "Anthropic Claude")
- `<figcaption>` is the short label ("Azure", "Claude") and must stay short:
  it renders at `--fs-3xs` (11px) with `white-space: nowrap`, so a long caption
  pushes the grid out instead of wrapping

## 3. Theme inversion

A single-colour mark disappears against one of the two themes. Pick a modifier
on the `<figure>`, not the `<img>`:

| Mark        | Class                 | Effect                  |
| ----------- | --------------------- | ----------------------- |
| Black fill  | `cs-svc__tool--dark`  | inverted on dark theme  |
| White fill  | `cs-svc__tool--white` | inverted on light theme |
| Full colour | _(none)_              | left alone              |

```
<figure class="cs-svc__tool cs-svc__tool--dark">
```

Defined at `styles.css:1592`. Current users: MCP, OpenAI, Vercel (`--dark`),
REST API (`--white`).

Verify both themes — `filter: invert(1)` on a mark that isn't actually
monochrome produces a colour, not a flip.

## 4. Don't overfill the row

`.cs-svc__tools` is `repeat(7, 1fr)` above 880px, dropping to a flex wrap at
`calc(25% - 8px)` below 880px and `calc(25% - 9px)` below 560px.

It was originally 7 columns on all widths, which squeezed captions to 9.5px and
clipped the longer ones. Adding an eighth item to a row recreates that. If a
card needs more marks than fit, change the grid deliberately — don't cram.

## Checks

```bash
npm run lint     # htmlhint enforces alt-require
./shots.sh       # then read .shots/light-*.png and .shots/dark-*.png
```

Look at both themes at 1440 and 500 — the inversion and the wrap are the two
things that go wrong, and neither shows up in the diff.

## Note on the project-card TODO

The open TODO item wants logos on project cards, where 22 tags split into 4 with
existing logos, 9 needing new assets (8 are Azure services — Microsoft publishes
an official architecture icon set), and 5 that are concepts with no mark and
never will have one (AI Agents, AI Image Generation, Embeddings, Generative AI,
RAG). **The treatment for those five is undecided and Carlo's call** — dropping
them loses the exact terms a recruiter searches for. Read `TODO.md` and ask
before building.
