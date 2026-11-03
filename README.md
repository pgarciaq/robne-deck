# Resource Optimization for OpenShift — deck repository

Two Marp decks, one screenshot library, one facts sheet:

| Deck | File | Audience | Published |
|---|---|---|---|
| **Customer / field** | `slides-customer.md` | Customers, Solution Architects, TAMs, Sales — read cold, forwarded | **yes**, GitHub Pages |
| **Engineering** | `slides-eng.md` | Engineering colleagues — presented live, 20–30 min + demo | no; built and shared locally |

Deck B is the only deck with a public URL. `pages.yml` builds
`slides-customer.md` alone, so engineering material (issue numbers, lab
captures, caveats) cannot reach Pages by accident.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- `npm install`

## Build

```bash
npm run build:customer     # deck B → dist/index.html   (what Pages publishes)
npm run build:eng          # deck A → dist/eng.html
npm run build:pdf:customer # deck B → dist/customer.pdf
npm run build:pdf:eng      # deck A → dist/eng.pdf
npm run serve              # live reload, both decks
```

Output lands in `dist/` (gitignored). Each build script also copies `assets/`
next to the HTML, because Marp keeps image paths relative; opening
`dist/index.html` or `dist/eng.html` from disk works without a server.

PDF builds pass `--allow-local-files` so images embed — that is what makes the
PDF safe to send.

## Where the numbers come from

`docs/facts.md` is the single source for every quantitative claim in either
deck: value, source, as-of date, and which deck may use it. A number that is
not in that table does not belong in a slide, and anything without a repo
source is labelled *asserted, not verified* — deck B never carries those.

`docs/shot-list.md` does the same for images: what exists, what each capture
leaks, and which deck may show it.

## Layout

```
slides-customer.md          deck B (public)
slides-eng.md               deck A (internal)
themes/rh.css               deck B theme
themes/eng.css              deck A theme
assets/screenshots/         captures shared by both decks
docs/facts.md               numbers, sources, as-of dates
docs/shot-list.md           screenshots, caveats, B-safe list
docs/superpowers/           design and implementation plan
archive/                    superseded decks, kept for history
```

## Editing

Marp markdown with `---` separators; `<!-- _class: lead -->` for the dark
title/closing slides in deck B. Slide titles are written as `##`, so the themes
style h2 as the slide heading and keep h1 for the lead slides.

Two Marp gotchas this repo already hit:

- `--theme-set` must come **after** the markdown path. As an array option it
  otherwise swallows the positional argument, prints usage, and exits 0 with no
  output.
- `**bold**` and `*italic*` do not render inside raw HTML blocks (`<div
  class="takeaway">`); use `<strong>` / `<em>` there.
