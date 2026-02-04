# Ongoing Form — CTO Alignment & Implementation

## CTO Data Model (what to capture)

All fields optional except `patientId`. Clinician does not invent data.

| Section | Fields | Storage / Use |
|---------|--------|---------------|
| **Demographics** | age/DOB, sexAtBirth, genderIdentity, occupation, dominantSide | Patient record + baseline narrative |
| **Lifestyle** | physicalActivityDescription, workPhysicalDemands, sportOrRecreationalActivities | Baseline narrative (subjective preamble) |
| **Clinical context** | primaryConcern (region, side), onsetDescription, mechanismOfInjury, relevantMedicalHistory, imaging, redFlags | Baseline narrative |
| **Baseline Subjective** | chiefComplaint, pain (present, NPRS, description, aggravating/easing), functionalLimitations, patientGoals | → baselineSOAP.subjective |
| **Baseline Objective** | observationNotes, ROM findings, strength findings, neurological | → baselineSOAP.objective |
| **Clinical Impression** | impressionText | → baselineSOAP.assessment |
| **Plan** | focusOfSession, adviceGiven, plannedNextFocus | → baselineSOAP.plan |

## Form UX (creative)

- **Accordion / collapsible sections** — clinician expands only what they want to fill
- **Free text preferred** — no forced categories; "how clinicians speak"
- **Progressive flow** — Who → Context → What patient says → What I observe → Impression & Plan
- **Minimum for baseline** (pilot): chief complaint + (plan OR impression) — needed to enable follow-up
- **No mandatory fields** except patientId — soft nudge if trying to create baseline without minimum

## Parser: Form → Baseline SOAP

```
ongoingFormToBaselineSOAP(form) → { subjective, objective, assessment, plan }
```

- **subjective**: Demographics/lifestyle preamble (if any) + chief complaint + pain + functional limitations + goals
- **objective**: Observation + ROM + strength + neurological (concatenated)
- **assessment**: clinicalImpression.impressionText
- **plan**: focusOfSession + adviceGiven + plannedNextFocus (or single plan field)

Richer narrative = better follow-up prompt hydration.

## Follow-up Prompt Hydration

- `buildFollowUpPromptV3` receives `baselineSOAP: { subjective, objective, assessment, plan }`
- Parser output feeds directly into `createBaselineFromMinimalSOAP` → Firestore → `getClinicalState` → prompt
- No changes needed to prompt builder — it consumes baselineSOAP as-is
- Richer baseline text = better context for AI

## Edges

1. **Empty sections** → Parser omits or uses "Not documented." equivalent in narrative
2. **No plan, has impression** → Use impression as assessment; plan = "To be established at first follow-up" or similar (pilot minimum)
3. **No impression, has plan** → assessment = "Ongoing treatment as per plan below"
4. **Neither plan nor impression** → Block baseline creation; show "Add plan or clinical impression to enable follow-up"
5. **Generic plan** (e.g. "en tratamiento") → Reject per existing validation
6. **Structured data** (ROM, strength arrays) → Parser formats as narrative: "ROM: Lumbar flexion 60°. Strength: Quad 4/5 bilaterally."
