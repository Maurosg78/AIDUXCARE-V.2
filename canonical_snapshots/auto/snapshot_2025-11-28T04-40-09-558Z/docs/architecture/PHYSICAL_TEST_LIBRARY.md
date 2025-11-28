# AiduxCare — Physical Test Library v1.0

Canada-first · en-CA · PHIPA/PIPEDA Ready  
Status: Canonical (Do Not Modify Without SoT Review)

---

## 1. Purpose
AiduxCare implements a structured, region-based MSK physical test library to support physiotherapists in documenting objective assessment findings.  
This library is **strictly informational**, **non-diagnostic**, and **non-prescriptive**.  
It exists to:

- Standardize documentation quality.
- Streamline physical exam workflow.
- Provide clean inputs to the SOAP-generation pipeline.
- Improve medico-legal clarity and regulatory compliance.

---

## 2. Regulatory & Clinical Boundaries (Critical)
AiduxCare **does not**:

- Provide diagnoses.
- Indicate pathology.
- Give sensitivity/specificity numeric claims.
- State treatment recommendations.
- Suggest modality parameters (TENS/US/IFC/Shockwave/etc.).
- Replace clinical judgment.

AiduxCare **only documents**:

- Which physical tests were performed.
- Their *factual*, *observed* result when entered by the physiotherapist.
- Neutral descriptions of what each test generally explores (e.g., “provocation test for subacromial structures”).

---

## 3. Architecture

### 3.1 Core Files
- `src/core/msk-tests/library/mskTestLibrary.ts`
- `src/core/msk-tests/matching/fuzzyMatch.ts`
- `src/pages/ProfessionalWorkflowPage.tsx`
- `src/context/SessionContext.tsx`
- `src/hooks/useSharedWorkflowState.ts`
- `src/services/vertex-ai-service-firebase.ts`

### 3.2 Data Shape
```ts
interface PhysicalTest {
  id: string;
  name: string;
  region: MSKRegion;
  sensitivity?: string;    // qualitative only (“high”, “moderate”), optional
  specificity?: string;    // qualitative only
  description: string;     // strictly neutral, regulatory safe
}
```

### 3.3 Regions in v1.0
- Shoulder
- Cervical
- Lumbar
- Knee
- Ankle

### 3.4 Storage Structure
Persisted in SessionContext → `sessionData.physicalEvaluation.selectedTests[]`
```ts
{
  id: string;
  name: string;
  region: string | null;
  source: 'ai' | 'manual' | 'custom';
  result: string | null;     // “positive”, “negative”, “inconclusive”, optional
  notes: string | null;      // physiotherapist’s factual observation
}
```

---

## 4. Fuzzy Matching Rules (AI → Library)
Vertex suggestions are matched to the library using a Dice similarity coefficient.

Rules:
- > 0.75 → accept match
- ≤ 0.75 → treat as custom test
- Case-insensitive, punctuation-insensitive
- No external dependencies

---

## 5. Workflow Behaviour (Tab 2)

### 5.1 Sections
- **Suggested Tests (AI)** — based on transcript analysis; mapped via fuzzy matching; physiotherapist may add or ignore.
- **Manual Selection (Library)** — tests grouped by region; multi-select with checkboxes.
- **Custom Tests** — free text; supports English, Spanish, or French content entered by user.
- **Selected Tests** — displays all chosen tests across sources with editable results/notes and remove option.

---

## 6. SOAP Output Integration

### 6.1 Location in prompt (second call to Vertex)
Payload includes a “Physical Evaluation Summary” with:

- List of tests performed.
- Factual observation if provided.
- No interpretation, no diagnosis.

### 6.2 Example Output
```
Physical Evaluation:
- Empty Can test performed — positive for pain.
- Hawkins-Kennedy test — negative.
- Custom test: “Cervical rotation screen” — patient reports stiffness.
```

### 6.3 Prohibited in SOAP Output
- “Suggestive of…”
- “Consistent with…”
- “Indicates pathology…”
- “Rotator cuff tear likely…”
- Numeric sensitivity/specificity
- Treatment recommendations

---

## 7. Extensibility Guidelines
Any future additions must:

- Be neutral and factual.
- Avoid numeric clinical claims.
- Remain MSK, not diagnostic imaging tests.
- Follow naming convention: lower-case, hyphenated `id`.
- Include short description (1–2 lines).

Future expansions planned:

- Shoulder subcategories
- Hip region
- Wrist/hand tests
- Vestibular basics
- Evidence citations (v3.5)

---

## 8. DoD (Definition of Done)
A change is “done” only if:

- All regions and tests load correctly.
- Fuzzy matcher maps AI-suggested tests.
- Manual selection and custom entry both persist in SessionContext.
- SOAP output lists all tests factually.
- No diagnosis, no parameters, no claims.
- `npm run lint` → 0 errors.
- No changes in `src/_experimental/**`.
- No assistant/voice reactivation.
- No modifications to transcription.
- Workflow tabs unaffected outside Physical Evaluation.

---

## 9. Versioning
This document corresponds to:

- Aidux North – Physical Test Library
- Canonical Snapshot: 2025-11
- Version: v1.0

Modifications require SoT review and a new canonical snapshot.

