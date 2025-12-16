## Canonical Snapshots

Canonical snapshots give us a frozen, production-reviewed copy of the onboarding, authentication, workflow, and audio-pipeline code paths. Use `npm run snapshot:canonical` whenever the CTO signs off on a release candidate so we always have a gold state to roll back to.

### How to create a snapshot

```bash
npm run snapshot:canonical
```

The script will:
- Create a timestamped directory under `canonical_snapshots/`.
- Mirror the relevant project structure (respecting subfolders).
- Write a `manifest.json` that lists every captured file and the timestamp.

### Currently tracked files

The snapshot now covers both the UI copy, the clinical audio pipeline, and the patient consent workflow (PHIPA s.18 compliance):

#### Authentication & Onboarding
- `src/pages/LoginPage.tsx`
- `src/pages/OnboardingPage.tsx`
- `src/components/wizard/PersonalDataStep.tsx`
- `src/components/wizard/ProfessionalDataStep.tsx`
- `src/components/wizard/LocationDataStep.tsx`
- `src/styles/wizard.module.css`

#### Patient Consent Workflow (PHIPA s.18) — CANONICAL
- `src/pages/PatientConsentPortalPage.tsx` (CANONICAL)
- `src/components/consent/LegalConsentDocument.tsx` (CANONICAL)
- `src/components/consent/ConsentActionButtons.tsx` (CANONICAL)
- `src/content/legalConsentContent.ts` (CANONICAL)
- `src/services/patientConsentService.ts` (CANONICAL)
- `src/services/smsService.ts` (CANONICAL)
- `src/pages/ConsentVerificationPage.tsx` (CANONICAL)
- Integration points in `src/pages/ProfessionalWorkflowPage.tsx` (CANONICAL)

#### Clinical Workflow & Audio Pipeline
- `src/pages/ProfessionalWorkflowPage.tsx`
- `src/components/ClinicalAnalysisResults.tsx`
- `src/components/AiDuxVoiceButton.tsx`
- `src/components/ClinicalInfoPanel.tsx`
- `src/hooks/useNiagaraProcessor.ts`
- `src/hooks/useAiDuxVoice.ts`
- `src/services/vertex-ai-service-firebase.ts`
- `src/services/AiDuxVoiceService.ts`
- `src/services/AiDuxVoiceTypes.ts`
- `src/core/ai/PromptFactory-Canada.ts`
- `src/utils/cleanVertexResponse.ts`
- `src/services/OpenAIWhisperService.ts`
- `src/hooks/useTranscript.ts`
- `src/services/sessionService.ts`
- `src/services/clinicalAttachmentService.ts`
- Attachment UI in `src/pages/ProfessionalWorkflowPage.tsx`

Feel free to extend `scripts/createCanonicalSnapshot.mjs` if we add new critical paths (e.g., future imaging modules) but keep the list focused so the snapshot stays meaningful.

### Patient Consent Workflow (Stage 0)

The patient consent workflow is Stage 0 of the canonical pipeline and must be completed before any AI processing. All consent-related files are marked as CANONICAL and are part of the workflow:

- **Legal Document:** Plain text format, English language, PHIPA-compliant
- **Consent Portal:** Patient-facing page with always-visible action buttons
- **Manual Authorization:** Physiotherapist can authorize consent from workflow
- **Integration:** Consent status checked before AI processing in workflow

See `docs/enterprise/CANONICAL_CONSENT_WORKFLOW.md` for complete documentation.

### Restoring a snapshot

Each snapshot mirrors the repo structure, so you can restore any file with a plain copy:

```bash
cp canonical_snapshots/<timestamp>/src/pages/ProfessionalWorkflowPage.tsx src/pages/ProfessionalWorkflowPage.tsx
```

Or restore the entire set by copying the root of the snapshot back into the workspace (then run `npm run lint` to confirm integrity).

### Best practices

- Run the snapshot command only after lint/tests pass and the CTO approves the release bundle.
- Commit the new snapshot directory in a dedicated “snapshot” commit so it’s easy to diff and prune later.
- Never edit files inside `canonical_snapshots/<timestamp>/...`; they should remain immutable references.
- Keep only a manageable number of historical snapshots in git (archive or tag older ones offline if storage becomes an issue).
- When restoring snapshots that include attachment logic, confirm Firebase Storage rules remain unchanged so uploaded PDFs/images stay PHIPA compliant.

