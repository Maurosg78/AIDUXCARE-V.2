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
## 3. Security & Compliance

## 4. AI Layer

### Executive Summary
- Canada-first pipeline from ambient speech to structured SOAP with predictable, auditable latency.
- Whisper-based transcription with streaming/chunking to keep **p95** within clinical tolerance and reduce rework.
- Vertex AI prompt chain drives **SOAP** (Subjective, Objective, Assessment, Plan) with guardrails and deterministic fallback.
- Langfuse observability + EVALs track quality, latency, and regressions with alerting on **red flags**.
- Versioned prompts (SEMVER) with progressive rollout, instant rollback, and immutable audit records.
- PHIPA-friendly handling by design: minimisation/redaction, no raw PHI in logs, storage in Canadian regions by default.
- Cost-aware scaling that protects clinician trust and legal defensibility.

![AI pipeline](./diagrams/ai-pipeline.svg)

### 4.1 Transcription Pipeline — Whisper
We capture ambient audio from the exam room or virtual visit with explicit user consent and device checks (sample rate, channel config). **Streaming** is preferred for responsiveness; **batch** is supported for long sessions. Audio is segmented into **10–30 s chunks** with a **0.5–1.0 s overlap** to preserve context around boundaries; for streaming, finalisation waits for a short silence window to stabilise tokens. Target latencies: **p50 ≤ 1.5 s**, **p95 ≤ 3.0 s** per chunk on M-class instances backed by GPU where available.  
Output formats include **JSON** (per-chunk with timestamps and confidence), and **JSONL** session exports for downstream replay. Optional diarisation hints (speaker tags, turn-taking signals) are passed when available; if not, we emit stable timestamps that the SOAP generator can align to sections.

### 4.2 SOAP Generation — Vertex AI
A structured **prompt chain** transforms the transcript into **SOAP**. Stage 1 normalises text (spelling, medical abbreviations), Stage 2 extracts **Subjective** and **Objective** with units/values, Stage 3 drafts **Assessment** (ICD-10 candidate codes, differential if applicable), and Stage 4 proposes a **Plan** aligned to scope-of-practice.  
**Guardrails** enforce section presence, ban forbidden content (e.g., speculative diagnoses flagged as definitive), and limit free text to required fields. We run with constrained temperature and **deterministic fallback**: if the EVAL or guardrail fails, we fall back to the last-known-good prompt version to guarantee deliverability. All model calls attach purpose-of-use and clinic scope to support audit and PHIPA reporting.

### 4.3 Observability & EVAL — Langfuse
Each request generates **traces/spans** across the pipeline: capture → ASR chunks → prompt stages → post-processing. We record latency percentiles, token usage, and **quality scores** (coverage of chief complaint, completeness of vitals, medication reconciliation). **Red-flag alerts** (e.g., hallucinated meds, contradictory vitals) page the on-call and **gate releases**: a rollout halts automatically if quality or p95 exceed thresholds. Traces are retained without raw PHI; we store hashed references and anonymised counters.

### 4.4 Prompt Versioning — Rollout & Rollback
Prompts follow **SEMVER**: `soap-note@vMAJOR.MINOR.PATCH`. New versions ship behind a **rollout %** (per clinic/tenant or cohort) with Langfuse counters comparing key metrics vs. baseline. **Instant rollback** is a pointer flip to the previous version—no deploy required. We keep an **audit log** of rationale, EVAL results, and sign-off, enabling reproducibility and rapid forensics.

![Prompt versioning](./diagrams/prompt-versioning.svg)

checksum: sha256:<template-hash>
changelog:
  - tightened PHIPA redactions
  - improved Objective extraction heuristics
