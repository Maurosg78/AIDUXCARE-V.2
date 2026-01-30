# Clinical Continuity — Canonical Contract

**WO-CLINICAL-CONTINUITY-CONTRACT-001**  
**Version:** 1.0  
**Status:** Canonical (Source of Truth)  
**Scope:** AiDuxCare — baseline, follow-up, consent, continuity of care.

---

## 1. Purpose

This document defines, without ambiguity, what **clinical continuity** means in AiDuxCare. It is the single source of truth for:

- When a patient has a valid **clinical baseline**
- When a **follow-up session** is allowed
- What becomes the **baseline for the next session**
- How **consent** interacts with baseline and follow-up

No UI, AI, or QA behaviour may contradict this contract. New developers and QA validate flows against this document.

---

## 2. Definitions

### 2.1 Initial Assessment (IA)

The **first documented clinical encounter** for a patient in the system. It must produce a **complete SOAP note** (Subjective, Objective, Assessment, Plan) that is saved and accepted (signed/completed). The **Plan** of that SOAP is the starting point for future treatment and for the next session’s baseline.

### 2.2 Follow-up Session

A clinical encounter that **depends on a prior documented session**. The system provides a **clinical baseline** (the last complete SOAP) and the clinician documents the current visit (today’s clinical update). A follow-up SOAP is generated from baseline + today’s update. **Follow-up is not allowed** if there is no valid baseline.

### 2.3 Clinical Baseline

The **last completed/signed encounter** for the patient that has a **complete, non-placeholder SOAP** (all four sections: Subjective, Objective, Assessment, Plan) with real content. Placeholders (e.g. “Not documented.”, “N/A”) do **not** count. The baseline is used to:

- Decide if follow-up is allowed
- Populate “previous SOAP” and “today’s treatment” (from the **Plan** of that SOAP)
- Build the prompt for follow-up SOAP generation (baseline + today’s clinical update)

**Baseline always refers to the last documented session** that meets the above criteria. There is no “light” or partial baseline.

---

## 3. Baseline Rules

### 3.1 What counts as a valid baseline

- One and only one source: the **last encounter** (by date/order) for the patient that:
  - Is in a completed/signed state (accepted as final documentation), and
  - Has a SOAP note where **all four** sections (S, O, A, P) are present, non-empty, and **not** placeholder text (e.g. not “Not documented.”, “N/A”, “—”, “-”).
- The **Plan** of that SOAP is the canonical source for “previous plan” and for deriving today’s treatment focus (e.g. checklist items).

### 3.2 What does NOT count

- No prior encounters → no baseline.
- Last encounter has no SOAP or incomplete SOAP (missing section or placeholder-only) → no baseline.
- Draft or unsigned encounter only → does not establish baseline until completed/signed.
- Any “synthetic” or “default” baseline invented by the system → **forbidden**. Baseline is always the last **real** documented session.

---

## 4. Follow-up Eligibility Rules

1. **Follow-up is allowed** if and only if there exists a **valid clinical baseline** (as defined in §3).
2. If there is no valid baseline, the system **must not**:
   - Build a follow-up prompt
   - Call the AI (Vertex) for follow-up SOAP
   - Show recording, transcript, or “Generate Follow-up SOAP” to the user.
3. The UI **must** show an explicit, clinical message (e.g. “Follow-up no disponible”; complete an Initial Assessment or finalise prior documentation).
4. In addition, **consent** must be valid for the session. If baseline exists but consent is missing or declined, the system must not allow recording or SOAP generation until consent is resolved (see §6).

**No exceptions.** No “follow-up light” or “continue with empty baseline.”

---

## 5. Baseline Evolution Rule

> **The plan of the SOAP generated today becomes the baseline for the next session.**

- When a follow-up SOAP is generated and saved (signed/completed), that encounter becomes the **new last documented session**.
- The **Plan** section of that SOAP is what will be used as “previous plan” and for deriving today’s treatment focus in the **next** follow-up.
- Thus: **IA SOAP plan → baseline for first follow-up; first follow-up SOAP plan → baseline for second follow-up;** and so on.

This rule is **non-negotiable**. The system does not “remember” ad hoc; it **rehydrates** from the last documented encounter.

---

## 6. Consent Interaction

- **Consent** is resolved independently of baseline (e.g. via server-side check / consent service).
- For a follow-up **session** to be fully usable (recording, SOAP generation):
  - There must be a **valid baseline** (§3, §4), and
  - There must be **valid consent** for the session (as defined by the consent domain).
- If baseline exists but consent is missing or declined:
  - The system must show the consent gate (e.g. ConsentGateScreen) and **not** allow recording or SOAP until consent is valid or explicitly declined (per consent policy).
- Consent does **not** define baseline; baseline does **not** replace consent. Both are required for full follow-up flow.

---

## 7. System Guarantees

1. **Single source of truth for rehydration:** Clinical state (baseline, consent, first session) is rehydrated via one canonical service (e.g. `ClinicalStateService` / `getClinicalState`). The UI does not compute baseline or eligibility; it only renders the result of that service.
2. **hasBaseline === true** only when the last documented encounter has **complete, non-placeholder SOAP** (as in §3). No other path sets “has baseline.”
3. **Baseline always refers to the last documented session** that satisfies the completeness rule. No “default” or “empty” baseline for follow-up.
4. **Follow-up is blocked** whenever there is no valid baseline or when consent is not valid, with explicit UX (message or consent gate).

---

## 8. Explicitly Forbidden Behaviors

- **Allowing follow-up without a valid baseline** (e.g. “continue with empty baseline,” “follow-up light”).
- **Inventing or defaulting baseline** (synthetic SOAP, placeholders, or empty sections treated as valid).
- **Using any encounter other than the last completed/signed with complete SOAP** as the baseline for follow-up.
- **Letting the UI “infer” or “guess”** baseline or eligibility instead of consuming a single rehydrated state (e.g. ClinicalState).
- **Calling the AI for follow-up SOAP** when there is no valid baseline.
- **Storing baseline or eligibility in sessionStorage/localStorage** as the source of truth; rehydration must come from the canonical service and persistence (e.g. encounters).

---

## 9. Implications for UI, AI, and QA

- **UI:** Renders only what the canonical clinical state allows. No local calculation of “do we have baseline?” or “can we do follow-up?” — it obeys `ClinicalState` (or equivalent).
- **AI:** Follow-up prompt and SOAP generation receive **only** a valid baseline (last complete SOAP + today’s update). No prompt is built without baseline.
- **QA:** All flows (IA → follow-up → next follow-up; no baseline → blocked; consent missing → gate) can be validated by checking behaviour against this document. Any deviation is a bug.

---

## 10. Versioning & Forward Compatibility

- This contract is **versioned** (e.g. 1.0). Changes that alter semantics (e.g. new baseline rule, new eligibility rule) must bump the version and be documented.
- New features (e.g. new session types, new markets) must either comply with this contract or extend it in a documented, versioned way. Backward compatibility: existing behaviour that complies with this contract remains valid until the contract is explicitly changed.

---

## 11. End of Canonical Contract

This document is the **Source of Truth** for clinical continuity (baseline, follow-up, consent) in AiDuxCare. Implementation and QA must align with it. No semantic ambiguity is left to interpretation.

**References (implementation):**

- `ClinicalStateService` / `getClinicalState` — rehydration of clinical state.
- `FollowUpClinicalBaselineBuilder` — definition of valid baseline (last encounter, complete SOAP).
- Follow-up UI gate (e.g. WO-FOLLOWUP-UI-GATE-002) — consumption of ClinicalState; no follow-up without baseline and consent.
