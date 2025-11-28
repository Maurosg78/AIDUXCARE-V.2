# Physical Test Library & Customization — Status & Roadmap

**Market:** CA | **Language:** en-CA | **Status:** Ready for CTO Review  
**Date:** 2025-01-XX | **Owner:** Core Workflow Team

---

## Executive Summary

The Physical Test Library is now a **clinical asset** with structured, observation-only fields. All UI text is canonical English (en-CA). Custom tests currently use generic forms; we propose a template system to provide structured fields for common test patterns.

**Current Status:** ✅ Library operational | ✅ Language compliant | ⚠️ Custom tests need enhancement

---

## 1. Clinical & Regulatory Principles

### Truth-First, Observation-Only

Every field collected must correspond to something the physiotherapist can **observe or measure** during the exam:

- ✅ **Acceptable:** Joint angles, presence/absence of pain, location, type of pain, instability, locking, reproduction of symptoms
- ❌ **Prohibited:** Diagnostic interpretation (e.g., "radiculopathy L5 present")

**Boundary:** Documentation, not decision-making.

### NormalTemplate = Descriptive, Not Diagnostic

Each test may include a `normalTemplate`, but that text:

- Describes a **normal finding** in plain clinical language
- Never states a diagnosis or conclusion

**Example (acceptable):**
> "Supine SLR bilaterally: smooth movement, stretch in posterior thigh only, no radicular pain reproduced."

**Example (rejected):**
> "SLR normal, no problem with the nerve." *(too interpretative)*

### Test-Specific Fields, No Generic Forms

If a test is in the library, its fields reflect **how that test is documented in real practice**:

- **SLR** → right/left angles + radicular symptoms + description
- **Spurling** → reproduction of arm symptoms, side, description
- **Lachman** → side, translation/increased laxity, end-feel

A generic "big textarea" is only a **fallback** for custom tests, not the default for canonical MSK content.

### Notes Only as Complement

Each test has at least one structured field (number, yes/no, etc.). `notes` is allowed, but only as **complementary** nuance: apprehension, unusual behaviour, contextual remarks.

### SOAP Remains Descriptive

The data sent to the SOAP engine is a list of **factual, structured statements**:

- `"Right SLR: 60°, sharp pain radiating to posterior calf."`

Any higher-level interpretation or treatment plan remains clearly labelled as **"suggested wording / proposed plan"**, and always requires physiotherapist validation.

---

## 2. Current Implementation Status

### 2.1 Language & Canonical Locale ✅

**Status: COMPLETE**

- All UI texts for the Physical Evaluation tab are now in **English (en-CA)**
- Fixed labels:
  - `"Estado: Normal"` → `"Status: Normal"`
  - `"Resultado anormal"` → `"Abnormal result"`
- Aligned with Aidux North standard: **Canada-first, en-CA as canonical**
- **Next step:** Centralize strings in a dedicated constants/i18n layer (future enhancement)

### 2.2 Data Model & Rendering ✅

**Status: OPERATIONAL**

#### Extended Test Definition

Library tests now have:
- `id`, `region`, `name`, `description`, `typicalUse`
- `normalTemplate` (descriptive-only)
- `fields: TestFieldDefinition[]` with `kind` types:
  - `angle_unilateral`, `angle_bilateral`
  - `yes_no`
  - `score_0_10`
  - `text`
  - *(extensible for other patterns)*

#### Evaluation Entries & Values

`EvaluationTestEntry` now includes:
- `values?: Record<string, number | string | boolean | null>`

On creation from library:
- `values` is initialized with keys from `fields` (all `null` initially)
- **Backwards compatible:** Tests without `fields` still use the generic form

#### UI Behaviour

- **If test has `fields`:** Renders specific inputs (angle boxes, checkboxes, symptom text, etc.)
- **If test has no `fields`:** Falls back to existing generic "result + notes" form
- **Custom test form:** Only appears when user explicitly chooses "Add custom test"

#### SOAP Integration

- `PhysicalExamResult` now carries `values` alongside `result` and `notes`
- Before sending to Vertex/SOAP generator, we build **literal phrases**:
  - `Right Cervical Rotation: 55°`
  - `Pain reproduced on right side: Yes`
  - `Symptoms description: sharp pain radiating to right arm`
- These phrases feed the `physicalEvaluationSummary` used by the SOAP engine

### 2.3 Library Coverage

**Current State:**
- **21 tests with structured fields** (SLR, Lachman, McMurray, Spurling, Neer, Drop Arm, etc.)
- **9 legacy tests** (without fields, backward compatible)
- **7 regions covered:** shoulder, cervical, lumbar, knee, ankle, hip, thoracic

**Coverage Quality:**
- Most common MSK tests now have field-specific forms
- Vertex AI suggestions are matched to library tests via fuzzy matching
- When matched, tests appear with structured fields instead of generic textarea

---

## 3. Customization Proposal

**Document:** `docs/north/PHYSICAL_TEST_CUSTOMIZATION_PROPOSAL.md`

### 3.1 Problems Identified

1. **Language Drift** ✅ **FIXED**
   - Some labels had slipped into Spanish; now fixed to en-CA

