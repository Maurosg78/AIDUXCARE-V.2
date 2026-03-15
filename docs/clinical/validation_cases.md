## AiDuxCare – ES Clinical Validation Cases (Canónicos)

**Purpose:**  
Document the canonical Spanish clinical cases used to validate the ES-ES referral report and longitudinal evolution engines.

These cases serve as:

- Regression fixtures for the clinical engine.  
- Reference examples for narrative style and report structure.  
- Shared context between engineering and clinicians.

---

### Structure of a Validation Case Fixture

Each case under `test/fixtures/clinicalCasesES/` should follow:

```jsonc
{
  "language": "es",
  "originalSOAP": {
    "subjective": "…",
    "objective": "…",
    "assessment": "…",
    "plan": "…"
  },
  "expectedReportStructure": {
    "hasSubjective": true,
    "hasObjective": true,
    "hasAssessment": true,
    "hasPlan": true
  }
}
```

Additional longitudinal fixtures live under `test/fixtures/longitudinal/` (planned).

---

### Metrics Collected per Case (for WO-ES-MVP-04)

For each validation case, clinicians should ideally provide:

- `clarity_score` (1–5) – How clear is the generated report?  
- `clinical_accuracy` (1–5) – How well does it reflect what was documented?  
- `editing_time_minutes` – Time needed to make it “ready to send”.  
- `ready_to_send` (yes/no) – Would you send it to a physician as is?  
- `regulatory_risk_flag` (yes/no) – Any phrase that sounds like a system decision?  
- `missing_information_flag` (yes/no) – Is important clinical info missing?

These metrics are not stored in the fixtures themselves, but should be recorded in validation notes / spreadsheets and used to guide engine improvements.

---

### Example Case Types (suggested)

- **lumbar_case_01 – Lumbalgia mecánica estable**
  - Goal: stable course, clear description without implying improvement/worsening.

- **lumbar_case_02 – Lumbociatalgia en empeoramiento**
  - Goal: descriptive worsening, clear mention of irradiated pain and tests, no prescriptive language.

- **cervical_case_01 – Dolor cervical mecánico en mejoría**
  - Goal: highlight improvement descriptively (e.g. 7/10 → 3/10) without “treatment effectiveness” wording.

- **redflag_case_01 – Sospecha de compromiso neurológico grave**
  - Goal: ensure red flag wording remains “clinical concern” and not diagnostic decision.

These are examples; actual cases should be anonymised real SOAP notes from Spanish physiotherapists.

---

### How This Connects to the Clinical Simulator

- `scripts/clinical-sim-server.ts` exposes dev-only endpoints to:
  - simulate clinical fixtures via HTTP;  
  - compute metrics (sections, forbidden language, regulatoryBoundaryCheck, etc.).  
- `scripts/runClinicalFixtures.ts` runs all fixtures and prints a per-case report, plus:
  - saves outputs under `test/results/clinical-sim/*.result.json`  
  - can be wired into CI for regulatory guardrails.

Together, these fixtures and scripts form a **reproducible validation harness** for the ES-ES clinical engine.

