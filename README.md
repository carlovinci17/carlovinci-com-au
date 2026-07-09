# carlovinci.com.au

Source for [carlovinci.com.au](https://carlovinci.com.au/) — Carlo Vinci's personal portfolio site.

## Stack

Static HTML/CSS/vanilla JS, no build step or framework:

- `index.html` — page markup and content
- `styles.css` — design tokens and component styles (light-first, dark via `[data-theme]`)
- `main.js` — theme toggle, lightbox, and marquee behaviour
- `img/`, `projects/` — site and project images

## Tooling

Formatting and linting run via npm scripts (no build step for the site itself — this is dev-only tooling):

```
npm install
npm run format        # Prettier — write
npm run format:check  # Prettier — check only
npm run lint          # Stylelint (CSS) + HTMLHint (HTML)
```

## License

All rights reserved — see [LICENSE](LICENSE). This code and content is not licensed for reuse.
