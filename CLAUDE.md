# carlovinci.com.au

Personal portfolio for Carlo Vinci. Front-End Engineer, AI-first developer,
solutions consultant. Its job is to get a hiring manager to reach out.

## Start of every session — read this first

**Check `TODO.md` and tell Carlo what's open on it before starting work.**
He asked to be reminded every time he works on this site. Lead with the count
and the next-up item; don't make him ask.

When something on the list gets done, tick it off in `TODO.md` in the same
change that ships it.

## Shape of the project

Plain static site. No framework, no build step, no bundler.

- `index.html` — the entire site, single page
- `styles.css` — design tokens plus components
- `main.js` — one IIFE: theme, canvas background, nav, sliders, lightbox
- `projects/` — per-project screenshots at 640w / 1280w / full
- `img/logos/` — tech logos used by the services section

Deployed on Vercel from `main`; domain registered at Crazy Domains, DNS
already pointing at Vercel. `vercel.json` carries security headers and
caching. Pushing to `main` deploys.

## Commands

```
npm run lint          # stylelint + htmlhint
npm run format        # prettier --write
./shots.sh            # screenshots, both themes, 3 widths, into .shots/
./shots.sh 1440 dark  # just one
```

There is **no test suite** — only linters. Don't describe a lint pass as
"tests passing".

## Conventions worth keeping

- **Type comes off the scale.** `--fs-3xs` … `--fs-2xl` in `:root`. Don't
  reintroduce loose pixel values; the file previously had 23 sizes, several
  separated by half a pixel.
- **Contrast floor is 4.5:1** for text, 3:1 for meaningful non-text. This has
  been measured, not eyeballed — a cyan-on-pale-blue icon once shipped at
  1.62:1. Compute it before trusting a colour.
- **Durations are derived, never written down.** `CAREER_START` in `main.js`
  feeds `.js-years`. Never hardcode "27 years" anywhere, including meta tags.
- **Material/glass is not free.** Backdrop-filter is already on many surfaces
  and it flattens contrast; don't add more without removing some.
- `cs-` class prefix is legacy from a coming-soon page. Leave it unless doing
  the rename properly.

## Verify visually, not by assertion

`./shots.sh` then read the PNGs. Two real bugs this session were caught only
by looking: filled background blocks that read as skeleton loaders, and
service-card copy that had drifted one position out of step with its heading.
Headless captures can't show hover, scroll animation or cursor effects — ask
Carlo to check those.
