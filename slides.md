---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section.lead h1 { font-size: 2.5em; }
  table { font-size: 0.65em; }
  section { font-size: 1.1em; }
---

<!-- _class: lead -->

# Resource Optimization for OpenShift

## The Native Engine

Replacing Kruize with a purpose-built Go recommendation engine

---

## Where ROS Fits in Cost Management

**Red Hat Lightspeed Cost Management** — FinOps for hybrid cloud

```
┌─────────────────────┐
│  OpenShift Cluster  │
└──────────┬──────────┘
           │ Prometheus / Thanos metrics
           ▼
┌─────────────────────┐     CSV reports (tar.gz)
│ koku-metrics-       │ ─────────────────────────►
│ operator            │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐     REST API
│  Koku backend       │ ─────────────────────────► koku-ui
│  (Django / Celery)  │        Cost Management UI
└──────────┬──────────┘
           │ same data pipeline
           ▼
┌─────────────────────┐     Optimizations tab
│  ros-ocp-backend    │ ◄────────────────────────── koku-ui
│  (recommendations)  │
└─────────────────────┘
```

---

## ROS: Alongside Koku, Same Pipeline

- **ROS** (Resource Optimization Service) — right-sizing recommendations for OpenShift workloads
- **Separate recommendation engine** alongside Koku; shares the **same cost data pipeline**
- Cluster metrics → operator → CSV → Koku ingestion → PostgreSQL
- **Optimizations** tab in koku-ui calls **ros-ocp-backend** for recommendations

| Component | Role |
|-----------|------|
| Koku | Cost ingestion, aggregation, billing views |
| ros-ocp-backend | CPU/memory/GPU/PVC/VM/node/quota recommendations |
| koku-ui | Unified FinOps experience |

---

## Current Implementation: The Kruize Era

```
┌──────────────────┐         ┌──────────────┐         ┌──────────────┐
│  ros-ocp-backend │ ◄─────► │   Kruize     │ ◄─────► │  Kruize DB   │
│  (glue layer)    │  REST   │   (Java)     │         │ (PostgreSQL) │
└────────┬─────────┘         └──────────────┘         └──────────────┘
         │
         ▼
┌──────────────────┐
│   Koku PG DB     │
└──────────────────┘
```

- **ros-ocp-backend** — glue between Koku and Kruize (not the engine)
- **Kruize Autotune** — open-source Java recommendation engine
- **Multiple databases, languages, and data copies**

---

## Data Flow Today (Kruize)

```
Cluster metrics
      │
      ▼
  CSV reports ──► Koku ingestion ──► PostgreSQL (tenant data)
      │                                      │
      │                                      ▼
      │                            ros-ocp-backend (glue)
      │                                      │
      │                                      ▼
      │                            Kruize REST API (Java)
      │                                      │
      │                                      ▼
      │                            Kruize PostgreSQL
      │                                      │
      └──────────────────────────────────────┘
                         API response → UI
```

**Pain points:** redundant writes, serialization at every hop

---

## Current Kruize Features

**Shipped in Cost Management:**

- Container **CPU** and **memory** recommendations only

**Upstream Kruize (not productized):**

- Namespace, GPU, Java/JVM recommendations

**Product gaps:**

- Limited configurability
- No business hours awareness
- No dollar-value savings estimates

---

## Performance Problems

**Data written 3–4×** across databases:

1. Koku PostgreSQL (ingestion)
2. Kruize PostgreSQL (recommendation store)
3. Round-trip serialization on every API call

**Type conversion tax:** Go ↔ JSON ↔ Java ↔ JSON ↔ Go

- Boxing overhead, schema mismatches between services

---

## Performance Problems (continued)

| Issue | Impact |
|-------|--------|
| Kruize JVM heap | **2–4 GB** RAM; slow cold start (**30–60 s**) |
| GC pauses | Latency spikes under load |
| Deep pagination | **30 s+** (OFFSET scans) |
| Large tenants | **Timeouts** at **200K+** containers |
| Minimum pod | **4 GB RAM** for Kruize |

**Result:** ROS could not scale with enterprise OpenShift estates.

---

<!-- _class: lead -->

# Decision: Replace Kruize

**Architectural problem — not a tuning issue**

---

## Why Native Engine

**Cannot be fixed in Kruize** — multiple DBs, multiple languages, redundant copies

**Requirements:**

1. **Shared database** with Koku — eliminate redundant copying
2. **Single language** — no Go ↔ Java conversion
3. **Low footprint** — fit constrained on-prem clusters
4. **API-compatible** drop-in for existing UI

**Decision:** extend **ros-ocp-backend (Go)** to **be** the recommendation engine

---

