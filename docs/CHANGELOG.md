# Docs/Process Changelog — Aidux North

## WO-003 — 2026-02-20 — Treatment Modalities Categorization
- **Correct categorization** of physical treatment modalities as in-clinic vs home-based. Physical modalities (ultrasound, TENS, laser, shockwave, EMS, Tecar) require clinic equipment and are now correctly identified as clinic-only treatments, not home exercises.
- **New utility:** `src/utils/treatmentCategories.ts` — `CLINIC_MODALITIES` and `HOME_EXERCISES` constants, `categorizeTreatmentModality()` function, `filterHomeExercises()` and `filterClinicModalities()` helpers.
- **Updated extraction:** `treatmentPlanService.extractHomeExercises()` now filters out clinic modalities; `extractModalities()` correctly identifies clinic-only equipment and also checks "Home Exercises" section for mis-categorized modalities.
- **Impact:** Treatment time calculations now correctly separate clinic time (modalities) from home exercise time. Reports and treatment plans accurately reflect what patients can do at home vs what requires clinic visits.
- Resolves feedback ID: `yYYPcCr6boMRsvx1fCuM`.

## WO-002 — 2026-02-20 — SOAP Partial Updates (No Regenerar al Justificar Red Flags)
- **Partial SOAP updates** when justifying red flags after SOAP generation. System updates only the Red Flags Clinical Reasoning section, preserving user manual edits to other sections (Subjective, Objective, Assessment, Plan).
- **New service:** `soapPartialUpdateService.ts` — parses SOAP sections, updates only red flags reasoning, reconstructs SOAP preserving all other content.
- **SOAPTab UI:** Detects red flags without justification after SOAP generation, allows adding justification via textarea, triggers partial update (not full regeneration).
- **Preservation:** User manual edits to Assessment, Plan, or any section remain intact when red flag justifications are added.
- Resolves feedback ID: `Tu2TTTMZAL68X4AtR3gv`. See `docs/workflows/SOAP_PARTIAL_UPDATES.md` for flow.

## WO-001 — 2026-02-19 — Red Flags Acknowledgement (No Repetir Justificación)
- **Red flag justification captured once** in Physical Evaluation step (step 2). User chooses "Refer to specialist" or "Treat with monitoring"; if treating with monitoring, a clinical justification is required and saved in session state.
- **SOAP Generation (step 3)** uses the saved justifications automatically; prompt includes "RED FLAG JUSTIFICATIONS (clinician documented)" so the note does not ask again. SOAP tab shows a summary: "Red flag justifications (from Physical Evaluation)" so the user sees what will be included.
- **Types:** `src/types/redflags.ts` — `RedFlagAcknowledgement` with `justification` and `justifiedAt`.
- **Session state:** `sessionData.analysis.redFlagsAcknowledgements` stores acknowledgements; optional future Firestore `sessions/{sessionId}.analysis.redFlagsAcknowledgements` remains backwards compatible.
- Resolves feedback ID: `37IDkw4PY3CiKQChRoPC`. See `docs/workflows/RED_FLAGS_WORKFLOW.md` for flow.

## 1.0.0 — 2025-09-25
- Creación de `PROJECT_HANDBOOK.md`
- Adición de procesos: `DOR_DOD_DEFINITIONS.md`, `COMPLIANCE_CHECKLIST.md`, `RELEASE_PROCESS.md`
- Establecida estructura base de documentación en `/docs/`