2. **Custom Tests Too Generic** ⚠️ **NEEDS ENHANCEMENT**
   - Custom tests currently rely on a generic form
   - They don't benefit from the structured richness of canonical tests
   - Examples: "Lumbar Range of Motion Assessment", "Palpation of Lumbar Spine", "Muscle Strength Testing (Myotomes)"

### 3.2 Proposed Solution: Template System

#### Phase 1 – Canonical Language ✅ **DONE**

- All labels/tooltips/messages in Physical Evaluation UI are English only (en-CA)
- Centralization into constants/i18n module (future enhancement)

#### Phase 2 – Template System for Custom Tests (Proposed)

**Concept:**
Introduce a small set of **structured templates** for custom tests:

- `range-of-motion` (angles + side + symptoms)
- `palpation` (area, tenderness yes/no, type of pain)
- `strength-testing` (muscle group, side, grade, symptoms)
- `neural-tension` (side, symptom reproduction, description)
- `special-test` (side, pain present, location, description)

**User Experience:**
When creating a custom test, the physiotherapist can:
1. Choose a template → yields **structured fields** similar to library tests
2. Or fall back to generic form (for full flexibility & backward compatibility)

**Benefits:**
- Custom tests still feel "free-form"
- Better structured data capture
- More consistent SOAP output
- Easier analytics/audit on test usage

**Implementation:**
- Add `templateId?: string` to `EvaluationTestEntry`
- Create `src/core/msk-tests/templates/testTemplates.ts`
- Update custom test form with template selector
- Render fields based on template when `templateId` exists

### 3.3 Questions for CTO Decision

1. **Template Library Scope**
   - How many templates should we ship in v1?
   - **Proposal:** 5–10 most common patterns

2. **Template Selection UX**
   - Explicit selection vs auto-suggestion based on test name?
   - **Proposal:** Explicit selection with smart defaults

3. **AI Integration**
   - Should Vertex AI suggest a template type when the user names a custom test?
   - **Proposal:** Yes, as a hint (user can override)

4. **Generic Fallback**
   - Confirm we keep a fully generic option for edge cases?
   - **Proposal:** Yes, always available

---

## 4. Guaranteeing "Truthful Tests" Going Forward

### Content Design Checklist

For any new test entering the library:

- [ ] Are all fields strictly observable?
- [ ] Does `normalTemplate` only describe, not interpret?
- [ ] Is this how physiotherapists actually document this test in real life?
- [ ] No diagnostic labels, no "this means X"
- [ ] No treatment or prescription encoded at library level

### Language & Compliance Checklist

- [ ] Text in **en-CA**
- [ ] No Spanish remnants
- [ ] Descriptive, not interpretative

### Owner & Review Process

- **Current:** Mauricio acts as initial *Clinical Content Owner v0.1*
- **Future:** Move to a small **clinical advisory group** and a formal review cycle

---

## 5. What This Means for Niagara (MVP View)

For the Niagara MVP, we can confidently say:

✅ **AiduxCare ships with a growing, clinically grounded MSK test library**, in English, with fields that reflect true practice.

✅ **The system:**
- **Documents** physical findings in a structured way
- Generates **clear, legal-grade SOAP text** from those findings
- Keeps interpretation and treatment always in the physiotherapist's hands

✅ **Compliance:**
- PHIPA/PIPEDA aligned (observation-only, no diagnostic logic)
- Canonical en-CA language throughout
- Audit-ready structured data

---

## 6. Next Steps & Timeline

### Immediate (This Week)
- ✅ Language compliance fix (DONE)
- ✅ Library expansion to 21 structured tests (DONE)
- 📋 CTO review of template system proposal

### Short-term (Next Sprint)
- [ ] CTO decision on template system
- [ ] If approved: Implement Phase 2 (template system)
- [ ] Add 5–10 common test templates

### Medium-term (Next Quarter)
- [ ] Centralize UI strings in constants/i18n module
- [ ] Expand library to 30+ structured tests
- [ ] Clinical advisory group review process

---

## 7. Related Documents

- [`PHYSICAL_TEST_LIBRARY.md`](./PHYSICAL_TEST_LIBRARY.md) — Technical architecture
- [`PHYSICAL_TEST_CUSTOMIZATION_PROPOSAL.md`](./PHYSICAL_TEST_CUSTOMIZATION_PROPOSAL.md) — Detailed template system proposal
- [`VERTEX_RATE_LIMITING.md`](./VERTEX_RATE_LIMITING.md) — API quota management

---

## 8. Decision Points for CTO

**Required Decisions:**

1. **Approve template system?** (Yes/No/Defer)
2. **Template count for v1?** (Proposal: 5–10)
3. **Template selection UX?** (Explicit/Auto-suggest)
4. **AI template suggestion?** (Yes/No)
5. **Timeline for Phase 2?** (Next sprint/Next quarter/Defer)

**Recommendation:**
- ✅ Approve template system
- ✅ Start with 5–7 templates (range-of-motion, palpation, strength-testing, neural-tension, special-test)
- ✅ Explicit selection with AI hints
- ✅ Timeline: Next sprint (2–3 weeks)

---

**Status:** Ready for CTO review and decision on template system implementation.

