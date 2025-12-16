---
marp: true
theme: default
paginate: true
header: 'AiduxCare – Physical Test Library'
footer: 'Niagara Innovation Hub MVP | 2025'
---

<!-- _class: lead -->
# AiduxCare – Physical Test Library & Evaluation Engine

**Clinical truth, auditability, and AI-assisted documentation**

*Product: AiduxCare (Aidux North)*  
*Scope: MSK Physical Tests + SOAP Integration*  
*Context: Niagara Innovation Hub MVP*

---

## Problem & Opportunity

### Current Reality (Physiotherapy Clinics)

- Physical exams are:
  - ⏱️ Time-consuming to document
  - 📝 Inconsistent between therapists
  - ⚖️ Weak from a medico-legal perspective (free text, missing details)

- Generic AI/chatbots are:
  - ⚠️ Unsafe (diagnosis/prescription risk)
  - 🔒 Non-auditable
  - 🚫 Misaligned with PHIPA/PIPEDA

### Opportunity

Build an **EMR-native physical test engine** that:
- Documents **what really happened in the exam**
- Feeds **legal-grade SOAP notes**
- Stays within **"assist, don't decide"** guardrails

---

## Design Principles (Clinical & Regulatory)

### 1. Truth-First, Observation-Only

Every field = something the physio can **see, measure, or reproduce**  
❌ No fields that encode diagnosis or prognosis

### 2. Normal = Descriptive, Not Interpretative

`normalTemplate` describes normal findings in plain language

**Example:**  
*"Supine SLR bilaterally: smooth movement, posterior thigh stretch only, no radicular pain."*

### 3. Test-Specific, Not Generic

Each canonical test has its **own fields** (angles, pain yes/no, symptoms, etc.)  
Generic text area only as **fallback**, never for core library

### 4. English (en-CA) as Canonical

All labels, descriptions, prompts in **Canadian English**  
Future localization layered on top, no mixing in core content

---

## Architecture Overview

### Bounded Contexts

**Clinical Catalog (static, versioned)**
- Physical test definitions
- Field schema per test
- Normal templates & references

**Session Engine (PHI)**
- What happened in *this* visit
- Selected tests + measured values

**Decision / Suggestion Engine**
- Optional AI suggestions (tests, wording, treatment drafts)
- Strictly separated from PHI persistence

**Audit Layer**
- Who saw what, when
- What was suggested vs. what was accepted
- Version of catalog used

---

## Current Implementation (MVP MSK)

### Library & Data Model

**Library of MSK tests with:**
- `id`, region (Lumbar, Cervical, Shoulder, Knee, etc.)
- `name`, `description`, `typicalUse`
- `normalTemplate` (descriptive only)
- `fields[]` (test-specific structure)

**`EvaluationTestEntry` in UI/state:**
- `testId`, `region`, `result` (`normal` / `abnormal` / `not_tested`)
- `values` (angles, yes/no, scores, text)
- `notes` (optional nuance)

### UI Behaviour

User can:
- ✅ Accept AI-suggested tests (when available)
- ✅ Add from library by region
- ✅ Create custom tests (with or without templates)

---

## Example: Test-Specific Fields

### Straight Leg Raise (SLR – Lumbar)

**Fields:**
- Right SLR angle (°)
- Left SLR angle (°)
- Radicular pain reproduced? (yes/no)
- Symptom description (text)

**Normal template:**  
*"Supine SLR bilaterally: 0–70° with posterior thigh stretch only, no radicular pain reproduced."*

### Cervical Rotation

**Fields:**
- Right rotation angle (°)
- Left rotation angle (°)
- Symptoms description (text)

### Outcome

✅ No generic "big box"  
✅ Every captured value = directly usable in SOAP and in audits

---

## SOAP Integration

### From Structured Exam → Legal-Grade Notes

**Before calling the SOAP generator, we build factual sentences:**

- "Right SLR: 60°, sharp pain radiating to posterior calf."
- "Left SLR: 75°, posterior thigh stretch only, no radicular symptoms."
- "Cervical rotation: R 50°, L 60°, mild tightness on right side."

**`physicalEvaluationSummary` includes:**
- List of tests performed
- Objective values
- Symptom descriptions (without diagnosis wording)

### Role of AI

**Optional:**
- Propose clear wording for SOAP "Objective" and "Assessment"
- Suggest a **draft** plan of care based on catalogs & evidence

