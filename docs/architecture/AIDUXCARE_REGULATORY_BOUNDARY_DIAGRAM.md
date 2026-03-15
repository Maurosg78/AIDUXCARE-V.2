## AiDuxCare – Regulatory Boundary Diagram

**Version:** 1.0  
**Purpose:** Visual explanation of why AiDuxCare is a **clinical documentation system**, not a medical device / SaMD, under the current architecture and SoT.

---

### Regulatory Canonical Reference

This diagram defines the **regulatory boundary** of AiDuxCare.

All new features must respect this boundary.
If a feature requires crossing this boundary,
it must trigger a **regulatory review** before implementation.

---

```text
            Capture Layer
         (audio / transcript)

                    ↓

        Documentation Engine
         (SOAP, ES-ES reports)

                    ↓

        Human Approval Boundary
        ───────────────────────
        (Clinician review & edit)

                    ↓

            Clinical Record
      (only after human confirmation)


        ───────────────────────
          Reasoning Workspace
    (patterns, analysis, flags, insights)
        ───────────────────────
```

---

### Code Mapping (Where this appears in the repo)

- **Capture Layer**
  - `src/services/vertex-ai-service-firebase.ts` (analysis input)
  - `src/hooks/useTranscript.ts`
  - `src/types/sessionState.ts`

- **Documentation Engine**
  - `src/core/soap/` (SOAPPromptFactory, SOAPContextBuilder, SOAPDataOrganizer)
  - `src/services/vertex-ai-soap-service.ts`
  - `src/core/clinical/clinicalReportService.ts`
  - `src/core/reports/referralReportEs/*`

- **Human Approval Boundary**
  - `src/components/SOAPEditor.tsx`
  - `src/components/SOAPReportTab.tsx`
  - `src/components/ReferralReportModal.tsx` (si aplica)

- **Clinical Record (storage)**
  - `src/services/PersistenceService.ts`
  - `src/repositories/encountersRepo.ts`

- **Reasoning Workspace**
  - `src/core/ai/PromptFactory-Canada.ts`
  - `src/core/synthesis/*` (NarrativeSummary, LongitudinalEvolution, synthesizeClinicalNarrative)
  - `src/services/clinicalStateService.ts`

---

### Key Regulatory Points

- **Capture Layer**  
  - Raw inputs: audio, transcripts, manual entries.
  - No decisions, only data collection.

- **Documentation Engine**  
  - Generates **draft** SOAP notes and referral reports.  
  - All content is:
    - derived from captured data, and  
    - presented as **editable drafts**.

- **Human Approval Boundary**  
  - Mandatory step: physiotherapist reviews and edits.  
  - No AI output enters the **Clinical Record** without explicit human confirmation.

- **Clinical Record**  
  - Contains only documentation that:
    - has been reviewed by the clinician, and  
    - is stored as part of the EMR / history.

> AiDux generates **draft clinical documentation**.  
> The licensed clinician remains the **author of the medical record**.

- **Reasoning Workspace**  
  - Holds:
    - pattern detection (e.g. evolution of pain),  
    - red flag analysis,  
    - longitudinal evolution,  
    - Prompt Brain outputs.  
  - These insights **do not write directly** into the Clinical Record.  
  - They support clinician reasoning but do not act as autonomous medical decisions.

---

### Feature Regulatory Impact Check

Before implementing a new feature, answer:

1. **Does this feature introduce new AI analysis (patterns, flags, recommendations)?**  
2. **Does this feature write directly into the clinical record (without going through SOAP/Editor)?**  
3. **Does this feature suggest diagnosis or treatment (beyond what the clinician explicitly wrote)?**  
4. **Does this feature bypass or weaken the human approval boundary (auto-finalize, auto-save)?**

If **any** answer is **YES** → a **regulatory review is required** before implementation, and the change must be reflected in:

- `AIDUXCARE_REGULATORY_DESIGN_SOT.md`  
- `AIDUXCARE_REGULATORY_ARCHITECTURE.md`  
- `TECH_DEBT_REGULATORY_SOT_GAPS.md` (si introduce nueva superficie de riesgo).

---

This diagram should be used together with:

- `docs/architecture/AIDUXCARE_REGULATORY_DESIGN_SOT.md`  
- `docs/architecture/AIDUXCARE_REGULATORY_ARCHITECTURE.md`  
- `docs/strategy/TECH_DEBT_REGULATORY_SOT_GAPS.md`

to explain to stakeholders (investors, legal, regulators, clinical partners) how AiDuxCare is architected to remain a **regulatory-safe documentation copilot** and not a medical device.


