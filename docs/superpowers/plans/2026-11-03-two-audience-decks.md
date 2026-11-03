# Two-Audience ROBNE Deck Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale single-audience `slides.md` in `pgarciaq/robne-deck` with two Marp decks — `slides-eng.md` (engineering, ~16 slides + appendix, built locally) and `slides-customer.md` (~13 slides, Red Hat-branded, published to Pages) — both fed from one facts sheet and one screenshot library.

**Architecture:** Markdown + Marp CLI only. Every number in either deck resolves to a row in `docs/facts.md`; every image resolves to a file under `assets/screenshots/`. Deck B never references an issue, repo path, or internal caveat. `pages.yml` builds deck B alone, so the public artifact can never expose engineering content.

**Tech Stack:** `@marp-team/marp-cli` ^4.1.2, Node 20, GitHub Actions Pages, CSS themes (no remote assets).

**Spec:** `docs/superpowers/specs/2026-11-03-two-audience-decks-design.md` (approved 2026-11-03)

## Global Constraints

- Node 20; `@marp-team/marp-cli` ^4.1.2 — no new build tooling.
- Deck B is **forwarded with uncontrolled distribution**: no issue numbers, no repo paths, no benchmark caveats, no Kruize narrative, no hostnames, no cluster UUIDs, no `e2e-*` / `hc-e2e-*` / `hcp-ingest-*` strings in its images or text.
- Deck B carries an as-of date line on the title slide and in the footer: `as of November 2026`.
- Deck A keeps engineering honesty: issue references, verified-vs-asserted labels, open caveats.
- A quantitative claim that has no `docs/facts.md` row does not go on a slide.
- All screenshot paths are relative (`assets/screenshots/x.png`) so both HTML and PDF builds work; PDF builds use `--allow-local-files`.
- Repo stays the existing public repo; no new repository, no second Pages site.
- `slides.md` is archived, not deleted, so the previous public artifact stays reconstructible.

## Review Focus

- **A number present in a deck but absent from the facts sheet** — a reader cannot audit it, and the two decks drift apart on the next edit. Every number must trace to a row.
- **Internal identifiers in deck B** — an issue number, a repo path, a cluster UUID, or a test-cluster name that survives a text edit or rides along inside a screenshot.
- **Slides that need a narrator** — deck B is read cold months later; a slide whose meaning depends on the talk track fails.
- **Facts that moved since 2026-11-03** — the facts sheet must carry an as-of date per row, so a later reader knows what to re-verify.
- **Marp silently dropping content** — raw HTML blocks, oversized grids, and images with absolute paths render fine in HTML but break or vanish in PDF.

---

### Task 1: Facts sheet and shot-list status

**Files:**
- Create: `docs/facts.md`
- Modify: `docs/superpowers/specs/2026-11-03-two-audience-decks-design.md:199-209` (shot list → point at `docs/shot-list.md`)
- Create: `docs/shot-list.md`

**Interfaces:**
- Produces: `docs/facts.md` rows keyed by claim family (`scale`, `performance`, `coverage`, `governance`, `quality`), each with columns `Claim | Value | Source | As of | Deck` where `Deck` ∈ `A`, `B`, `A+B`.
- Produces: `docs/shot-list.md` entries `Shot | Slide (A/B) | File | Status` where `Status` ∈ `captured`, `captured-with-caveat`, `missing`.

- [ ] **Step 1: Transcribe the design's facts table into `docs/facts.md`**

Every row of the design document's "Facts refresh" table becomes one row, with its source path and `2026-11-03` as-of date. Add rows for the claims deck A makes that the table does not cover (page-1 latency, cold start, RAM, keyset pagination, coverage counts by plugin) by reading each value from the repo and recording where it came from.

- [ ] **Step 2: Mark verified vs asserted**

For each row, `Source` names a file, a docs-site page, or an issue URL. A row whose value could not be re-read from a source gets `As of: unverified` and `Deck: A` — it may appear in deck A with the words "asserted, not verified" and must not appear in deck B.

- [ ] **Step 3: Write `docs/shot-list.md` from what exists**

List the ten design shots. Set `Status: captured` for `c1-container-sno.png` (container list with savings), `d1-detail-postgres.png` (detail page), `e1-node-sno.png` (node tab), `e2-storage-sno.png` (storage tab). Set `captured-with-caveat` for `b6-fleet-heatmap.png` and `b5-hcp.png` (test-cluster names visible — deck A only), `c2-namespace-sno.png` (single row, missing-value markers). Set `missing` for the settings/business-hours shot and the `robne` terminal shot.

