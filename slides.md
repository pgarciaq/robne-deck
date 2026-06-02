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
| GPU time-slicing | ❌ | ✅ (cluster filter, Helm defaults) |
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
- **Integer math** — cents, basis points; no float drift
- **Streaming ingestion** — single-pass CSV, constant memory
- **Keyset pagination** — stable latency at any depth
- **Pre-computed org stats** — O(1) aggregate lookups
- **Batch DB ops** — fewer round trips; **no JVM GC pauses**

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
| **cost-onprem-chart E2E** | Namespace BH, node idle/consolidation, GPU MIG (cost + ROS), GPU time-slicing, VM GPU, PVC, ClusterResourceQuota |
| **IQE cost-management** | Container, namespace, node, CRQ, GPU/MIG (COST-7179 unblocked) |
| **IQE ros-ocp** | GPU/MIG on native paths; namespace tests migrated off Kruize |
| **OpenAPI contract tests** | All recommendation routes — request/response shape parity |
| **Bruno collections** | Manual QA across Optimizations endpoints (detail, filters, history, savings) |

**Documentation:** docs-site feature pages per type · architecture (GPU, node tiers, seasonality design)

---

## Roadmap

**Delivered (backend complete — phase 12)**

- **All recommendation types:** container, namespace, node, GPU (MIG + time-slicing), PVC, ResourceQuota, ClusterResourceQuota, snapshot, VM (CPU/memory/disk/I/O/GPU)
- **API depth:** history endpoints (namespace, quota, CRQ, container); namespace boxplots; PVC detail + `mounted_by`; quota/CRQ detail, filters, order_by; node instance-type awareness
- **FinOps & ops:** cost model integration, dollar savings, business hours, tags, idle/zombie/abandoned, snapshot staleness, adaptive margins (CPU), 3-tier thresholds, global settings lock, keyset pagination
- **Notifications:** 75 structured codes (quota 70–73, node pod scheduling, VM/GPU/PVC/snapshot families)
- **Test & docs:** cost-onprem-chart E2E (all types above); IQE plugins (GPU unblocked); OpenAPI contract tests; Bruno collections; docs-site feature pages

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

```
Delivered (phase 12)         Near term               Medium term
──────────────────           ─────────               ───────────
All rec types + APIs         Seasonality design      Node Tier 3 (MA)
E2E + IQE + OpenAPI + Bruno  MachineSet (Tier 2)     Java / JVM / Quarkus
History / savings / tags     UI (NS/GPU/quota/PVC/VM) Multi-GPU bin-pack
Notifications (75)           (backend complete)      Live migration (VM)
Settings (3-tier + lock)                             Network / VPA / HPA / fleet
```

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
| Future | **Extensible plugin architecture** |

**Resource Optimization for OpenShift: The Native Engine**
