# AiDuxCare — AI Governance Framework
**Version:** 1.0
**Date:** 16 Jun 2026
**Reference model:** Mayo Clinic AI Governance (startup-adapted)
**Authors:** Mauricio Sobarzo (CEO/Physiotherapist) + Claude (AI CTO)
**Next review:** When scaling beyond 10 active users or when activating Sócrates

---

## Foundational principle

AiDuxCare does not have a formal multidisciplinary committee. Governance
is implemented as **documented and verifiable artifacts** — not people,
but auditable evidence. Each quadrant of the Mayo Clinic model has a
corresponding artifact in the repository.

> "The physio always decides. The system never says must. Traceability
> is complete. Responsibility belongs to the professional."

---

## Quadrant 1 — Ethical Evaluation & Usage

### Current state

| Artifact | Status | Location |
|----------|--------|----------|
| Physio approval gate (architectural) | ✅ Active | ADR-002, `types.ts:1` |
| Deterministic ClinicalRedFlagDetector | ✅ Active | `src/core/clinical/ClinicalRedFlagDetector.ts` |
| Sócrates principle "never says must" | ✅ Documented | `docs/governance/SAMD_CLASSIFICATION_MEMO.md` |
| Safety gate physical test suggestions | ✅ Active | `ProfessionalWorkflowPage.tsx` |
| regulatoryLanguageGuard | ⚠️ Warns only | `src/core/clinical-safety/` |
| Formal algorithmic bias review | ❌ Pending | — |
| Fairness evaluation by subgroup | ❌ Pending | — |

### Gaps and roadmap

**Priority gap:** `regulatoryLanguageGuard` must block output with
prescriptive language, not only log a warning. (See REGULATORY_DECISION_TREE.md §6)

**Post-pilot gap:** when AiDuxCare exceeds 100 sessions, perform bias
analysis by age, gender, and injury type on generated outputs.
The accumulated longitudinal memory will be the dataset for that analysis.

---

## Quadrant 2 — Legal, Regulatory & Compliance

### Current state

| Artifact | Status | Date | Reference |
|----------|--------|------|-----------|
| GDPR Art.13 — informed consent | ✅ Active | — | SMS + verbal consent gate |
| Google Cloud DPA (CDPA) | ✅ Signed | 14 Jun 2026 | GCP Console, maurosg.2023@gmail.com |
| Firebase DPA | ✅ Covered by GCP CDPA | 14 Jun 2026 | Same project |
| Designated DPO | ✅ Mauricio Sobarzo | 14 Jun 2026 | GCP Console |
| Supervisory authority | ✅ AEPD Spain | 14 Jun 2026 | GCP Console |
| REGULATORY_DECISION_TREE.md | ✅ v1.0 | 16 Jun 2026 | `docs/governance/` |
| SAMD_CLASSIFICATION_MEMO.md | ✅ Exists | — | `docs/governance/` |
| API keys in Secret Manager | ✅ Exported | 14 Jun 2026 | `AIDUXCARE_FUNCTIONS_CONFIG/v1` |
| OpenAI DPA (Whisper API) | ✅ Signed | 18 Jun 2026 | Contract e5347a40, mauricio@aiduxcare.com |
| DPIA (GDPR Art.35) | ❌ Pending | — | Required before Sócrates |
| Art.17 audit trail (data erasure) | ⚠️ Partial | — | `apiErasePatientData` without mandatory authorizationProof |

### Gaps and roadmap

**Closed on 18 Jun 2026:** OpenAI DPA signed for the Whisper API
under contract e5347a40.

**Before Sócrates:** complete DPIA under GDPR Art. 35. Longitudinal
memory with special-category health data (Art. 9) requires this analysis
before processing at scale.

**Before scaling:** `apiErasePatientData` must require `authorizationProof`
as a mandatory field to fully comply with GDPR Art. 17.

---

## Quadrant 3 — Clinical & Scientific Verification

### Current state

| Artifact | Status | Location |
|----------|--------|----------|
| CLINICAL_AI_EVIDENCE.md (peer-reviewed references) | ✅ Exists | `docs/` |
| ClinicalRedFlagDetector validated against literature | ✅ Active | `src/core/clinical/` |
| Lead physio as validator in real production | ✅ Mauricio Sobarzo, 19 years MSK | Valencia pilot |
| Prompt constraints ("no diagnostiques, no prescribas") | ✅ Active | `buildAnalysisPrompt.es.ts` |
| SOAP finalization gate with explicit review | ✅ Active | `SOAPEditor.tsx:1323` |
| Formal clinical validation study | ❌ Pending | — |
| Output accuracy metrics | ❌ Pending | — |
| External review by second clinician | ❌ Pending | — |

