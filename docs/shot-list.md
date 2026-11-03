# Screenshot shot list

The ten design shots, what exists for each, and whether the result can survive
being forwarded. Assets live in `assets/screenshots/` once Task 2 copies them;
until then `File` names the capture in `/tmp/opencode/capture/`.

| Shot | Slide (A/B) | File | Status |
|---|---|---|---|
| Optimizations list with savings column | A1, B2 | `container-list.png` | captured |
| Namespace recommendations tab | A5, B4 | `namespace-tab.png` | captured-with-caveat |
| Node recommendations tab | A5, B4 | `node-tab.png` | captured |
| Storage recommendations tab | A5, B4 | `storage-tab.png` | captured |
| Hosted Control Plane tab with drill-down | A8 | `hcp-tab.png` | captured-with-caveat |
| Fleet Summary heatmap | A3 | `fleet-heatmap.png` | captured-with-caveat |
| Detail page: percentile bands, gauges | A6, B3 | `container-detail.png` | captured |
| Settings page: business hours, thresholds | A7, B5 | — | missing |
| `robne recommend` terminal output | A12 | `robne-cli.png` | missing |
| Optional: HCP fleet-capacity or history output | A-appendix | — | missing |

## Caveats

- **`namespace-tab.png`** — one row only (the lab cluster has a single namespace
  with recommendations) and several cells render the product's missing-value
  marker. Safe to forward, but it will not carry the "many namespaces" story on
  its own.
- **`hcp-tab.png`** — shows a test hosted cluster (`hc-e2e-1`) on a test
  management cluster. Deck A only; never deck B, per the global constraint on
  `e2e-*` / `hc-e2e-*` strings.
- **`fleet-heatmap.png`** — shows the whole lab fleet, including `e2e-*`,
  `crq-worker`, and `seed-node-*` clusters. Deck A only.
- **`node-tab.png`, `storage-tab.png`** — captured through the cluster-UUID
  filter rather than the alias filter, because `filter[cluster]=<alias>` returns
  503 on those tabs (filed as `pgarciaq/ros-ocp-backend#790`). The cluster chip
  and the "Cluster names" column therefore show the UUID. Deck A may show them
  as-is; deck B needs a crop that excludes the chip, or a re-shoot after #790
  lands.
- **`container-list.png`, `container-detail.png`** — cluster alias `sno` only; no
  hostname, no UUID, no `e2e-*` string. B-safe.
- **`settings`** — the route rendered an empty body on 2026-11-03; see Task 2
  step 2 of the plan before shipping a blank image.

## B-safe assets

`container-list.png`, `container-detail.png`. Everything else is deck A only
until the caveat above is cleared.
