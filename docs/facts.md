# Facts sheet — every number in either deck

One row per claim. A number that is not here does not go on a slide.

- **Source** — a path in `ros-ocp-backend`, a docs-site page, or an issue URL.
- **As of** — the date the value was last read from that source. `unverified` means the number exists only in the archived deck and no source in the repo states it; it may appear in deck A carrying the words "asserted, not verified", and may not appear in deck B at all.
- **Deck** — `A` (engineering only), `B` (customer, must also be public-verifiable), `A+B`.

Facts were read on 2026-11-03 against `ros-ocp-backend` at branch `pgarciaq-rosocp-superpowers-phase17`.

## Scale and performance

| Claim | Value | Source | As of | Deck |
|---|---|---|---|---|
| Production plugins registered in code | 12 (`container`, `namespace`, `node`, `gpu`, `pvc`, `quota`, `cluster-quota`, `snapshot`, `vm`, `hcp`, `slo`, `kruize`) | `ros-ocp-backend/internal/plugins/plugins.go` | 2026-11-03 | A |
| Recommendation domains documented publicly | 10 (the 12 minus `slo` and `kruize`, which the public domain table does not list) | `docs-site/index.md` "Recommendation domains" | 2026-11-03 | A |
| Customer-facing resource list | containers, namespaces, nodes, GPUs, storage, quotas, snapshots, VMs (8), hosted control planes covered separately | `docs-site/index.md` opening paragraph | 2026-11-03 | A+B |
| 100K benchmark: containers | ~84,000 | `docs-site/operations/scale-benchmark-report.md` | 2026-07-11 | A |
| 100K benchmark: VMs / GPUs / PVCs | ~2,500 / ~2,500 / ~12,000 | same | 2026-07-11 | A |
| 100K benchmark: total recommendations | 525,044 | same | 2026-07-11 | A |
| 100K benchmark: processor wall time | ~87 min, 1 pod | same | 2026-07-11 | A |
| 100K benchmark: peak memory | ~600 MB RSS; 119 MiB steady during the run | same | 2026-07-11 | A |
| 100K benchmark: DB size | 3.5 GB | same | 2026-07-11 | A |
| 100K benchmark: scope caveat | processor wall time only; direct-to-MinIO bypasses the Koku listener; ~56 min upload harness and ~5.3 h nise generation excluded | same | 2026-07-11 | A |
| Phase-17 dual-stream business-hours re-run | still open, issue #518 | `pgarciaq/ros-ocp-backend#518` | 2026-11-03 | A |
| Kruize 0.11 at 5K containers | 3h 17m / 10 replicas / 43.5 GB peak / 22 GB DB | `docs-site/operations/scale-benchmark-report.md` | 2026-07-11 | A |
| API page-1 latency < 100 ms | **asserted, not verified** — no source in the repo states it | archived deck `archive/slides-2026-10-05.md` only | unverified | A |
| Deep pagination < 500 ms with keyset | **asserted, not verified** — the performance page states a P95 > 500 ms *alert threshold*, not a measured result | `docs-site/operations/performance-and-scalability.md` (threshold only) | unverified | A |
| Cold start < 1 s | **asserted, not verified** | archived deck only | unverified | A |
| Typical RAM 50–100 MiB | **partially verified** — 119 MiB steady is sourced; the 50 MiB floor is not | scale report (119 MiB), archived deck (range) | 2026-07-11 | A |
| Keyset pagination ~1000× faster page selection at 100K | **asserted, not verified** | archived deck only | unverified | A |

## Kruize comparison (deck A only)

Every row below is Kruize 0.11's own published scalability run versus the native
engine's 100K run, both in `docs-site/operations/scale-benchmark-report.md`.

| Claim | Value | Source | As of | Deck |
|---|---|---|---|---|
| Kruize 0.11 scalability run | 5,000 containers, 15 days, 10 replicas, 3h 17m wall, 43.52 GB peak memory, 22 GB database | `docs-site/operations/scale-benchmark-report.md` | 2026-07-11 | A |
| Native 100K vs Kruize 5K | 16.8× more containers, 2× more data, ~87 min vs 3h 17m, 1 pod vs 10 | same | 2026-07-11 | A |
| Kruize GPU containers | a separate 5h 50m run for 5,000 GPU containers; the native engine processed ~2,500 in the same pipeline, adding ~27 s | same | 2026-07-11 | A |
| Kruize stored results | 7.2M individual result entries vs the native engine's daily digests | same | 2026-07-11 | A |
| Kruize production snapshot (SaaS, 24 h, July 2026) | 3 replicas; 99.6% experiment-creation failure rate; 73% result-update failure rate | same | 2026-07-11 | A |

## Quality and governance