- [ ] **Step 4: Verify no claim is orphaned**

Run: `grep -c "^|" docs/facts.md`
Expected: at least 20 rows. Then check each `Deck: A+B` or `Deck: B` row has a `Source` that starts with a path or `https://`; fix any row that does not.

- [ ] **Step 5: Commit**

```bash
git add docs/facts.md docs/shot-list.md docs/superpowers/specs/2026-11-03-two-audience-decks-design.md
git commit -m "docs: facts sheet and screenshot inventory for the two decks"
```

---

### Task 2: Screenshot library and the two missing captures

**Files:**
- Create: `assets/screenshots/*.png` (copied and renamed)
- Create: `assets/screenshots/robne-cli.png`
- Modify: `docs/shot-list.md`

**Interfaces:**
- Consumes: `docs/shot-list.md` `File` column.
- Produces: asset names used verbatim by both decks: `container-list.png`, `container-detail.png`, `node-tab.png`, `storage-tab.png`, `fleet-heatmap.png`, `hcp-tab.png`, `namespace-tab.png`, `robne-cli.png`.

- [ ] **Step 1: Copy and rename the captured shots**

```bash
mkdir -p assets/screenshots
cp /tmp/opencode/capture/c1-container-sno.png assets/screenshots/container-list.png
cp /tmp/opencode/capture/d1-detail-postgres.png assets/screenshots/container-detail.png
cp /tmp/opencode/capture/e1-node-sno.png assets/screenshots/node-tab.png
cp /tmp/opencode/capture/e2-storage-sno.png assets/screenshots/storage-tab.png
cp /tmp/opencode/capture/c2-namespace-sno.png assets/screenshots/namespace-tab.png
cp /tmp/opencode/capture/b6-fleet-heatmap.png assets/screenshots/fleet-heatmap.png
cp /tmp/opencode/capture/b5-hcp.png assets/screenshots/hcp-tab.png
```

- [ ] **Step 2: Fix the settings capture (business hours)**

The settings route rendered an empty body. Open `https://cost-onprem-ui-cost-onprem.apps.sno.karmalabs.corp/openshift/cost-management/settings` after logging in through Keycloak (`admin`/`admin`, realm `cost-management`), wait for the Settings sub-navigation, and capture the sub-tab that shows business hours. If the page stays empty, record `Status: missing` with the observed symptom rather than shipping a blank image.

- [ ] **Step 3: Capture the `robne` terminal shot**

Run, from `~/dev/koku/ros-ocp-backend`:

```bash
./bin/robne recommend --input scripts/samples/ros-ocp-usage.csv --format table --plugins container
```

Rasterize the output into a terminal-styled page (dark background, monospace, no real shell prompt path that contains a hostname or username) and screenshot it with Playwright at 1600×900 into `assets/screenshots/robne-cli.png`.

- [ ] **Step 4: Verify no asset leaks an identifier**

Run: `ls -l assets/screenshots/`
Expected: every file from Step 1 present plus the two new ones. Then read `container-list.png` and `container-detail.png` and confirm neither shows a hostname; they show the cluster alias `sno` only. Record in `docs/shot-list.md` which assets are B-safe.

- [ ] **Step 5: Commit**

```bash
git add assets/screenshots docs/shot-list.md
git commit -m "assets: screenshot library for the engineering and customer decks"
```

---

### Task 3: Themes and build scripts

**Files:**
- Create: `themes/eng.css`
- Create: `themes/rh.css`
- Modify: `package.json:5-10`

**Interfaces:**
- Produces: `npm run build:eng`, `build:customer`, `build:pdf:eng`, `build:pdf:customer`, `serve`.
- Produces: CSS theme files referenced by front-matter `theme:` values `eng` and `rh`, so `marp --theme-set themes/` finds them.

- [ ] **Step 1: Write `themes/eng.css`**

Carry over the current deck's minimal look (white background, 1.1em body, 0.65em tables) and add one footer rule that renders the as-of date, so deck A and deck B share a visual grammar without sharing branding.

- [ ] **Step 2: Write `themes/rh.css`**

Red Hat approximation: `#EE0000` accent, `#151515` dark title and closing slides, light content slides, dark footer rule with `as of November 2026`, sans-serif stack ending in `Red Hat Text, Helvetica Neue, sans-serif`. No font downloads — fallbacks only.