## Feature Comparison: Recommendations

| Feature | Kruize | Native Engine |
|---------|:------:|:-------------:|
| Container CPU/Memory | ✅ | ✅ (production-ready) |
| Namespace recommendations | ✅ (upstream only) | ✅ (history, BH, boxplots, notifications) |
| GPU MIG slicing | ✅ (upstream only) | ✅ (cost + ROS E2E, IQE validated) |
| GPU time-slicing | ❌ | ✅ (persisted at ingest, history, backfill) |
| Java recommendations | ✅ (upstream only) | ❌ (planned) |
| Node right-sizing | ❌ | ✅ (instance type, idle/consolidation, allocatable) |
| PVC right-sizing | ❌ | ✅ (detail, filters, order_by, mounted_by) |
| ResourceQuota | ❌ | ✅ (detail, history, notifications 70–72) |
| ClusterResourceQuota | ❌ | ✅ (namespace filter, savings, alias filters) |
| VolumeSnapshot staleness | ❌ | ✅ |
| OOM detection | ❌ | ✅ |
| Data decay | ❌ | ✅ |
| Idle/zombie detection | ❌ | ✅ |
| OpenShift Virtualization (VM) | ❌ | ✅ |
| VM GPU passthrough/vGPU | ❌ | ✅ |
| VM instance type matching | ❌ | ✅ |
| VM idle/abandoned detection | ❌ | ✅ |
| VM crash loop detection | ❌ | ✅ |

---

## Feature Comparison: Platform & FinOps

| Feature | Kruize | Native Engine |
|---------|:------:|:-------------:|
| Business hours | ❌ | ✅ |
| Snapshot staleness | ❌ | ✅ |
| Tag filtering & grouping | ❌ | ✅ |
| Dollar-value savings | ❌ | ✅ |
| Cost model integration | ❌ | ✅ |
| Multi-term recommendations | ❌ | ✅ |
| Configurable thresholds | Limited | ✅ (3-tier) |
| Keyset pagination | ❌ | ✅ |
| Notification codes (75) | Limited | ✅ |
| Recommendation explanations | ❌ | ✅ (`?include=explanation`) |
| Historical recommendations | ❌ | ✅ |
| Global settings lock | ❌ | ✅ |
| Adaptive margins (CPU) | ❌ | ✅ |

---

## Native Engine: More Than a Port

**15× more product features** — purpose-built for OpenShift Cost Management

- **OpenShift Virtualization:** VM CPU/memory/disk/I/O sizing, idle/abandoned detection, GPU passthrough/vGPU, instance type catalog, crash loop detection, graduated confidence
- **GPU:** MIG and time-slicing — full cost + ROS paths, IQE unblocked (COST-7179)
- **Infrastructure:** node (instance types, idle/consolidation), PVC (pod context), ResourceQuota, ClusterResourceQuota
- **Namespace:** aggregate sizing, history, business hours, boxplots, structured notifications
- **Reliability:** OOM detection, data decay (stale metrics age out)
- **FinOps:** cost model integration, dollar savings, idle/zombie detection
- **Operations:** snapshot staleness, business hours awareness
- **Flexibility:** all thresholds configurable (3-tier: env vars → API → defaults)

Not a faster Kruize wrapper — a **full recommendation engine**

---

## OpenShift Virtualization Recommendations

**Full VM lifecycle optimization** — CPU, memory, disk, I/O, GPU

| Capability | Details |
|------------|---------|
| CPU/Memory sizing | Guest-agent adaptive; Windows kernel reserve; P99 spike detection |
| Disk projection | Linear regression; configurable projection window |
| I/O profiling | Sequential vs random; throughput classification |
| GPU | Passthrough/vGPU; MIG profile optimization; time-slicing |
| Instance types | Static + per-cluster catalog; `gn1` GPU types |
| Idle/Abandoned | OS-aware thresholds (Linux vs Windows) |
| Crash loop | `kubevirt_vmi_phase_transition_time_seconds` |
| Confidence | Graduated: high / moderate / low |
| Downsize stability | Time-aware hysteresis (N consecutive days) |

**14+ Prometheus queries** · dual CSV (15-min ROS + hourly Koku)

---

## Performance Numbers

| Metric | Kruize | Native Engine |
|--------|--------|---------------|
| Data copies | 3–4× writes | **Single DB** — zero cross-service copy |
| Math | Float-heavy JVM | **Integer:** cents, basis points, millicores |
| Page 1 latency | 2–5 s | **< 100 ms** |
| Deep pages | 30 s+ timeout | **< 500 ms** (keyset) |
| 200K containers | Timeouts | **Full org scan in seconds** |
| RAM | ~4 GB | **~128 MB** |
| Cold start | 30–60 s | **< 1 s** |

