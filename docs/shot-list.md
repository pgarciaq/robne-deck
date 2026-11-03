# Screenshot shot list

The design shots, what exists for each, where it currently lands, and whether the
result can survive being forwarded. Assets live in `assets/screenshots/`; the raw
captures stay in `/tmp/opencode/capture/` and are not tracked.

Slide references are current as of the 2026-11-03 trim: deck A has 22 slides
(title + 13 content + Q&A + 6 appendix), deck B has 13. An asset marked "unused"
was captured for the design but no slide in either deck references it any more.

| Shot | Appears on | File | Status |
|---|---|---|---|
| Optimizations list with savings column | B5 | `container-list.png` | captured |
| Detail page: percentile bands, gauges | B9 | `container-detail.png` | captured |
| `robne recommend` terminal output | A10 | `robne-cli.png` | captured |
| Hosted Control Plane tab with drill-down | A19 (slide labelled A4) | `hcp-tab.png` | captured-with-caveat |
| Fleet Summary heatmap | A20 (slide labelled A5) | `fleet-heatmap.png` | captured-with-caveat |
| Namespace recommendations tab | unused | `namespace-tab.png` | captured-with-caveat |
| Node recommendations tab | unused | `node-tab.png` | captured-with-caveat |
| Storage recommendations tab | unused | `storage-tab.png` | captured-with-caveat |
| Substitute for the settings shot: cost models | unused | `cost-models.png` | captured-with-caveat |
| Settings page: business hours, thresholds | — | — | missing |
| Optional: HCP fleet-capacity or history output | — | — | missing |

## What each caveat is

- **`namespace-tab.png`** — one row only (the lab cluster has a single namespace
  with recommendations), and the memory/CPU current and change cells carry the
  product's missing-value markers. Deck A only: on a cold read those markers
  look like warnings rather than "no data reported".
- **`node-tab.png`** — shows the node hostname `sno-sno.karmalabs.corp` and the
  cluster UUID. Deck A only.
- **`storage-tab.png`** — shows the cluster UUID in the chip and in every
  "Cluster names" cell. Deck A only.
- **`hcp-tab.png`** — shows a test hosted cluster (`hc-e2e-1`) on a test
  management cluster (`hcp-ingest-…`). Deck A only.
- **`fleet-heatmap.png`** — shows the whole lab fleet, including `e2e-*`,
  `crq-worker`, and `seed`/`w8-*` clusters, and the fleet savings tile reads
  `$0.00 USD` while the per-cluster list shows $1,262.15/month for the same
  cluster. The cause (a different rate basis in the rollup) is a reading of the
  numbers, not something verified in code. Deck A only.
- **`cost-models.png`** — the substitute for the settings shot; no slide uses it
  since the savings slide was cut. It was captured mid-load (a white strip under
  the masthead), so it would need a re-shoot before use.
- **`node-tab.png`, `storage-tab.png`, `cost-models.png`, `hcp-tab.png`,
  `namespace-tab.png`** — the Node and Storage tabs were captured through the
  cluster-UUID filter rather than the alias filter, because
  `filter[cluster]=<alias>` returns 503 on those tabs (filed as
  `pgarciaq/ros-ocp-backend#790`). When #790 lands, re-shoot both with the alias
  and drop the UUID caveat.

## Missing: the settings shot

The design asked for a settings page showing business hours and thresholds. The
deployed UI has no such page: Settings exposes only the Koku surfaces — cost
models, price list, tags and labels, cost categories, platform projects,
display, integrations. The ROS term/threshold/business-hours forms described in
`docs-site/ui-integration-guide.md` §7–10 are a UI specification, not a shipped
screen. Both decks therefore handle settings in text: deck A points at the
Settings API paths, deck B says what is configurable without showing a form.

## `robne-cli.png`

Real CLI output, rendered into a terminal-styled page and screenshotted at
1600×900. Command:

```bash
robne recommend --input demo-usage.csv --rate-card demo-rate-card.json \
  --format table --plugins container
```

Both `demo-usage.csv` (the repo's `scripts/samples/ros-ocp-usage.csv` with a
`cluster_uuid` column added) and `demo-rate-card.json` are throwaway fixtures in
`/tmp/opencode/capture/`; the repo's sample CSV carries no `cluster_uuid`, and a
rate card requires one. Header and rows are the CLI's own output, split on the
header's column offsets — no value was retyped. The image shows sizing from both
engines for the same containers, which is the point of the slide.

## B-safe assets

`container-list.png` and `container-detail.png`.

`container-list.png` carries lab workload names in the table (`cost-onprem`
project; `celery-*`, `postgres`, `envoy`, `wait-for-koku`, `wait-for-valkey`
containers). They are generic infrastructure names, not hostnames, cluster UUIDs,
or test-cluster identifiers, so deck B may use the shot with a caption calling it
example data from a lab cluster.

`container-detail.png` also shows the recommendation id (an opaque per-row UUID,
distinct from a cluster UUID) and the product's own "recommendation based on
limited data" notification. Both are genuine product output; keep them.

Every asset has the account chip in the console masthead masked out with the
masthead's own background colour, so no user or tenant name appears in either
deck.
