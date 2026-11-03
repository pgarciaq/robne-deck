# Resource Optimization for OpenShift — deck repository

Two Marp decks, one screenshot library, one facts sheet:

| Deck | File | Audience | Published |
|---|---|---|---|
| **Customer / field** | `slides-customer.md` | Customers, Solution Architects, TAMs, Sales — read cold, forwarded | **yes** — `/customer.html` |
| **Engineering** | `slides-eng.md` | Engineering colleagues — presented live, 20–30 min + demo | **yes** — `/eng.html` |

Both decks are on GitHub Pages, reached through a static chooser at `/`
(`site/index.html`). Deck A carries issue numbers, lab captures and benchmark
caveats; it is published deliberately, not by accident — the repository is
public, so that material was already readable in Markdown. Anything that must
stay out of the decks stays out of `slides-eng.md`.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (what the Pages workflow runs)
- `npm install`

## Build

```bash
npm run build:customer     # deck B → dist/customer.html  (published)
npm run build:eng          # deck A → dist/eng.html       (published)
npm run build:pdf:customer # deck B → dist/customer.pdf
npm run build:pdf:eng      # deck A → dist/eng.pdf
npm run build:pptx:customer # deck B → dist/customer.pptx
npm run build:pptx:eng     # deck A → dist/eng.pptx
npm run build:handouts     # all four: PDF and PPTX for both decks
npm run preview:site       # decks + handouts + _site/, exactly what CI publishes
npm run serve              # live reload, both decks (see the note below)
```

Output lands in `dist/` (gitignored). Each build script also copies `assets/`
next to the HTML, because Marp keeps image paths relative; opening
`dist/customer.html` or `dist/eng.html` from disk works without a server.

`site/index.html` is the chooser served at `/`. It is static — copied verbatim
into `_site/`, no build step — so it links `customer.html` and `eng.html` as
siblings and must be edited by hand when a deck is added or renamed. Build it
locally with `npm run preview:site`, which assembles `_site/` exactly as CI does.

PDF and PPTX builds pass `--allow-local-files` so images embed — that is what
makes a handout safe to send. Both formats render through a headless browser
(Marp rasterises each slide for PPTX), so they need Chrome installed; the Pages
workflow pins `ubuntu-24.04` for that reason.

`npm run serve` runs Marp's server against `.serve/`, a directory of symlinks
(`scripts/serve.sh`) rather than the repo root. Marp forces a recursive watcher
in server mode, and chokidar takes one inotify instance per watched directory;
pointed at the root that is `node_modules` with ~1,170 directories, against a
per-user cap of `fs.inotify.max_user_instances` (128 by default), so it dies
with `EMFILE: too many open files, watch …`. If it still fails after this, the
desktop session has used every instance — raise the cap once:

```bash
sudo sysctl -w fs.inotify.max_user_instances=1024
echo 'fs.inotify.max_user_instances=1024' | sudo tee /etc/sysctl.d/90-inotify.conf
```

HTML builds then run `scripts/zoomable-images.mjs`: every slide screenshot
becomes clickable, opening in a lightbox at close to the capture's own
resolution (click or Enter opens; Escape or a backdrop click closes; arrows and
space stay with the lightbox while it is up). The wrapper it inserts copies the
image's own box — block vs inline flow, `margin: 0 auto` centring — so a slide
renders identically with and without it; if a theme changes how `section img` is
styled, re-check with a before/after rect diff. PDF builds skip the step by
design: clicking a PDF does nothing, and its images are already embedded at full
resolution.

## Where the numbers come from

`docs/facts.md` is the single source for every quantitative claim in either
deck: value, source, as-of date, and which deck may use it. A number that is
not in that table does not belong in a slide, and anything without a repo
source is labelled *asserted, not verified* — deck B never carries those.

`docs/shot-list.md` does the same for images: what exists, what each capture
leaks, and which deck may show it.

## Layout

```
slides-customer.md          deck B (customer, forwarded cold)
slides-eng.md               deck A (presented live)
themes/rh.css               deck B theme
themes/eng.css              deck A theme
site/index.html             chooser served at / on Pages (static, hand-edited)
scripts/assemble-site.sh    builds _site/ — used by CI and npm run preview:site
scripts/serve.sh            npm run serve (serves .serve/, not the repo root)
scripts/zoomable-images.mjs post-processes the HTML builds for the lightbox
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
