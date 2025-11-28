# AiduxCare North — Canonical Docs Index

Market: Canada · en-CA · Compliance: PHIPA/PIPEDA  
Status: Living index (keep in sync with latest canonical files)

---

## How to Use This Folder
All regulatory, workflow, and technical artifacts for AiduxCare North live under `docs/north/`. Use this README as the single point of entry:

- **Canonical Specs** stay in `docs/north/` (no subfolders unless noted).
- **Snapshots** or archived specs belong in `canonical_snapshots/` and are linked here when relevant.
- Every new deliverable must be linked below with owner + last update.

---

## Current Canonical Documents

| File | Purpose | Owner | Last Update |
| --- | --- | --- | --- |
| [`ENGINEER_FIRST_APPROACH.md`](./ENGINEER_FIRST_APPROACH.md) | **🚀 FIRST APPROACH** — Guía completa para nuevos ingenieros: estado actual, gaps críticos, primer paso. | CTO | 2025-11-16 |
| [`PROPUESTA_IMPLEMENTACION_GAPS_CRITICOS.md`](./PROPUESTA_IMPLEMENTACION_GAPS_CRITICOS.md) | **Gaps críticos** — Análisis técnico + plan de implementación aprobado por CTO (consent, review gate, transparency). | Implementador | 2025-11-16 |
| [`HANDOFF_DIA1_CONSENT_WORKFLOW.md`](./HANDOFF_DIA1_CONSENT_WORKFLOW.md) | **✅ DÍA 1 COMPLETADO** — Handoff real: código implementado, flujo completo, testing checklist, plan DÍA 2-3. | Implementador | 2025-11-16 |
| [`HANDOFF_DIA2_CPO_REVIEW_GATE.md`](./HANDOFF_DIA2_CPO_REVIEW_GATE.md) | **✅ DÍA 2 COMPLETADO** — CPO Review Gate: review tracking, UI indicators, review gate, audit trail. | Implementador | 2025-11-16 |
| [`PHYSICAL_TEST_LIBRARY.md`](./PHYSICAL_TEST_LIBRARY.md) | Physical test library + workflow architecture (Tab 2), regulatory limits, DoD. | Core Workflow | 2025-11-13 |
| [`CLINICAL_COPILOT_ARCHITECTURE.md`](./CLINICAL_COPILOT_ARCHITECTURE.md) | **Core architecture** — "expose, don't decide" principles, language constraints, regulatory compliance. | Core AI | 2025-01-XX |
| [`MASTER_PROMPT_COMPLETE.md`](./MASTER_PROMPT_COMPLETE.md) | **Master prompt completo** — prompt maestro, ejemplos, puntos de discusión para CTO. | Core AI | 2025-01-XX |
| [`MASTER_PROMPT_DESIGN_CTO.md`](./MASTER_PROMPT_DESIGN_CTO.md) | **Master prompt design for CTO review** — architecture, language patterns, implementation status. | Core AI | 2025-01-XX |
| [`MASTER_PROMPT_CTO_SUMMARY.md`](./MASTER_PROMPT_CTO_SUMMARY.md) | **1-page executive summary** — prompt maestro para revisión rápida del CTO. | Core AI | 2025-01-XX |
| [`PHYSICAL_TEST_LIBRARY_STATUS_CTO.md`](./PHYSICAL_TEST_LIBRARY_STATUS_CTO.md) | **Status & roadmap for CTO review** — principles, current state, template proposal. | Core Workflow | 2025-01-XX |
| [`PHYSICAL_TEST_LIBRARY_EXECUTIVE_SUMMARY.md`](./PHYSICAL_TEST_LIBRARY_EXECUTIVE_SUMMARY.md) | **1-page executive summary** for quick CTO/stakeholder review. | Core Workflow | 2025-01-XX |
| [`PHYSICAL_TEST_LIBRARY_SLIDE_DECK.md`](./PHYSICAL_TEST_LIBRARY_SLIDE_DECK.md) | **Slide deck (Marp/Deckset format)** for CTO/Niagara presentation. | Core Workflow | 2025-01-XX |
| [`PHYSICAL_TEST_LIBRARY_SPEAKER_NOTES.md`](./PHYSICAL_TEST_LIBRARY_SPEAKER_NOTES.md) | **Speaker notes** — what to say on each slide (10–12 min presentation). | Core Workflow | 2025-01-XX |
| [`PHYSICAL_TEST_CUSTOMIZATION_PROPOSAL.md`](./PHYSICAL_TEST_CUSTOMIZATION_PROPOSAL.md) | Detailed technical proposal for custom test templates. | Core Workflow | 2025-01-XX |
| [`VERTEX_RATE_LIMITING.md`](./VERTEX_RATE_LIMITING.md) | Free-tier safeguards for Vertex quota (backoff, cooldown, trimming). | Core Workflow | 2025-11-13 |
| [`SOAP_GENERATION_ARCHITECTURE.md`](./SOAP_GENERATION_ARCHITECTURE.md) | **SOAP note generation architecture** — technical design, initial vs follow-up, Vertex AI integration, compliance. | Core Workflow | 2025-01-XX |
| `SOURCE_OF_TRUTH.md` *(external)* | Overall Aidux North SoT guardrails. | PMO | – |

> **Note:** Update the table whenever a doc is added or revised. Keep dates in `YYYY-MM-DD`.

---

## Pending / Upcoming Artifacts

- Queue any new deliverable here before creating the file.
- Include status (draft/canonical) and expected owner.

| Artifact | Status | Owner | Notes |
| --- | --- | --- | --- |
| Consent Workflow Implementation | ✅ Completado | Implementador | DÍA 1 - GAP #1 crítico (ver HANDOFF_DIA1) |
| CPO Review Gate Implementation | ✅ Completado | Implementador | DÍA 2 - GAP #2 crítico (ver HANDOFF_DIA2) |
| Transparency Report UI | Pending | Implementador | DÍA 3 - GAP #3 alta prioridad |
| Audit Service Enhancement | Pending | Implementador | Consideración adicional CTO |
| Feature Flags Architecture | Pending | Implementador | Consideración adicional CTO |
| Error Tracking Integration | Pending | Implementador | Consideración adicional CTO |

---

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2025-11-16 | Added HANDOFF_DIA1_CONSENT_WORKFLOW.md (DÍA 1 completado + handoff real) | Implementador |
| 2025-11-16 | Added ENGINEER_FIRST_APPROACH.md (onboarding guide) + PROPUESTA_IMPLEMENTACION_GAPS_CRITICOS.md (CTO approved) | CTO + Implementador |
| 2025-11-13 | Created index consolidating current canonical docs. | GPT-5 Codex |