---

## Performance: How We Got There

- **Zero data copying** — read/write same PostgreSQL as Koku
- **Integer-first arithmetic** (ADR-0295) — cents, millicores, basis points, micro-cents; float64 only at boundaries
- **Decay lookup tables** (ADR-0288) — precomputed weights replace per-row `math.Exp` in digest hot path (~0.2% quantization)
- **Streaming ingestion** — single-pass CSV, constant memory
- **Keyset pagination** — stable latency at any depth; **~1000×** faster page selection at 200K+ containers
- **Pre-computed org stats** — O(1) aggregate lookups; deferred refresh per reconcile cycle (**50–90%** faster writes)
- **Batch DB ops** — `pgx.Batch` (chunk 500) for writes, savings recalc, tag sync; **no JVM GC pauses**

---

## Technical Architecture

**Go 1.25** — **100% API compatible** drop-in replacement

```
┌─────────────────────────────────────────────┐
│           ros-ocp-backend (Go)              │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ Ingest  │ │ Plugins │ │ REST API      │  │
│  │ stream  │ │ engine  │ │ (drop-in)     │  │
│  └────┬────┘ └────┬────┘ └───────┬───────┘  │
│       └───────────┴───────────────┘           │
└─────────────────────┼─────────────────────────┘
                      ▼
              PostgreSQL only (shared with Koku)
```

- Same endpoints, same response shape — **only PostgreSQL required**

---

## Plugin Architecture

| Phase | Focus | Plugins / capabilities |
|-------|-------|------------------------|
| **Produce** | Core right-sizing | **container**, **namespace**, **gpu** (MIG + time-slicing), **node**, **pvc**, **quota**, **cluster-quota**, **snapshot**, **vm** |
| **Enrich** | Context & policy | business hours, tags, snapshot staleness, idle/zombie/abandoned, OOM, GPU enrich on container APIs |
| **Optimize** | FinOps value | cost model integration, dollar savings, fleet summary, **history** (container, namespace, quota, CRQ) |

**Phase 2/3 (planned):** java, golang, hpa, vpa · binpacking, machineset (fleet)

**Key optimizations:**

Integer arithmetic · keyset pagination · pre-computed stats · batch ops · streaming ingestion

**Extensible** — new recommendation types without replacing the engine

---

## Test & Validation

**Automated coverage across the full recommendation surface**

| Layer | Scope |
|-------|-------|
| **cost-onprem-chart E2E** | **477 passed** on UXSNO cluster (Jun 2026) — all core recommendation types validated |
| **E2E infrastructure** | Session-scoped auto-seeding fixture — NISE data generated when DB below thresholds; idempotent |
| **On-prem DB grants** | `ros_user` SELECT on Koku tenant schemas — tag filtering without cross-DB copies |
| **IQE cost-management** | Container, namespace, node, CRQ, GPU/MIG (COST-7179 unblocked) |
| **IQE ros-ocp** | GPU/MIG on native paths; namespace tests migrated off Kruize |
| **OpenAPI contract tests** | All recommendation routes — request/response shape parity |
| **Bruno collections** | Manual QA across Optimizations endpoints (detail, filters, history, savings) |

**Documentation:** docs-site synced with phase 14 · decay weights · percentile-band plots · explanation docs

---

<!-- _class: lead -->

# Production Hardening

## Phases 13–14 — adversarial reviews v5, performance audit v2, explanations, GPU persistence

---

## Security Hardening

| Control | Implementation |
|---------|----------------|
| **SSRF protection** | Host allowlist + private-network deny; **allowlisted hosts bypass deny** (on-prem S3/RGW) — defense-in-depth, not disabled |
| **Entitlement middleware** | 403 if `cost_management` not entitled (defense-in-depth) |
| **CORS** | Explicit allowed-origins (`ROS_CORS_ALLOWED_ORIGINS`) |
| **Kafka payload redaction** | DEBUG logs no longer leak message payloads |
| **Internal endpoint audit** | SA identity + target `org_id` logged and metricked |
| **Org allowlist** | Optional `ROS_INTERNAL_ALLOWED_ORGS` for internal endpoints |
| **CSV body size limit** | Default reduced from 500 MiB → **100 MiB** |

---

## Operational Robustness

