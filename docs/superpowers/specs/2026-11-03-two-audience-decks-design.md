# Two-Audience ROBNE Deck Overhaul — Design

**Date:** 2026-11-03
**Status:** Draft — awaiting owner review
**Repo:** `pgarciaq/robne-deck` (Marp, Node 20, GitHub Pages on `master` push)

## Intent and why

The current single deck (`slides.md`, last touched 2026-10-05) is an
engineering-flavored "Native Engine" overview that is 194 commits behind
`ros-ocp-backend`. It serves neither audience well:

- **Audience A** (Engineering colleagues who knew the Kruize era, doubted
  Kruize, and welcome a faster, more complete engine — local mode is the
  hook) gets stale numbers and a flat 34-slide structure that does not fit
  its real use: **"state of the native engine" sessions, 30 min
  presentation + live demo.**
- **Audience B** (customers and potential customers rightsizing OpenShift
  estates; Solution Architects, TAMs, Sales) gets Kruize history they never
  lived, 0.65em comparison tables, and internal material (issue numbers,
  open benchmark caveats) that must not reach them. Deck B is **presented
  live but sent afterward, with uncontrolled distribution** — it must read
  cold, months later, without a narrator.

**Decision (owner, this conversation):** two decks in one Marp repo, sharing
a theme asset base, a screenshot library, and — critically — one facts
sheet so numbers never diverge.

## Goals

1. **Deck A** (`slides-eng.md`): state-of-the-native-engine briefing.
   ~16 core slides for ~20 min of talking + demo hand-off, plus an
   appendix for Q&A. Engineering-honest: issue references, caveats,
   verified-vs-asserted distinctions. Local mode (`robne` CLI, `librobne`)
   promoted to the demo's opening hook.
2. **Deck B** (`slides-customer.md`): ~13 slides, value-first, Red
   Hat-branded (owner decision), self-reading when forwarded, date-stamped,
   zero internal leakage, conservative phrasing of performance claims.
   Includes positioning vs Kueue / DRA / KEDA (from the public docs page).
3. **Facts refresh** across both decks to the verified state of
   2026-11-03 (see Facts refresh table below).
4. **Shared infrastructure:** `docs/facts.md` as the single source for
   every number that appears in either deck; `assets/screenshots/` library;
   per-deck build scripts.

## Non-goals