| Claim | Value | Source | As of | Deck |
|---|---|---|---|---|
| ADRs | 343 files, newest ADR-0352 | `ros-ocp-backend/docs/adr/` listing | 2026-11-03 | A |
| v15 adversarial review | 29 findings: 5 High, 20 Medium, 4 Low, 0 Critical; remediation tracked in #780 | `ros-ocp-backend/docs/audit/adversarial-review-v15-2026-11-01.md` | 2026-11-01 | A |
| v15 fixes landed | V15-01 #751 (settings-write denial), V15-03 #753 (RBAC scope), V15-04 #754 (heatmap scope) | issue tracker | 2026-11-03 | A |
| E2E harness, latest completed run | 371 passed / 51 failed / 55 errors / 426 skipped / 99 deselected of 1,002 collected (903 selected); runtime 2:03:30; not a passing deployment or release baseline | `docs-site/testing/validating-native-engine.md` | 2026-11-01 | A |
| E2E failure signatures | Keycloak password-grant `invalid_grant` / "Account is not fully set up"; `oc exec` cluster-API TCP `i/o timeout`; root cause of every failure not established | same | 2026-11-01 | A |
| Last fully green E2E run of 477 passed (Jul 2026) | **asserted, not verified** — the string does not appear anywhere in the repo or docs-site | archived deck only | unverified | A |
| Notification codes | **unreconciled**: 81 in the docs-site index, 85 numeric rows in the notification-codes table, 82 in the archived deck | `docs-site/index.md`, `docs-site/architecture/notification-codes.md` | 2026-11-03 | A |

## Capability surface

| Claim | Value | Source | As of | Deck |
|---|---|---|---|---|
| Dual engine (cost vs performance) | `container`, `namespace`, `node`, `vm`, `hcp` | `docs-site/index.md` "Engines" | 2026-11-03 | A+B |
| Term windows | short / medium / long, configurable 1–90 days | `docs-site/index.md`, `features/configurable-thresholds.md` | 2026-11-03 | A+B |
| Business hours | container and namespace; dual all-hours vs business-hours streams when a cluster runs on a schedule | `docs-site/features/business-hours.md` | 2026-11-03 | A+B |
| Idle / zombie detection | containers, GPUs, namespaces, VMs; thresholds via Settings API; `filter[idle_state]` | `docs-site/index.md` | 2026-11-03 | A+B |
| Savings estimates | container, node, PVC, GPU, snapshot, quota — monthly dollars via Koku `effective_rates`; fleet rollup at `GET .../savings-summary` | `docs-site/index.md` | 2026-11-03 | A+B |
| Hosted control planes | per-hosted-cluster control-plane sizing on management clusters, thin cross-plane correlator advisories, fleet-capacity advisory (five scenarios, MCE reference gauges) | `docs-site/features/hosted-control-plane.md` | 2026-11-03 | A+B |
| Fleet capacity advisory | shipped, issue #392 | `pgarciaq/ros-ocp-backend#392`, CHANGELOG Unreleased | 2026-11-03 | A+B |
| Management-overhead scope | `filter[scope]=management`, ADR-0343, issue #694 | ADR-0343 | 2026-11-03 | A |
| Local mode | `robne` CLI + `librobne` library; no JVM, PostgreSQL required | `docs-site/features/robne-cli.md`, `docs-site/architecture/librobne.md` | 2026-11-03 | A |
| robne-operator | **future work, not implemented**: separate operator repo (modeled on koku-metrics-operator), CRD `ResourceOptimizationConfig`, three modes (Local/Remote/Hybrid), tracked as #138. No operator code or OLM bundle in this repository. | `docs/features/local-mode.md` ("Status: Future work"), `docs-site/architecture/librobne.md` §robne-operator | 2026-11-03 | A |
| Request-less container rows | empty request cells ingest as 0 with usage preserved (ADR-0344); previously the row was dropped | `CHANGELOG.md` Unreleased, #697 | 2026-11-03 | A |
| HCP management flag and native-first detail parity | rows carry an explicit `management` boolean (#695); HCP detail resolves through the native detail path (#696) | `CHANGELOG.md` Unreleased | 2026-11-03 | A |
| `savings-summary` per-plugin breakdown | returns per-plugin savings and additional-cost split (#686) | `CHANGELOG.md` #686 | 2026-11-03 | A |
| Plugin execution model | three ordered phases: Produce, Enrich, Optimize | `docs-site/architecture/plugin-phases.md` | 2026-08-05 | A |

## Deck B roadmap eligibility

Only items with a public docs-site mention qualify. Phrase as planned or under consideration; never as a dated commitment.

| Item | Public source | Deck |
|---|---|---|
| java/jvm plugin, Go runtime advisory, HPA/VPA, binpacking, MachineSet tiers | `docs-site/architecture/plugin-phases.md` | B |
| robne-operator on-cluster mode | `docs-site/architecture/librobne.md` | B |
| Positioning vs Kueue / DRA / KEDA | `docs-site/architecture/ecosystem-comparison.md` | B |

## Illustrative values that appear only inside screenshots

| Claim | Value | Source | As of | Deck |
|---|---|---|---|---|
| Lab cluster potential savings | $1,262.15/month across 25 recommendations, cluster `sno` | `assets/screenshots/container-list.png` (on-prem SNO lab, cost model `252b7e97`) | 2026-11-03 | A+B |
| Lab cluster additional-cost side | $164.25/month across 141 recommendations sized too small | same asset (same banner line) | 2026-11-03 | A+B |
| Lab node classification | 1 node, CPU 3.1% / memory 69.9% P50, "Overcommitted", +$102.57/month additional cost | `assets/screenshots/node-tab.png` | 2026-11-03 | A |

Screenshot values are the product's own output on a lab cluster, not product claims: deck B must caption them as an example, never as a benchmark.
