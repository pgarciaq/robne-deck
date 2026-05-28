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
| ros-ocp-backend | CPU/memory/GPU/PVC recommendations |
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
| Container CPU/Memory | ✅ | ✅ |
| Namespace recommendations | ✅ (upstream only) | ✅ |
| GPU MIG slicing | ✅ (upstream only) | ✅ |
| GPU time-slicing | ❌ | ✅ |
| Java recommendations | ✅ (upstream only) | ❌ (planned) |
| Node right-sizing | ❌ | ✅ |
| PVC right-sizing | ❌ | ✅ |
| Namespace/Cluster quota | ❌ | ✅ |
| OOM detection | ❌ | ✅ |
| Data decay | ❌ | ✅ |
| Idle/zombie detection | ❌ | ✅ |

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

---

## Native Engine: More Than a Port

**10× more product features** — purpose-built for OpenShift Cost Management

- **GPU:** time-slicing recommendations (MIG in both engines; Native productizes full GPU FinOps)
- **Infrastructure:** node right-sizing, PVC right-sizing, namespace/cluster quota
- **Reliability:** OOM detection, data decay (stale metrics age out)
- **FinOps:** cost model integration, dollar savings, idle/zombie detection
- **Operations:** snapshot staleness, business hours awareness
- **Flexibility:** all thresholds configurable (3-tier: env vars → API → defaults)

Not a faster Kruize wrapper — a **full recommendation engine**

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

| Phase | Focus | Examples |
|-------|-------|----------|
| **Produce** | Core right-sizing | container, GPU, node, PVC, quota, cluster-quota, namespace |
| **Enrich** | Context & policy | business hours, tags, staleness |
| **Optimize** | FinOps value | cost model integration, savings |

**Key optimizations:**

Integer arithmetic · keyset pagination · pre-computed stats · batch ops · streaming ingestion

**Extensible** — new recommendation types without replacing the engine

---

## Roadmap

**Delivered**

- **ResourceQuota** recommendations (`quota` plugin, priority 35)
- **ClusterResourceQuota** recommendations (`cluster-quota` plugin, priority 36)
- Namespace usage-based sizing, idle detection, fleet savings

**Near term**

- **OpenShift Virtualization (VM)** recommendations
- **Java/JVM** & **Quarkus** workload tuning

**Medium term**

- **VPA** & **HPA** recommendation alignment
- **Bin-packing** optimization across nodes

---

## Roadmap: Strategic Direction

```
Today              Next                 Future
──────             ────                 ──────
Container/GPU  →   VM / JVM         →   VPA / HPA
Node/PVC     →   Quarkus          →   Bin-packing
Quota + CRQ ✓
Savings        →   History          →   Quality scores
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
| Features | **10×** more capability vs. shipped Kruize |
| Resources | **50×** less RAM (~128 MB vs. 4 GB) |
| Speed | **100×** faster on hot paths |
| Architecture | **Single binary, single DB, single language** |
| Future | **Extensible plugin architecture** |

**Resource Optimization for OpenShift: The Native Engine**