- [ ] **Step 3: Replace the build scripts**

`package.json` scripts become:

```json
"serve": "marp --no-stdin --theme-set themes/ -s .",
"build:eng": "marp --no-stdin --theme-set themes/ slides-eng.md -o dist/eng.html",
"build:customer": "marp --no-stdin --theme-set themes/ slides-customer.md -o dist/index.html",
"build:pdf:eng": "marp --no-stdin --theme-set themes/ slides-eng.md -o dist/eng.pdf --allow-local-files",
"build:pdf:customer": "marp --no-stdin --theme-set themes/ slides-customer.md -o dist/customer.pdf --allow-local-files"
```

- [ ] **Step 4: Verify the themes resolve**

Run: `npx marp --no-stdin --theme-set themes/ --version && ls themes/`
Expected: version prints (4.x) and both CSS files listed. A theme-set path error fails here, before any slide exists.

- [ ] **Step 5: Commit**

```bash
git add themes package.json package-lock.json
git commit -m "build: two-theme Marp setup with separate eng and customer targets"
```

---

### Task 4: Deck A — `slides-eng.md`

**Files:**
- Create: `slides-eng.md`
- Test: `npm run build:eng`

**Interfaces:**
- Consumes: `docs/facts.md` rows with `Deck: A` or `A+B`; `assets/screenshots/robne-cli.png`, `fleet-heatmap.png`, `hcp-tab.png`.
- Produces: `dist/eng.html` (local distribution only; never published).

- [ ] **Step 1: Write the 16 core slides**

Follow the design's Deck A outline (slides 1–16) verbatim for order and topic. Each slide: one claim per bullet, every number copied from `docs/facts.md` rather than typed from memory, and an `<!-- as of 2026-11-03 -->` comment on any slide whose number ages.

- [ ] **Step 2: Write the E2E quality slide to the authoritative framing**

Numbers: 371 passed / 51 failed / 55 errors / 426 skipped / 99 deselected of 1,002 on 2026-11-01; environmental signatures were Keycloak `invalid_grant` and cluster-API `i/o timeout`; root-cause attribution incomplete; the run is not a release baseline; last fully green run 477 passed (Jul 2026). No stronger claim. Source row: `quality` in `docs/facts.md`.

- [ ] **Step 3: Add the appendix**

Appendix slides for Q&A jumps: feature-comparison tables, security controls, operational robustness, plugin architecture, HCP wave detail, zombie/business-hours refinements, CLI and library pointers. Tables may be wide here — this deck is read on a laptop or projected in a room, not forwarded.

- [ ] **Step 4: Build and check page count**

Run: `npm run build:eng`
Expected: `dist/eng.html` written, no Marp warnings about missing images or unknown themes. Then run `grep -c "^---$" slides-eng.md` and confirm the slide count matches the outline (16 core + appendix).

- [ ] **Step 5: Commit**

```bash
git add slides-eng.md
git commit -m "deck: state-of-the-native-engine deck (engineering audience)"
```

---

### Task 5: Deck B — `slides-customer.md`

**Files:**
- Create: `slides-customer.md`
- Test: `npm run build:customer`

**Interfaces:**
- Consumes: `docs/facts.md` rows with `Deck: B` or `A+B` only; B-safe assets from `docs/shot-list.md`.
- Produces: `dist/index.html` (the published Pages artifact).

- [ ] **Step 1: Write the 13 slides**

Follow the design's Deck B outline. Every slide gets a standalone takeaway line at the top, because the deck is read without a narrator. Use `class: lead` for the title and closing slides so the `rh` theme's dark treatment applies.

- [ ] **Step 2: Place screenshots only where the asset is B-safe**

`container-list.png` (slide 5, savings), `container-detail.png` (slide 8, why), `node-tab.png` and `storage-tab.png` (slide 9, whole estate), `robne-cli.png` only if deck A's local-mode story is wanted here — default is omit. Do **not** use `fleet-heatmap.png` or `hcp-tab.png` while `docs/shot-list.md` marks them `captured-with-caveat`.

- [ ] **Step 3: Write the roadmap slide from public docs-site items only**

Eligible items: `docs-site/architecture/plugin-phases.md` (java/jvm, Go advisory, HPA/VPA, binpacking, MachineSet tiers), `docs-site/architecture/librobne.md` (robne-operator on-cluster mode), `docs-site/architecture/ecosystem-comparison.md` (positioning). Phrase each as planned/under consideration, never dated-committed. Nothing else qualifies.

