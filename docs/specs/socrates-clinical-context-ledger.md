# Socrates Clinical Context Ledger

**Status:** Draft MVP
**Date:** 2026-05-13
**Source of Truth:** `ENGINEERING.md` v1.4

## Principle

Socrates is the clinical deliberation layer of AiduxCare. It does not decide, diagnose, prescribe, or override the physiotherapist. It detects traceable signals, formulates prudent questions, and lets the professional decide what to do with them.

## Core Constraint

```text
documented fact != AI observation != physiotherapist decision
```

Any Socratic output must preserve this distinction. A question cannot be shown if Aidux cannot explain why it is asking it from traceable source material.

## Current Data Sources

| Source | Current use | Socrates role |
|---|---|---|
| Transcript/audio | SOAP generation and clinical extraction | Candidate source for documented facts when traceable |
| SOAP | Legal clinical note | Source of documented facts after clinician review |
| `sessions.treatmentDecision` | Canonical accepted treatment continuity | Physiotherapist decision source |
| `patients/{patientId}/clinicalDecisions` | Red flag and medication decisions | Longitudinal decision source |
| Follow-up context services | Hydrate prior session context | Longitudinal pattern input |
| Clinical evidence registry | Approved evidence by diagnosis | Evidence contrast only when approved |
| Vertex analysis output | AI-generated observations | Hypothesis source only; never canonical decision |

## MVP Architecture

```text
ClinicalContextLedger
  -> SocraticThresholdEvaluator
  -> SocraticCandidateGenerator
  -> SocraticInteractionLog
  -> ClinicalMemoryUpdater
```

### Temporal Validity of DocumentedFacts

A `DocumentedFact` is not permanently active. Facts must carry:

- `confidence`: `clinician_confirmed | patient_reported | document_extracted` — distinguishes epistemic origin (human vs. source document). `inferred` is not a valid value; AI inferences are `AiObservation`, never `DocumentedFact`.
- `status`: `active | superseded | expired`
- `validUntil?`: ISO date after which the fact is no longer active regardless of status
- `supersededBy?`: ID of the fact that replaces this one

Only `getActiveFacts()` output may feed `SocraticThresholdEvaluator`. Sócrates must not reason over a fact unless its temporal validity is confirmed current.

**Canonical rule:** No active Socratic reasoning without temporal validity. A fact whose `validUntil` has passed or whose `supersededBy` is set must not be surfaced as a basis for a Socratic question.

### ClinicalContextLedger

Aggregates structured clinical context for one patient/session:

- documented facts
- AI observations
- physiotherapist decisions
- longitudinal patterns
- unresolved Socratic question candidates
- approved evidence references

### SocraticThresholdEvaluator

Applies explicit rules before any LLM wording:

- concern appears in 3 or more sessions without a documented decision
- subjective progress exists but no functional measure was updated in 3 or more sessions
- AI safety signal was not accepted, dismissed, or monitored by the physiotherapist
- patient goal conflicts with plan progression or documented tolerance
- HEP was changed after prior low adherence

### SocraticCandidateGenerator

Formats a question from structured context. It must not:

- diagnose
- use imperative clinical language
- create new clinical facts
- use unapproved evidence as strong basis
- repeat a question dismissed in the same session

### SocraticInteractionLog

Persists the physiotherapist response:

```text
accepted | dismissed | postponed | edited
```

This is the feedback loop that tells Aidux whether a question was useful or noise.

## First MVP Behavior

Socrates should initially show at most one signal:

```text
Aidux noticed a continuity signal:

The patient has mentioned concern about returning too quickly in 3 sessions,
and there is no documented decision about how to address it.

Do you want to save this as a point to explore next session?
```

Actions:

```text
Explore now | Save for next session | Not relevant
```

## Implementation Order

1. Types only: `src/core/socratic/types.ts`
2. Ledger builder from already persisted session data
3. Threshold rules without LLM
4. Candidate generation from structured context
5. Minimal UI at session close or Command Center
6. Interaction log persistence
7. Evidence contrast only for `status: approved`

## Non-Goals

- No autonomous clinical recommendations
- No replacement of SOAP review
- No automatic treatment changes
- No hidden prompt-only reasoning
- No evidence browsing at runtime
