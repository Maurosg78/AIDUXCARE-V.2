# Red Flags Workflow (WO-001)

## Overview

Red flags detected in the Initial Analysis are acknowledged and optionally justified in the **Physical Evaluation** step. Justifications are stored once and reused in SOAP note generation so the user is not asked again.

## Flow

1. **Initial Analysis (step 1)**  
   - System detects red flags from transcript/analysis (`red_flags`).

2. **Physical Evaluation (step 2) — Red Flags Warning**  
   - If there are red flags, a "Red flags — acknowledge and document" section is shown at the top.
   - For each red flag the user chooses:
     - **Refer to specialist**, or  
     - **Treat with monitoring** (then a required **Clinical justification** textarea is shown).
   - Justifications are saved automatically (on blur and when changing decision) into `sessionData.analysis.redFlagsAcknowledgements`.

3. **SOAP Report (step 3)**  
   - When generating the SOAP note, saved justifications are passed into the SOAP context and prompt as "RED FLAG JUSTIFICATIONS (clinician documented)".
   - The SOAP tab shows a summary: "Red flag justifications (from Physical Evaluation)" so the user sees what will be included. To change them, the user goes back to step 2.

## Data Model

- **`RedFlagAcknowledgement`** (`src/types/redflags.ts`):  
  `flagId`, `acknowledged`, `acknowledgedAt`, `decision?` (`'refer' | 'treat_with_monitoring'`), `justification?`, `justifiedAt?`.
- **Session state:** `sessionData.analysis.redFlagsAcknowledgements` (array of `RedFlagAcknowledgement`).
- **Flag IDs:** By index, e.g. `rf_0`, `rf_1`, matching `niagaraResults.red_flags` order.

## Backwards Compatibility

- New fields (`justification`, `justifiedAt`) are optional.
- Existing code that does not use them continues to work.
- Firestore schema (if used later): same optional fields; no migration required.

## References

- WO-001 spec; feedback ID: `37IDkw4PY3CiKQChRoPC`.
- Types: `src/types/redflags.ts`.
- UI: EvaluationTab (Red Flags Warning block), SOAPTab (justification summary).
- SOAP: `SOAPContextBuilder`, `SOAPPromptFactory`, `SOAPDataOrganizer`, `ProfessionalWorkflowPage` (unifiedData).
