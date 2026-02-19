# Docs/Process Changelog — Aidux North

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
