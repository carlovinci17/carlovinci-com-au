# Website to-do

Ideas and features for carlovinci.com.au. Newest ideas go under **Backlog**;
whatever is being worked on next sits at the top of **Next up**.

**Open: 6** — 1 next up, 2 accessibility, 2 design, 1 code quality.

---

## Next up

### 1. Show tech icons on the project cards

Each project currently lists its stack as text pills (`.tag`). Show the actual
service logos instead, the way the "What I do" cards already do with
`.cs-svc__tools` — so Memory Capture AI visibly shows Claude, Azure and OpenAI
rather than spelling them out.

**The thing to decide first.** The 22 tags across both projects split three
ways, so this can't be a straight swap:

|                                        | Count | Tags                                                                                                                                             |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logo already in `img/logos/`           | 4     | Azure AI Foundry, Claude, MCP Server, OpenAI                                                                                                     |
| Needs a new asset                      | 9     | Azure AI Search, Azure Functions, Azure SQL Database, Azure Speech, Blob Storage, Communication Services, Cosmos DB, SQLAlchemy, Static Web Apps |
| Concept — no logo exists, or ever will | 5     | AI Agents, AI Image Generation, Embeddings, Generative AI, RAG                                                                                   |

Options:

- **Hybrid** — icons for products, keep text pills for concepts. Honest, but
  two visual treatments in one block risks looking unresolved.
- **Icon row + keep tags** — a logo strip like the services cards, with the
  text tags left underneath. Most consistent with what's already there.
- **Icons only** — drop the concept tags entirely. Cleanest look, but loses
  "RAG" and "AI Agents", which are exactly the terms a recruiter searches.

**Assets needed.** 8 of the 9 missing are Azure services; Microsoft publishes
an official Azure architecture icon set covering all of them. SQLAlchemy has
its own mark. Match the existing convention: `img/logos/logo_<name>.svg`,
24×24 render, and add `--dark` / `--white` modifier classes where a mark needs
inverting per theme.

**Watch out for:** `.cs-svc__tools` was originally 7 columns, which forced its
captions down to 9.5px and clipped the longer ones. It's 4 columns now. Don't
recreate that by cramming 11 logos into one row.

---

## Accessibility

- [ ] **Marquee pause control.** The skills band auto-scrolls with no way for a
      keyboard user to stop it (WCAG 2.2.2). Reduced-motion is respected and it
      pauses on hover, but that doesn't help keyboard users. Needs a visible
      pause button — deferred to the redesign because it adds UI.
- [ ] **Re-measure contrast after any visual change.** Every new surface needs
      checking, not assuming.

## Design

- [ ] **Showcase redesign.** Device-framed project screenshots, full-width
      alternating rows. Plan with working specimens:
      https://claude.ai/code/artifact/f85b76aa-be45-465c-b350-5c990e791e88
      Core rule: depth on frames, never on content.
- [ ] **Thin out the glass.** Backdrop-filter is on ~11 surfaces, so it reads as
      haze rather than accent and lowers contrast throughout.
## Code quality

- [ ] **`cs-` class prefix.** Legacy from when this was a coming-soon page.
      Rename properly or leave alone — a half-rename is worse than either.

---

## Backlog

_Nothing yet — add ideas here as they come up._

## Done

- [x] Contrast fixes — service icons 1.62:1 → 4.95:1, `--text-3` 3.78:1 → 4.85:1
- [x] Keyboard access — sliders reachable, lightbox focus trap, carousel pause
- [x] Type scale — 23 loose sizes onto a 9-step ladder
- [x] Marquee skills exposed to screen readers; 6px loop seam fixed
- [x] Service card copy realigned with headings, icons and tool strips
- [x] Vercel deployment config — headers and caching
- [x] "Open to work" removed — badge and availability copy gone from the page,
      dead `.cs-badge` / `.cs-badge--open` / pulse CSS removed with it. This
      also closed the duplicate-badge design item.