- Not migrating away from Marp or the existing repo.
- Not automating screenshot capture (owner takes screenshots by hand).
- Not redesigning `docs-site` or any product documentation.
- Not achieving official Red Hat brand-kit fidelity (approximation only,
  since Marp is not a brand tool — marked as the designer's call).

## Anti-goals (failure even if it technically works)

- A number that differs between the two decks.
- Any internal reference (issue number, repo path, open-benchmark caveat,
  fork strategy) surviving into deck B.
- Deck A sanitized to make it "safe" — its honesty is its value.
- Deck B slides that only make sense with a narrator present.

## Constraints

- **Medium:** Marp CLI (`@marp-team/marp-cli` ^4.1.2), Node 20. Slides are
  markdown with HTML/CSS escapes — no binary tooling.
- **Pages exposure:** the repo is **public** and `pages.yml` currently
  builds and publishes `slides.md` (engineering content, issue numbers,
  benchmark caveats) to the open internet. After this work, **Pages
  publishes deck B only**; deck A builds locally (`npm run build:eng`) and
  is distributed as PDF/HTML internally. The workflow and README change
  accordingly. (Designer's call, flagged for owner: the current public
  Pages artifact already exposes eng-flavored content; this work fixes
  that as a side effect.)
- **Screenshots:** provided by the owner per the shot list; must look
  realistic, contain no internal hostnames, no real customer data.
- **Facts discipline:** every quantitative claim in either deck must be
  traceable to `docs/facts.md`, which itself cites a source (repo file,
  docs-site page, or issue) and an as-of date. Claims not in the facts
  sheet do not go on a slide.
- **Verified facts only** for deck B — anything deck B claims must be
  derivable from the public docs-site.

## Facts refresh (stale claims found 2026-11-03)

All "current deck" values verified against the repo on 2026-11-03.

| Claim | Deck says | Verified now | Source |
|---|---|---|---|
| ADRs | 327 | **343** (through ADR-0352; new: 0343 management-overhead scope, 0344 request-less sentinel, 0349 HCP advisories serving contract, 0350 robne multi-payload input, 0351 topology reads, 0352 per-request RBAC scope) | `docs/adr/` listing |
| Adversarial reviews | v14, 150+ findings | v14 **plus v15**: 29 findings across ROS/KMO/Koku/Nise, tracker #780; V15-01 (#751), V15-03 (#753), V15-04 (#754), V15-29 (#779) closed — several RBAC/security severity | issue tracker |
| E2E validation | 477 passed (Jul 2026, "last full run") | **2026-11-01 run: 371 passed / 51 failed / 55 errors / 426 skipped / 99 deselected of 1,002.** Deck A must state this honestly with context; deck B omits E2E internals. **Authoritative framing (verified, from the docs page itself):** observed failure signatures were Keycloak password-grant `invalid_grant` / "Account is not fully set up" and later `oc exec` cluster-API TCP `i/o timeout` — environmental/auth prerequisites; the page states these observations do not establish root cause of every failure, and the run is explicitly **not a passing deployment/release baseline**. Deck A's slide may state the numbers, the environmental signatures, that root-cause attribution is incomplete, and that the last fully green run was 477 passed (Jul 2026) — nothing stronger | `docs-site/testing/validating-native-engine.md` (Last verified 2026-11-01) |
| HCP waves | W0/W1/thin-W2 shipped, W3–W5 planned | **W4 fleet-capacity advisory API shipped** (#392: two endpoints, five native scenarios, MCE reference gauges); management-overhead scope `filter[scope]=management` (#694, ADR-0343); `management` flag (#695); native-first detail parity (#696). Remaining: W3, W5, M3 bridge, distribution, dedicated masters | CHANGELOG Unreleased |
| robne-operator | "planned" | **In development:** OLM bundle, RBAC role, Machineset Tier 1; open items #739 (Machines RBAC → empty machinesets), #743 (phase-branch CI gap), #744 | repo tree, issues |
| Notification codes | 82 | **81** per docs-site index — reconcile before using either number; deck B avoids the raw count | `docs-site/index.md` |
| 100K benchmark re-run | flagged as pending (#518) | **Still open** — deck A keeps the caveat; deck B uses only shipped public benchmark claims | issue #518 |
| New since deck, unmentioned | — | Request-less container rows (#697, ADR-0344); `savings-summary` per-plugin breakdown (#686); compatibility-list date fix (#782); public comparison page vs Kueue/DRA/KEDA (#785); zombie/idle measurement refinements (#746, #747) | CHANGELOG, issues |

## Deck A — `slides-eng.md`

Plain visual treatment (current minimal Marp look, cleaned up). Core
(~16 slides, ~1 min each):

1. **Title** — State of the Native Engine, as of 2026-11-03.
2. **One-year arc** — glue layer → engine → service + CLI + library →
   operator in development.
3. **What's new since the last state-of** — dated update block (HCP W4,
   v15 hardening, operator progress, request-less containers).
4. **Why Kruize had to go** — compressed to one slide (pain table:
   3–4× writes, 4 GB JVM, 30 s+ pagination, timeouts at 5K containers).
5. **The decision** — requirements and the call to extend
   ros-ocp-backend into the engine.
6. **Coverage matrix** — 9 plugins × capabilities, one readable slide.
7. **Performance now** — updated comparison table (page-1 latency,
   keyset pagination, 100K scale, RAM, cold start).
8. **Scale benchmark** — 525K recs / ~87 min / 1 pod, with the honest
   caveat that the phase-17 dual-stream-BH re-run (#518) is pending.
9. **Quality posture** — the 2026-11-01 E2E run stated plainly per the
   authoritative framing in the facts-refresh table (numbers,
   environmental signatures, incomplete root-cause attribution, last
   green run 477 passed Jul 2026 — no stronger claim), IQE status,
   OpenAPI contract tests.
10. **Hardening** — v15 review: 29 findings across four repos, fixes
    already landed (#751 settings-write denial, #753 RBAC scope,
    #754 heatmap scope), ADR-0352 per-request RBAC scope.
11. **Governance** — 343 ADRs, CI enforcement, FedRAMP gap assessment.
12. **Local mode** — `robne` CLI and `librobne`: what runs offline, and
    the framing for the demo's parity point — the same recommendations
    from the service (web UI) and the CLI.
13. **Demo hand-off** — segue slide: Optimizations UI tabs (fleet,
    container, namespace, VM, GPU, snapshots, HCP, quality, history),
    then `robne recommend` live — one engine, every surface.
14. **robne-operator status** — in development, with honest open items.
15. **Roadmap** — near/medium, updated (HCP W3/W5, MachineSet Tier 2a,
    seasonality, SaaS cutover).
16. **Summary + asks.**

**Appendix (Q&A jump targets, not presented):** full feature-comparison
tables (recommendations; platform/FinOps), security controls table,
operational robustness table, plugin architecture detail, HCP wave
detail, zombie/BH measurement refinements, robne CLI spec pointer,
librobne baseline pointer.

## Deck B — `slides-customer.md`

Red Hat-inspired theme (designer's approximation: red accent, dark
title/closing slides, light content slides, dated footer). Every slide
carries a standalone one-line takeaway. No issue numbers, no repo paths,
no Kruize narrative, no internal caveats. ~13 slides:

1. **Title** — Resource Optimization for OpenShift, as-of date stamp.
2. **The problem** — OpenShift estates run over-provisioned; rightsizing
   is manual guesswork across too many resource types.
3. **What you get** — eight resource types in business terms (containers,
   namespaces, nodes, GPUs, storage, quotas, VMs, snapshots).
4. **Where you find it** — the Optimizations area of Cost Management
   (screenshot: list view).
5. **Recommendations with dollar savings** — cost-model-integrated
   estimates (screenshot: list with savings column).
6. **Right-sized to how you work** — business hours awareness
   (screenshot: settings).
7. **Full-estate visibility** — fleet heatmap (screenshot).
8. **Understand why** — visual insights on detail pages: percentile
   bands, boxplots, OOM timelines, gauges (screenshot).
9. **Covers your whole estate** — namespaces, nodes, storage, hosted
   control planes (screenshots: tabs).
10. **How it works** — the trusted Cost Management data pipeline, one
    database, no new agents (styled HTML diagram, not ASCII art).
11. **Complements your automation tooling** — positioning vs Kueue, DRA,
    KEDA, drawn from the public comparison page.
12. **Roadmap** — public commitments only.
13. **Next step** — CTA: see the Optimizations tab / request a
    rightsizing review of your estate.

## Shared infrastructure

```
robne-deck/
├── slides-eng.md          # deck A (built to dist/, not published)
├── slides-customer.md     # deck B (built and published to Pages)
├── docs/
│   ├── facts.md           # every number in either deck + source + as-of
│   ├── shot-list.md       # screenshot requests for the owner
│   └── superpowers/specs/ # this design
└── assets/
    └── screenshots/       # owner-provided, sanitized
```

- **Build:** `npm run build:eng`, `npm run build:customer`,
  `build:pdf:eng`, `build:pdf:customer`; `pages.yml` builds and publishes
  **deck B only**.
- **Facts sheet:** a table per claim family (scale, performance,
  coverage, governance) with value, source, as-of date. Slides reference
  these values; the sheet is the review surface when numbers are
  questioned.
- **Visual language:** both decks replace all ASCII-art diagrams with
  styled HTML/CSS blocks (Marp supports inline HTML); the feature
  comparison tables live only in deck A's appendix at readable size.

## Screenshot shot list

Ten shots: eight for the customer-facing product story, two for the
engineering narrative. Which of them exist, which are deck-A-only, and
what each one leaks is tracked in [`docs/shot-list.md`](../shot-list.md)
— that file is the live inventory; do not restate it here.

All shots: realistic-looking data, no internal hostnames, nothing that
can't survive forwarding.

## Builder-check resolutions

A fresh subagent reviewed this design before handover. Three of its
questions were settled here; three are open for the owner (next section).

- **E2E framing (settled):** deck A's quality slide uses only the
  framing recorded in the facts-refresh table, sourced from
  `docs-site/testing/validating-native-engine.md` — no invented
  attribution, no stronger claim than the page makes.
- **Facts-sheet verification scope (designer's call, owner may
  descope):** every quantitative claim gets re-verified against its
  source before entering `docs/facts.md` — not just the claims found
  stale. A claim that cannot be re-verified is labeled "asserted, not
  verified" in the facts sheet and does not appear in deck B at all.
  This is hours of verification work; it is the mechanism that prevents
  this project's own failure mode.
- **Pages trigger during construction (designer's call):** the new
  `pages.yml` publishes **`master` only** until deck B is complete with
  real screenshots, then the phase-branch trigger is restored per repo
  convention. The workflow change lands in the same commit that adds
  `slides-customer.md`, so the public artifact never regresses to
  engineering content or placeholders.

## Open questions for the owner

1. ~~**Exposure model.~~** **Answered 2026-11-03: keep everything in the
   public repo.** All material deck A cites (ADRs, issues, benchmarks)
   is already public in `ros-ocp-backend`; Pages publishes deck B only;
   `slides.md` is archived (superseded by `slides-eng.md`).
2. ~~**Deck B roadmap contents.~~** **Answered 2026-11-03: derive from
   public docs-site.** There is no dedicated public roadmap page; the
   deck B roadmap slide is derived from planned items already stated
   publicly: `docs-site/architecture/plugin-phases.md` (java/jvm, Go
   advisory, HPA/VPA, binpacking, MachineSet tiers),
   `docs-site/architecture/librobne.md` (robne-operator on-cluster
   mode), and `docs-site/architecture/ecosystem-comparison.md`
   (positioning context). Only items with a public docs-site mention
   qualify; nothing else.
3. ~~**The demo script.~~** **Answered 2026-11-03:** the live demo walks
   the Optimizations UI tabs — fleet, container, namespace, VM, GPU,
   snapshots, HCP, quality, history — then runs `robne recommend` to
   show recommendations are available both in the web UI (service) and
   on the command line (robne CLI). Deck A's setup and hand-off slides
   frame it as "one engine, every surface."

## What's left to the builder

- Exact slide copy for both decks.
- Final placement of screenshots once provided (deck B layout reserves
  space; slides work with placeholders until they land).
- Appendix depth for deck A (which Q&A topics earn slides).
- The exact Red Hat-inspired palette values and title-slide treatment.
- Workflow/README edits for the two-deck build and B-only Pages publish.

## Owner decisions already made

- Two decks, not one (this conversation).
- Deck B: live-presented but must stand alone when forwarded; Red Hat
  branding; no internal leakage.
- Deck A: 30 min state-of + demo; local mode as the hook; honesty
  preserved.
- Owner takes screenshots; assistant builds everything else. **Updated
  2026-11-03:** the owner delegated screenshot capture to the assistant —
  terminal shots (deck A) produced locally from `robne` + sample CSVs;
  UI shots (deck B) captured via the browser tool against the on-prem
  lab UI once the cluster is reachable (requires owner to start
  sshuttle/VPN and arrange UI authentication).
- All deck sources stay in the public repo; Pages publishes deck B
  only; `slides.md` archived (2026-11-03).
- Deck B roadmap derives only from items publicly stated on the
  docs-site — no internal roadmap content (2026-11-03).
