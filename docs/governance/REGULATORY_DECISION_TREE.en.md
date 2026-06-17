# AiDuxCare — Regulatory Decision Tree
**Version:** 1.0  
**Date:** 16 Jun 2026  
**Authors:** Mauricio Sobarzo (CEO/Physiotherapist) + Claude (AI CTO)  
**Next review:** Before activating any new feature or when scaling beyond 10 active users

---

## 1. Declared regulatory position

**AiDuxCare Mode 1 (current production) is an assisted clinical documentation system.**

Official intended purpose:
> "AiDuxCare converts the physiotherapist's clinical judgment, expressed during the consultation, into structured SOAP documentation. The system does not generate independent diagnoses, does not prescribe treatments, and does not replace professional clinical judgment. Every clinical decision belongs to the physiotherapist."

This statement is supported by:
- `docs/AIDUXCARE_OFFICIAL_USER_GUIDE.md:34`
- ADR-002 in `types.ts:1` ("system proposes, physio decides, decision persists with traceability")
- ES production prompt: "No diagnostiques. No prescribas." (`buildAnalysisPrompt.es.ts`)
- Normalizer `DEFAULT_RESULT`: `diagnosticos_probables: []` (`normalizeClinicalResponse.shared.ts:131`)
- SOAP finalization gate: `requiresReview` blocks without explicit physiotherapist review

---

## 2. EU AI Act tree — Is AiDuxCare Annex III?

```
Is AiDuxCare integrated into a regulated product under MDR/IVDR?
├── YES → Article 6(1)(a) route: automatically high-risk AI
│         → see Section 3 (MDR analysis)
└── NO → evaluate direct Annex III ↓

Does the system make decisions or generate autonomous clinical recommendations
that influence patient management without explicit physio approval?
├── YES → Annex III (health section): high-risk
└── NO → evaluate individual features ↓

Features in production — individual evaluation:
├── Red flags → deterministic, rules published in clinical literature
│   Classification: NOT Annex III (rule-based alert system,
│   not statistical inference. The physio decides the action.)
│
├── Medication normalization → NLP over what the patient
│   reported, not a new prescription
│   Classification: NOT Annex III (documentation assistance)
│
├── SOAP A (Assessment) → CONDITIONAL
│   Condition: only documents the presumptive diagnosis that the
│   physio declared in the initial intake or a suspected referral.
│   If there is alignment → documents the physio's reasoning.
│   If there is no alignment → silence. No assessment text is generated.
│   Classification: NOT Annex III IF the condition above is implemented.
│   REQUIRED ACTION: implement alignment logic with the initial intake.
│
├── SOAP Plan → documents treatment the physio performed in the session
│   (captured in transcript + checklists approved by the physio)
│   Classification: NOT Annex III (documentation of a decision already made)
│
├── Suggested physical evaluations → ACTIVE GREY ZONE
│   The prompt says "Recommend tests. Order them by clinical priority."
│   The safety gate disables this in production. But:
│   - The UI copy says "Pruebas físicas recomendadas" → negative evidence
│   - The field exists in the schema with evidence_level and rationale
│   Classification: GREY ZONE. Defensible ONLY if:
│     (a) safety gate remains active
│     (b) copy changes to "Pruebas físicas evaluadas"
│     (c) field is renamed to evaluaciones_fisicas_realizadas
│   REQUIRED ACTIONS: see Section 6.
│
├── Longitudinal memory → compares sessions, classifies trajectory,
│   presents patterns. Does not recommend treatment.
│   Classification: NOT Annex III (observation + documentation of evolution)
│
└── Sócrates (DISABLED in production) → proactive Mode 1,
    interactive Mode 2. If activated with proactive suggestions:
    Classification: POTENTIALLY Annex III → requires DPIA + full
    MDR analysis before activation.

CURRENT MODE 1 EU AI ACT CONCLUSION:
AiDuxCare in production is DEFENSIBLE as NOT Annex III under the
conditions in Section 6. The position holds while the physio approval
gate is architectural (not optional) and the intended purpose declares
documentation, not diagnosis.
```

---

## 3. EU MDR 2017/745 tree — Is AiDuxCare MDSW?

```
MDCG 2019-11 test: Is the software "intended" to be used
for diagnosis, monitoring, prediction, prognosis, treatment
or alleviation of disease or injury?

Declared intended purpose: assisted clinical documentation.
The system does NOT diagnose, does NOT prescribe, does NOT predict
clinical evolution, and does NOT monitor disease parameters.

Does the software "drive or influence clinical management"?
├── YES argument: suggested physical evaluations (when active)
│   influence which tests the physio performs.
│   Red flags may influence referral.
└── NO argument: all influence is mediated by explicit
    physio approval. The system presents, the physio decides and documents.
    The architecture (ADR-002, ClinicalDecision with decidedBy) makes
    the decision belong to the physio, not the system.

CURRENT MDR POSITION:
AiDuxCare Mode 1 is defensible as general-purpose software
in a medical context (NOT MDSW) under the conditions in Section 6.
The defense weakens if evaluaciones_fisicas_sugeridas is activated
without the safety gate or if the intended purpose expands to prognosis/
treatment recommendation.

NOTE: If an MDR auditor classifies AiDuxCare as Class I MDSW
under MDR → automatically high-risk AI under EU AI Act Art. 6(1)(a).
That risk exists and must be monitored as the system scales.
```