- [ ] **Step 4: Leakage check**

Run: `grep -nEi "#[0-9]{2,}|docs-site|internal/|ADR-0|e2e-|hc-e2e|hcp-ingest|localhost|\.corp|\.svc|github\.com" slides-customer.md`
Expected: no output. Then `grep -n "as of November 2026" slides-customer.md` — expected: at least two hits (title and footer rule).

- [ ] **Step 5: Build and commit**

Run: `npm run build:customer`
Expected: `dist/index.html` written, no missing-image warnings.

```bash
git add slides-customer.md
git commit -m "deck: customer-facing resource optimization deck"
```

---

### Task 6: Publish deck B only, archive the old deck, document the split

**Files:**
- Modify: `.github/workflows/pages.yml`
- Create: `archive/slides-2026-10-05.md`
- Delete: `slides.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `dist/index.html` from `npm run build:customer`.
- Produces: a Pages artifact whose root is deck B; deck A has no public URL.

- [ ] **Step 1: Archive the old deck**

```bash
mkdir -p archive
git mv slides.md archive/slides-2026-10-05.md
```

- [ ] **Step 2: Reduce the Pages trigger and target**

`pages.yml` keeps `workflow_dispatch` and `master` only — drop the phase-branch trigger. The build step becomes `npm run build:customer`, and the artifact copy becomes `cp dist/index.html _site/index.html`. Nothing else in the workflow changes.

- [ ] **Step 3: Document the split in `README.md`**

State: two decks; deck B is what Pages serves; deck A is built locally with `npm run build:eng` and shared as PDF/HTML; `docs/facts.md` is the single source for numbers; `archive/` holds the superseded deck.

- [ ] **Step 4: Verify the workflow cannot publish deck A**

Run: `grep -nE "slides-eng|build:eng" .github/workflows/pages.yml`
Expected: no output. Then `grep -n "build:customer" .github/workflows/pages.yml` — expected: one hit.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/pages.yml README.md archive/ slides.md
git commit -m "ci: publish the customer deck to Pages; archive the superseded deck"
```

---

### Task 7: Whole-branch verification

**Files:**
- Test: both builds, the leakage check, and a visual pass over every slide.

- [ ] **Step 1: Build both decks and both PDFs**

Run: `npm run build:eng && npm run build:customer && npm run build:pdf:eng && npm run build:pdf:customer`
Expected: four files in `dist/`, no Marp warnings. Then run `pdfimages -list dist/customer.pdf | wc -l` and confirm it is greater than 1 — a PDF with zero embedded images means Marp dropped the screenshots (absolute paths or `--allow-local-files` missing).

- [ ] **Step 2: Re-run the leakage check on the rendered artifact**

Run: `grep -cE "#[0-9]{2,}|docs-site|ADR-0|e2e-|hcp-ingest" dist/index.html`
Expected: `0`. A hit means text or an image alt-title carried internal phrasing through to the published page.

- [ ] **Step 3: Read both decks end to end as a stranger**

Deck B: every slide understandable with no narrator and no prior context. Deck A: no claim presented as verified that lacks a `docs/facts.md` row with a source.

- [ ] **Step 4: Confirm the facts sheet covers every number**

Pick five numbers at random from `slides-customer.md` and locate each in `docs/facts.md`. A miss means either the slide or the sheet is wrong — fix the sheet first, then the slide.

- [ ] **Step 5: Report**

Post a completion table: task, what changed, verification command and its output, and anything asserted rather than verified. Do not push until the owner approves.

---

## Notes for the executor

- Screenshots under `assets/screenshots/` were captured from the on-prem SNO lab on 2026-11-03. `fleet-heatmap.png` and `hcp-tab.png` show test-cluster names (`e2e-*`, `hc-e2e-1`); the owner chose to ship what was captured, so they are acceptable **in deck A only**. If the owner later wants them in deck B, the lab data has to be cleaned first — the UI cluster filter does not reach the fleet heatmap.
- The lab's cluster filter by alias returns 503 on five endpoints (tracked as ros-ocp-backend#790); `node-tab.png` and `storage-tab.png` were captured by filtering on the cluster UUID instead, which is why those screenshots show a UUID chip and a UUID in the cluster column.
- Deck A's 100K re-run caveat (#518) is still open as of 2026-11-03. Do not remove it because the slide reads better without it.
