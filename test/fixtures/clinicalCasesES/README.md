# ES Clinical Cases Fixtures

This folder will host anonymised Spanish clinical cases for:

- Testing the ES-ES referral report pipeline.
- Regression tests for narrative style and regulatory wording.

Each fixture should follow this structure:

```json
{
  "language": "es",
  "originalSOAP": {
    "subjective": "…",
    "objective": "…",
    "assessment": "…",
    "plan": "…"
  },
  "expectedReportStructure": {
    "hasDiagnosisParagraph": true,
    "hasEvolutionParagraph": true,
    "hasFindingsBlock": true,
    "hasTreatmentBlock": true,
    "hasPlanParagraph": true
  }
}
```

Do NOT include any directly identifying information. All content must be fully anonymised.