---

## 4. Classification table by feature

| Feature | Production | Classification | Condition |
|---------|-----------|---------------|-----------|
| Transcription (Whisper) | ✅ Active | Not regulated | — |
| Transcript analysis (Gemini) | ✅ Active | Not Annex III | Intended use = documentation |
| Red flags | ✅ Active | Not Annex III | Deterministic, physio decision |
| Medication normalization | ✅ Active | Not Annex III | Transcription, not prescription |
| SOAP S | ✅ Active | Not Annex III | Documents patient report |
| SOAP O | ✅ Active | Not Annex III | Documents physio findings |
| SOAP A | ✅ Active | GREY ZONE | Only if aligned with the physio's initial intake |
| SOAP P | ✅ Active | Not Annex III | Documents treatment performed |
| Longitudinal memory | ✅ Active | Not Annex III | Observes, does not recommend |
| Suggested physical evaluations | ⚠️ Safety gate active | GREY ZONE | Mandatory safety gate + copy fix |
| Sócrates Mode 0 (warnings) | 🔒 Not activated | Not Annex III | Observation only, not directive |
| Sócrates Mode 1 (proactive) | 🔒 Not activated | REQUIRES ANALYSIS | Do not activate without DPIA + MDR analysis |
| Sócrates Mode 2 (interactive) | 🔒 Not activated | REQUIRES ANALYSIS | Do not activate without DPIA + MDR analysis |
| CA treatment_suggestions (stub) | 🔒 Inactive stub | Annex III if active | NEVER activate without compliance |

---

## 5. The line we do not cross

Any of the following triggers mandatory regulatory analysis
before deployment:

1. The system generates assessment text (SOAP A) without anchoring in
   the diagnosis declared by the physio in the initial intake.
2. Suggested physical evaluations are reactivated without the safety gate.
3. Sócrates Mode 1 generates proactive treatment suggestions.
4. The `treatment_suggestions` field in the CA stub is implemented.
5. The system generates clinical evolution predictions about the patient.
6. The number of users exceeds 50 (scale that may trigger registration
   obligations in the EU AI Act database).

---

## 6. Required actions to maintain the position

### Immediate (before scaling to 10+ users)

| # | Action | File | Regulatory impact |
|---|--------|------|-------------------|
| 1 | Change copy "Pruebas físicas recomendadas" → "Pruebas físicas evaluadas" | `ClinicalAnalysisResults.tsx` | Removes negative evidence in UI |
| 2 | Implement SOAP A alignment logic with initial intake | `buildAnalysisPrompt.es.ts` | Converts A from grey zone to defensible |
| 3 | `regulatoryLanguageGuard` must block, not only warn | `regulatoryLanguageGuard.ts` | Strengthens the audit position |
| 4 | Rename `evaluaciones_fisicas_sugeridas` → `evaluaciones_fisicas_realizadas` in inactive schema | `normalizeClinicalResponse.shared.ts` | Removes implicit claim in field name |
| 5 | Document explicit decision on CA stub `treatment_suggestions` | `PromptBrainCA.ts` | Closes intended-purpose ambiguity |

### Before activating Sócrates (any mode)

- [ ] Complete DPIA under GDPR Art. 35
- [ ] Updated MDR analysis with Sócrates features
- [ ] Re-evaluate this decision tree
- [ ] External regulatory validation consultation (specialized lawyer or notified body)

---

## 7. EU AI Act context — Digital Omnibus reform (Jun 2026)

The European Parliament approved reform via Digital Omnibus (423-57):
- Annex III obligations: postponed from 2 Aug 2026 → 2 Dec 2027
- Annex I obligations: until 2 Aug 2028
- General obligations: apply from 2 Aug 2026

**Impact for AiDuxCare:** if an auditor classified Mode 1 as
Annex III (pessimistic scenario), the compliance deadline is Dec 2027.
The correct position is to use that timeline to build compliance, not
to postpone it.

**Strategic recommendation:** AiDuxCare competes by building
governance now. Competitors who use the delay against themselves
will be at a disadvantage in 18 months.

---

## 8. Revision history

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 16 Jun 2026 | 1.0 | Initial creation | Mauricio Sobarzo + Claude |

---

*This document is evidence of internal regulatory due diligence.
It does not constitute legal advice. Review with a specialized lawyer
before scaling to commercial use or activating features from Section 5.*