### Gaps and roadmap

**Current informal validation:** the lead physio (Mauricio Sobarzo,
physiotherapist with 19 years of MSK clinical experience) uses the system
in real production and reports direct feedback. This constitutes continuous
clinical validation in a controlled pilot, not a formal study.

**At 10 active users:** define the clinical validation protocol.
Minimum metrics: red flag accuracy vs clinical judgment, SOAP documentation
completeness, time saved per session.

**When scaling commercially:** external review by a second independent
clinician (cannot be the same physio using the system).

---

## Quadrant 4 — Organizational Deployment & Change Management

### Current state

| Artifact | Status | Reference |
|----------|--------|-----------|
| Documented deploy rules | ✅ Active | `ENGINEERING.md` |
| No deploy during clinical hours (Mon-Fri 9-17h) | ✅ Active | `ENGINEERING.md` |
| Git workflow with manual approval | ✅ Active | branch `stable` |
| Build only on Mac (not on VPS) | ✅ Active | `ENGINEERING.md` |
| pm2 as process manager with automatic restart | ✅ Active | VPS pilot-vps |
| Secret Manager for API keys | ✅ Active | `AIDUXCARE_FUNCTIONS_CONFIG/v1` |
| whisperProxy auth guard | ✅ Active | `functions/src/whisperProxy.js` |
| Automated CI/CD | ❌ Pending | Backlog |
| INCIDENT_RESPONSE_PLAN.md | ❌ Pending | Backlog |
| Monitoring dashboard performance/fairness | ❌ Pending | Backlog |
| Node.js 22 migration | ⏳ Deadline Oct 2026 | Backlog, reminder Sep 2026 |
| functions.config() → Secret Manager params | ⏳ Deadline Mar 2027 | Backlog |

### Gaps and roadmap

**Most urgent gap:** INCIDENT_RESPONSE_PLAN.md. If there is a data
incident involving real patients, the team needs to know exactly what
to do in the first 72 hours (GDPR Art. 33 obligation).

**Operational gap:** without CI/CD, each deploy is manual and depends
on the founder. Scaling to 10+ users requires overnight automation.

---

## Executive summary of gaps by quadrant

| Quadrant | Current coverage | Critical gap |
|----------|------------------|--------------|
| Ethical Evaluation | 🟡 Partial | regulatoryLanguageGuard blocks, not warns |
| Legal & Compliance | 🟡 Partial | DPIA before Sócrates |
| Clinical Verification | 🟡 Partial | No formal study (acceptable in pilot) |
| Deployment & Change | 🟡 Partial | INCIDENT_RESPONSE_PLAN.md |

**Current position:** AiDuxCare has real and functional governance for
a controlled pilot of 2-10 users. The identified gaps are manageable
within the current scaling horizon. No gap represents immediate risk
to patients or the professional in the pilot.

---

## Governance roadmap by phase

### Phase 1 — Pilot (2-10 users, now)
- [x] GCP DPA signed
- [x] GDPR consent active
- [x] REGULATORY_DECISION_TREE.md
- [x] Formal OpenAI DPA
- [ ] INCIDENT_RESPONSE_PLAN.md
- [ ] regulatoryLanguageGuard → blocking

### Phase 2 — Early commercial (10-50 users)
- [ ] Complete DPIA (Art. 35)
- [ ] Clinical validation study
- [ ] Automated CI/CD
- [ ] Monitoring dashboard
- [ ] Second external clinical reviewer

### Phase 3 — Scale (50+ users)
- [ ] Bias analysis by subgroup
- [ ] ISO 13485 certification (if applicable)
- [ ] SAMD re-evaluation if Sócrates is active
- [ ] External governance audit

---

## Revision history

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 16 Jun 2026 | 1.0 | Initial creation based on Mayo Clinic model | Mauricio Sobarzo + Claude |

---

*This document is evidence of internal governance due diligence.
It does not constitute regulatory certification. Review with a specialist
before scaling to commercial use.*