**Always:**
- Labeled as **"Suggested wording / Proposed plan"**
- Requires physiotherapist review and acceptance

---

## Custom Tests & Templates (Future-Ready)

### Problem

Custom tests today = generic form → low structure

### Proposal

**Introduce templates for frequent patterns:**
- Range of Motion
- Strength testing
- Palpation
- Functional tests (e.g., sit-to-stand, single-leg stance)

**When creating a custom test:**
- Therapist picks a template → structured fields appear
- Or chooses fully generic mode (fallback)

### Benefit

Customization without losing:
- ✅ Structure
- ✅ Consistency
- ✅ Auditability

---

## Governance & Versioning

### Clinical Governance

**Temporary:** Clinical Content Owner v0.1 = Mauricio  
**Future:** External clinical advisory group / committee

### Versioning

**Each test has:**
- `version` (semantic)
- `source` (guidelines, internal expert, etc.)

**Sessions log:**
- Test ID + version used
- Allows:
  - ✅ Audit reconstruction
  - ✅ Safe rollback
  - ✅ "What content did we show in 2026 Q2?"

---

## Regulatory Fit (Niagara MVP)

### Positioning

AiduxCare is positioned as:
- **EMR + documentation assistant**, not autonomous decision system
- Focused on **capturing reality of the exam** and **improving documentation**

### Compliance by Design

**Separation of:**
- Clinical Catalog (static, no PHI)
- Session Data (PHI)
- Decision/Suggestion Logic (AI/rules)
- Audit Logs (traceability)

**Prepared for:**
- ✅ PHIPA / PIPEDA expectations
- ✅ Future SOC2 / ISO 27001 style evidence (catalog versioning, audit traces)

---

## Roadmap & Decisions Needed

### Roadmap (Content Side)

- Expand MSK library per region (Lumbar, Cervical, Shoulder, Knee, Hip, Ankle)
- Add **Geriatric** and **Pregnancy** verticals next
- Introduce **template system** for custom tests
- Gradually link to evidence-based protocols (documentation first, treatment later)

### Decisions We Need from CTO

1. **Template count & priority**
   - How many templates in the first release? (proposal: 5–10)

2. **Evidence linkage**
   - When and how to start annotating tests with guideline references?

3. **Governance model**
   - When to move from "single owner" to advisory group?

4. **Scope for MVP vs Post-MVP**
   - Clear boundary: what ships for Niagara demo vs. what stays in the roadmap

---

<!-- _class: lead -->
## Closing

# AiduxCare Physical Test Engine

**Grounded in real physiotherapy practice**  
**Structured for documentation, not diagnosis**  
**Designed for regulatory scrutiny and audit**  
**Ready to become the clinical spine of an intelligent, compliant EMR**

> *"We don't invent tests. We capture them truthfully and make them auditable."*

---

## Appendix: Current Library Status

### Coverage

- **21 structured tests** with field-specific forms
- **9 legacy tests** (backward compatible)
- **7 regions:** shoulder, cervical, lumbar, knee, ankle, hip, thoracic

### Examples

**Shoulder:** Neer, Drop Arm, Apprehension/Relocation, Empty Can  
**Cervical:** Spurling, ULTT A, CFRT, Active Rotation  
**Lumbar:** SLR, Slump, Prone Instability  
**Knee:** Lachman, McMurray, Valgus/Varus Stress  
**Ankle:** Anterior Drawer, Thompson, Talar Tilt  
**Hip:** FABER, FADIR  
**Thoracic:** PA Spring Test

---

## Appendix: Technical Stack

### Current Implementation

- **Library:** TypeScript definitions in `src/core/msk-tests/library/`
- **Matching:** Fuzzy matching for AI suggestions
- **UI:** React components with dynamic field rendering
- **SOAP:** Structured data → enriched notes → Vertex AI

### Data Flow

```
AI Suggestion → Fuzzy Match → Library Test (with fields)
                                    ↓
                            User Documents
                                    ↓
                        Structured Values
                                    ↓
                        Enriched Notes
                                    ↓
                        SOAP Generator
```

---

## Questions & Discussion

**Ready for:**
- ✅ CTO review and decision on template system
- ✅ Technical implementation planning
- ✅ Clinical advisory group formation
- ✅ Niagara MVP preparation

**Contact:** Core Workflow Team  
**Documentation:** `docs/north/PHYSICAL_TEST_LIBRARY_STATUS_CTO.md`