| Capability | Purpose |
|------------|---------|
| **Manifest ID synthesis** | Deterministic UUID v5 when operator sends empty `manifest_id` — never loses tracking |
| **Synthesized manifest debounce** | Quiet period before recommendations — avoids premature execution on partial data |
| **Single-flight coalescing** | Savings recalc, reship, threshold guards — latest-params-win |
| **Graceful async shutdown** | `asyncjobs` package with shared context + 30s drain timeout |
| **Concurrent Kafka commit mutex** | Prevents race conditions with parallel consumers |
| **Strict analytics mode** | Default-on (`ROS_INGEST_STRICT_ANALYTICS=true`) |
| **Bounded caches** | LRU for RBAC permissions + fleet summary — no unbounded memory growth |
| **History default window** | 30-day cap when no date filters provided |

---

## Governance & Architecture

| Area | Delivered |
|------|-----------|
| **Adversarial reviews** | 5 due diligence rounds through v5.0 (Jun 2026) — performance audit v2 |
| **Findings** | **85** identified across security, correctness, auditability, ops, performance, design, maintainability, governance |
| **Resolution** | **All resolved** — fixed, mitigated, or accepted with rationale · **zero open** |
| **ADRs** | **295+** Architecture Decision Records — integer-first (0295), explanations (0296), GPU TS persistence (0297) |
| **Kruize deprecation** | Formal ADR to remove Kruize plugin |
| **CI enforcement** | OpenAPI/CHANGELOG advisory · ADR reminder on architectural paths · weekly `govulncheck` |
| **Documentation** | Public `docs-site/` · operations runbooks · monitoring guides · configuration reference |

---

## Roadmap

**Delivered (backend complete — phases 12–14)**

- **All recommendation types:** container, namespace, node, GPU (MIG + time-slicing), PVC, ResourceQuota, ClusterResourceQuota, snapshot, VM (CPU/memory/disk/I/O/GPU)
- **API depth:** history endpoints (namespace, quota, CRQ, container); namespace boxplots; PVC detail + `mounted_by`; quota/CRQ detail, filters, order_by; node instance-type awareness
- **FinOps & ops:** cost model integration, dollar savings, business hours, tags, idle/zombie/abandoned, snapshot staleness, adaptive margins (CPU), 3-tier thresholds, global settings lock, keyset pagination
- **Notifications:** 75 structured codes (quota 70–73, node pod scheduling, VM/GPU/PVC/snapshot families)
- **Production hardening:** adversarial reviews v5 (85 findings, zero open); SSRF allowlist precedence; manifest debounce + single-flight guards; bounded caches; 295+ ADRs; CI governance
- **Performance audit v2:** decay lookup tables, batched savings/tag sync, slim list DTOs, GPU page-scoped enrichment
- **Phase 14:** recommendation explanations (`?include=explanation` on detail endpoints); GPU time-slicing persistence (compute-at-ingest, history, backfill endpoint)
- **Test & docs:** UXSNO E2E **477 passed**; auto-seeding fixture; IQE plugins (GPU unblocked); docs-site phase 14 sync

**Near term**

- Seasonality / proactive recommendations (design documented)
- Node Tier 2 — MachineSet right-sizing
- **UI integration** — namespace, GPU, quota, PVC, VM views (backend-only today)

**Medium term**

- Node Tier 3 — MachineAutoscaler recommendations
- Java/JVM & Quarkus workload tuning
- Live migration cost awareness (VM)
- Multi-GPU container consolidation (bin-packing)
- Network-aware recommendations
- VPA & HPA alignment
- Cross-cluster fleet optimization

---

## Roadmap: Strategic Direction

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5em; font-size: 0.75em;">
<div>

### ✅ Delivered
All rec types + APIs
E2E + IQE + OpenAPI + Bruno
History / savings / tags
Notifications (75)
Settings (3-tier + lock)
Security + ops hardening
85 findings · 295+ ADRs
Perf audit v2 · explanations

</div>
<div>

### 🔜 Near term
Seasonality design
MachineSet (Tier 2)
UI (NS/GPU/quota/PVC/VM)
*(backend complete)*

</div>
<div>

### 🔮 Medium term
Node Tier 3 (MA)
Java / JVM / Quarkus
Multi-GPU bin-pack
Live migration (VM)

</div>
</div>

One engine · one database · one language — **continuous delivery** without Kruize release cycles

---

<!-- _class: lead -->

# Summary

**From glue layer to full recommendation engine**

---

## The Bottom Line

| Dimension | Improvement |
|-----------|-------------|
| Features | **15×** more capability vs. shipped Kruize |
| Resources | **50×** less RAM (~128 MB vs. 4 GB) |
| Speed | **100×** faster on hot paths |
| Architecture | **Single binary, single DB, single language** |
| Security & governance | **85** adversarial findings resolved · **295+ ADRs** · CI enforcement |
| E2E validation | **477 passed** on UXSNO — core functionality validated |
| Future | **Extensible plugin architecture** |

**Resource Optimization for OpenShift: The Native Engine**
