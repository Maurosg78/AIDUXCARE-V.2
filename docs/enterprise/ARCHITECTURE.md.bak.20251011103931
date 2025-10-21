# AI/ML Architecture (Draft)

This document describes the high-level AI/ML architecture used to deliver reliable, secure, and observable features. It is intentionally concise and implementation-agnostic so it can evolve alongside product needs.

## Section 6 — AI/ML Architecture

**Diagrams**
- ![AI Pipeline](diagrams/ai-pipeline.svg)
- ![Prompt Versioning](diagrams/prompt-versioning.svg)

#### Prompt Versioning Header (minimal snippet)
```

**Overview.** The architecture separates ingestion, processing, and serving to reduce coupling and to make capacity planning straightforward. Ingestion focuses on data quality, schema evolution, and privacy; processing handles feature engineering, training, and evaluation; serving exposes fast, predictable interfaces with progressive rollouts and guardrails.

**Data contracts.** Producers publish versioned contracts covering fields, types, semantics, and PII classification. Consumers validate contracts with CI checks before accepting new payloads. Backfills and reprocessing jobs must declare contract versions to keep lineage auditable and reproducible.

**Feature pipeline.** Offline transforms run as idempotent batch jobs with checkpointing; online features are computed with the same code paths wherever possible to minimize train/serve skew. Every feature is documented with ownership, freshness expectations, and tests for distribution drift and null-rate regressions.

**Model training.** Training jobs pin dataset snapshots and container images. Hyperparameters, metrics, and artifacts are logged to a registry. A champion/challenger pattern allows automatic canaries on representative traffic. Failed canaries roll back via a single switch, and the registry enforces that only signed, validated artifacts can be promoted to “serving-eligible.”

**Evaluation.** Beyond aggregate metrics, we track slice performance for sensitive cohorts, long-tail inputs, and adversarial cases. Shadow deployments compare outputs from the candidate model against the champion under the exact same requests and features. Significant deltas open an engineering task automatically.

**Inference and guardrails.** Serving is fronted by a thin gateway that handles authentication, quota, and request budgeting. Each endpoint supports circuit breakers, bounded concurrency, and retries with jitter. For generative use cases, responses pass through content filters, PII redaction (where appropriate), and safety classifiers before reaching clients. All prompts and outputs include minimal provenance to support investigations and user-visible audit trails.

**Observability.** We emit structured logs and traces tagged with model, dataset snapshot, and feature set versions. Golden signals include latency, saturation, error rate, and cost per 1k requests. Drift detectors alert when live distributions diverge from training baselines; alerts link directly to dashboards and runbooks.

**Lifecycle & governance.** Every model has an owner, SLOs, deprecation criteria, and an EOL date. Changes follow a lightweight RFC process with design, risk analysis, and rollback plan. A weekly review validates incident learnings, privacy commitments, and compliance requirements.

**Cost controls.** Budgets are enforced at namespace and endpoint levels. We track marginal cost per feature and per model to inform architectural choices (e.g., caching, distillation, or batching) and to prevent silent cost creep.

**Operational playbooks.** Each critical pipeline has runbooks with clear detection, diagnosis steps, and rollback commands. Post-incident reviews capture contributing factors, corrective actions, and owners with due dates. Security reviews verify threat models for data exfiltration, prompt injection, and model abuse vectors. Where feasible, we enforce defense-in-depth with allow-lists, content normalization, and strict output schemas. Teams rehearse failure scenarios quarterly so handoffs and tooling stay sharp.

**Compliance posture.** Data retention follows least-privilege and purpose limitation. Sensitive fields are tokenized at ingestion and only detokenized in secure enclaves. All access to training data is logged and periodically reviewed. When fine-tuning on user content, we honor opt-outs and document the provenance of each dataset snapshot.

**Scalability notes.** Batch workloads scale horizontally with autoscaling queues; online inference scales with per-endpoint HPA targets that consider both QPS and tail latency. Where latency budgets are tight, we colocate features, caches, and models to reduce cross-zone chatter. We also provide a cost-aware router that can downshift to distilled models when budgets are constrained or when request criticality is low.

## 2. Data Architecture

### Executive Summary
Our data architecture is **Firestore as the single source of truth (SoT)** for operational clinical and product data, hosted in **Canada** to align with PHIPA/PIPEDA residency requirements. We implement a **PHIPA-compliant lifecycle** with **7-year retention for clinical records** (CPO minimum) and **10-year retention for audit logs**. Write paths are validated at the edge and normalized in Firestore; read paths are optimized through security-scoped queries and controlled projections. All events carry immutable audit metadata to support regulatory posture and forensic traceability. See the lifecycle diagram: `data-lifecycle.svg`.

### Logical Data Model (high-level)
- **Tenants & Clinics:** top-level partitioning by tenant (clinic/organization), enforcing strict data isolation.
- **Patients & Episodes:** patient master records; episodes/encounters as time-bounded containers for notes, measures, orders, and documents.
- **Clinician & Roles:** RBAC entities referencing directory identities and scoped to tenant and facility.
- **Documents & Notes:** structured notes with versioning (immutable prior versions) and derived summaries.
- **Operational Telemetry:** usage metrics, model inferences, and configuration flags (feature-gated, CA-first).

Firestore collections (illustrative):
- `/tenants/{tenantId}`
- `/tenants/{tenantId}/patients/{patientId}`
- `/tenants/{tenantId}/episodes/{episodeId}`
- `/tenants/{tenantId}/notes/{noteId}`
- `/tenants/{tenantId}/audit/{eventId}`
- `/tenants/{tenantId}/metrics/{metricId}`

### Source of Truth & Write Paths
- **SoT:** Firestore is authoritative for clinical/operational data; object storage is used only for large binaries (attachments) with Firestore pointers.
- **Validation:** client-side schema guards + server-side validation; writes are **idempotent** via request UUID and **atomic** at the document boundary.
- **Consistency:** eventual across projections; strong per-document. Critical invariants (e.g., consent, identity link) are verified transactionally.

### Read Paths & Projections
- **Principle of Least Access:** queries are constrained by tenant, role, and encounter scope.
- **Projections:** computed/materialized views limited to non-PHI when feasible; PHI projections require explicit policy and purpose of use.
- **Latency/Cost:** indexes are curated; hot paths pre-indexed; pagination and server timestamps ensure stable reads.

### Data Lifecycle & Retention
- **Creation → Active Use → Archival → Expiry/Deletion** controlled by policy engines.
- **Retention:** clinical notes **≥ 7 years**; audit logs **≥ 10 years** (operations, access, and policy decisions).
- **Legal Holds:** retention clock pauses under hold; deletions are cryptographically recorded in audit trail.
- **Diagram:** ![Data Lifecycle](./diagrams/data-lifecycle.svg)  ← reference to `data-lifecycle.svg`.

### Backups & Disaster Recovery (DR)
- **Backups:** daily encrypted snapshots (Canada region), 35-day rolling window minimum; quarterly recovery drills.
- **RPO/RTO:** target **RPO ≤ 24h**, **RTO ≤ 12h** for Firestore-backed services; runbooks codified and tested.
- **Integrity:** backup verification via checksums and random record sampling.

### Multi-Tenancy & Partitioning
- **Isolation:** tenantId is mandatory partition key across all collections; security rules enforce cross-tenant denial by default.
- **Noisy Neighbor Controls:** quotas on read/write per tenant; index design prevents pathological fan-out.

### Metadata, Audit, and Observability
- **Audit Events:** append-only events for create/update/delete/read (where supported), including actor, purpose, policy result, and hash of payload.
- **Time & Identity:** server timestamps; identities bound to OIDC and role assignments.
- **Telemetry:** product metrics avoid PHI by default; if PHI is strictly necessary for safety, it is minimized and tagged for lifecycle.

### Data Quality & Validation
- **Schemas:** versioned JSON schemas; backward-compatible migrations; semantic validation for clinical fields (e.g., units, laterality).
- **Deduplication:** probabilistic patient matching is disallowed for SoT; exact identifiers with verification steps are required.
- **Attachments:** virus/malware scanning; MIME/type gates; max sizes enforced.

### Interoperability & Exports
- **Standards:** HL7 FHIR (selected resources), CDA for document export if required by regulators/partners, CSV extracts for patient-initiated requests.
- **eDiscovery & SAR:** subject access requests supported via export jobs; audit trail included where permissible.
- **Vendor Exit:** documented pathways to export all tenant data in reasonable formats with mapping specs.

### Security & Compliance Hooks (preview)
Security rules, RLS policies (for ancillary stores), and key management are specified in Section 3 (Security & Compliance). Section 2 ensures that data layout, lifecycles, and SoT decisions are **en-CA, Market: CA** aligned and auditable.