```

### 4.5 PII Handling — PHIPA-Friendly
We apply **minimisation at capture** (mute periods, no-wake zones), and perform **redaction pre-persistence** (identifiers, contact details) with human-in-the-loop overrides when policy allows. Telemetry and logs exclude raw PHI; we store **hashes** or **token counts** only, and keep pointers to encrypted records in Firestore/Cloud Storage (Canada regions). Retention and legal holds inherit from Section 2; exports include only the minimum necessary with time-boxed access and complete audit context.


### Executive Summary
- Zero-trust posture with least-privilege enforced through **RBAC** (role-based access control) and **RLS** (row-level security).
- **Verified identity** on every request using **Supabase Auth** JSON Web Tokens (JWT) with scoped claims.
- **Encryption in transit** via **TLS 1.3** and **encryption at rest** in Firestore (GCP-managed keys; **CMEK** optional when required by customers or regulators).
- **Clinic/patient isolation** using `clinic_id` and author scoping across read/write paths.
- **Immutable, signed notes** and an **append-only audit trail** enabling forensics and tamper evidence.
- **PHIPA**-aligned **data minimization**, **retention**, and **redaction** controls, documented and testable.
- **Deny-by-default** guardrails: no implicit access; policy engines must explicitly allow.

### 3.1 Identity, AuthN/AuthZ (JWT → RBAC → RLS)
We authenticate users with **Supabase Auth** (OIDC-compatible). The front end obtains a short-lived **JWT** that includes verifiable, minimal claims:
- `sub` (subject: unique user ID)
- `role` (e.g., `admin`, `clinician`, `reviewer`)
- `clinic_id` (current clinic/tenant scope)
- Optional: `purpose_of_use`, `session_id`, `iat/exp`

The **back end** validates token signature, issuer, audience, and expiry. **RBAC** maps roles to allowed actions (read/write/approve), then **RLS** restricts rows by `clinic_id` and authorship. Access to Firestore uses a server **service account** with scoped permissions; requests include a policy context derived from the JWT. Reads/writes that cannot be attributed to a valid identity and clinic are **denied by default**.

#### RBAC (roles → permissions)
| Role      | Read Patients      | Write Notes | Approve/Sign | Read Audit | Manage Users |
|-----------|--------------------|-------------|--------------|------------|--------------|
| admin     | clinic             | clinic      | yes          | clinic     | yes          |
| clinician | own + assigned     | own         | own          | no         | no           |
| reviewer  | clinic (read-only) | no          | co-sign      | clinic     | no           |

### 3.2 Encryption
- **In transit:** All FE↔BE and BE↔cloud service calls use **HTTPS/TLS 1.3** with modern ciphers; HSTS and TLS version pinning are enabled where supported.
- **At rest:** Firestore data is encrypted with **Google-managed keys** by default. For customers requiring dedicated control, we support **Customer-Managed Encryption Keys (CMEK)** with documented rotation procedures and incident runbooks.

### 3.3 Row-Level Security (RLS) — isolation
The **database of record for relational artefacts** (e.g., note metadata, exports, tasks) enforces **RLS** to guarantee clinic and author scoping. Example policy set for `note_metadata`:

```sql
-- Enable RLS on the table
ALTER TABLE note_metadata ENABLE ROW LEVEL SECURITY;

-- SELECT: author OR admin/reviewer from the same clinic
CREATE POLICY nm_read_scoped
ON note_metadata FOR SELECT USING (
  current_setting('request.jwt.claims', true)::jsonb->>'clinic_id' = clinic_id
  AND (
    current_setting('request.jwt.claims', true)::jsonb->>'sub' = author_id
    OR (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('admin','reviewer')
  )
);

-- UPDATE: author only, while the note is still a draft
CREATE POLICY nm_update_author_draft
ON note_metadata FOR UPDATE USING (
  current_setting('request.jwt.claims', true)::jsonb->>'clinic_id' = clinic_id
  AND current_setting('request.jwt.claims', true)::jsonb->>'sub' = author_id
  AND status = 'draft'
);

-- No broad "FOR ALL" policies: deny-by-default for any action not explicitly allowed.
### 3.4 Auth Flow (reference)
![auth-flow](./diagrams/auth-flow.svg)
Flow (textual): The FE requests a session and obtains a JWT from Supabase Auth. Each BE request includes the JWT; the BE validates signature/claims and derives an authorization context (role, clinic, purpose). For relational operations, the BE forwards queries to Postgres with JWT claims available to RLS (via request.jwt.claims). For document operations, the BE uses a service account to call Firestore with server-enforced rules and context checks. All allow/deny decisions are logged with reasons.
### 3.5 Auditability & PHIPA
All security-relevant events are written to an append-only audit log (actor, timestamp, action, resource, purpose, policy result, hash). Signed notes are versioned; once approved/signed, prior versions are immutable, and any redaction produces a new version with cryptographic linkage. Under PHIPA, we apply data minimization (collect/process only what is necessary), define retention windows (e.g., ≥7 years for clinical records; ≥10 years for audit/forensics), and support redaction for disclosures. Legal holds pause the retention clock and are recorded. Exports for Subject Access Requests (SAR) include audit metadata where permissible and are fulfilled via controlled, time-boxed links.


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

> _See also_: [ROADMAP](./ROADMAP.md)

> _See also_: [CODE_STANDARDS](./CODE_STANDARDS.md)

## Compliance Components
See **Compliance Cockpit** for rule coverage and reporting: `./COMPLIANCE_COCKPIT.md`

