# ROS-OCP Native Engine — Marp Deck

Marp presentation: **Resource Optimization for OpenShift: Native Engine** — replacing Kruize with a high-performance Go recommendation engine.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for `npm` / `npx`)

## Install

```bash
npm install
```

## View in browser (live reload)

```bash
npx @marp-team/marp-cli -s slides.md
```

Or:

```bash
npm run serve
```

## Build HTML

```bash
npx @marp-team/marp-cli slides.md -o dist/slides.html
```

Or:

```bash
npm run build:html
```

## Build PDF

```bash
npx @marp-team/marp-cli slides.md -o dist/slides.pdf --allow-local-files
```

Or:

```bash
npm run build:pdf
```

Output files are written to `dist/` (gitignored).

## Edit

Edit `slides.md` — Marp markdown with `---` slide separators and `<!-- _class: lead -->` for title slides.
