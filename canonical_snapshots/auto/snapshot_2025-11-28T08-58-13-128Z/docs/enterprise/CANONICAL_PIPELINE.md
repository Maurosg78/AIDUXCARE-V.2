# Canonical Pipeline — Audio → SOAP (baseline 2025-09-23)

**Baseline commit:**   
**Spec HEAD:** 2b9b282  
**Scope:** Single source of truth for how raw audio becomes a signed, compliant SOAP note.

---

## Contract Overview (I/O between stages)
- **Input A (Audio):** 16kHz PCM stream or browser MediaStream → `AudioChunk[]`
- **Output Z (Final Note):** `SoapNote` + FHIR `Bundle` + Audit log entries

### Stages
0) **Patient Consent (PHIPA s.18)** → 1) **Capture** → 2) **STT** → 3) **Normalization** → 4) **Entity/Intent** → 5) **AI Draft** → 6) **SOAP Builder** → 7) **Compliance (CPO/PHIPA/PIPEDA)** → 8) **FHIR Mapping** → 9) **Persistence & Audit** → 10) **Sign & Lock** → 11) **Metrics**

---

## Stage → Module Map (authoritative)
- **Command Center Workflow (Canonical):** `src/pages/ProfessionalWorkflowPage.tsx` ⭐ **CANONICAL** - Main entry point for clinical workflow with patient card, consent buttons (Mark Authorized, Read Document, Copy Link, Resend SMS), Last Session, and Today's Plan cards
- **Command Center:** `src/features/command-center/CommandCenterPage.tsx` - Main dashboard that routes to ProfessionalWorkflowPage
- **Patient Consent (PHIPA s.18):** `src/pages/PatientConsentPortalPage.tsx`, `src/components/consent/LegalConsentDocument.tsx`, `src/components/consent/ConsentActionButtons.tsx`, `src/content/legalConsentContent.ts`, `src/services/patientConsentService.ts`, `src/services/smsService.ts`
- **Capture:** `src/components/RealTimeAudioCapture.tsx`, `src/core/audio/AudioCaptureService.ts`
- **STT:** `src/services/OpenAIWhisperService.ts`, `src/services/WebSpeechSTTService.ts`, `src/core/sttLocal/**`
- **Normalization/Cleaning:** `src/utils/cleanVertexResponse.ts`, `src/core/niagara/cleanVertexResponse.ts`, `src/core/notes/transcriptToSOAP.ts`
- **Entity/Intent Rails:** `src/core/assistant/rails.ts`, `src/core/assistant/extractEntities.ts`, `src/core/assistant/entities.ts`
- **AI Drafting:** `src/services/VertexAIService*.ts`, `src/core/ai/PromptFactory.ts`, `src/orchestration/**`
- **SOAP Builder/Renderer:** `src/core/notes/SOAPBuilder.ts`, `src/core/notes/SOAPRenderer.ts`, `src/services/SOAPGenerationService.ts`
- **Compliance:** `src/core/compliance/cpo/**`, `src/components/SaveNoteCPOGate.tsx`, `src/components/LegalChecklist.ts`
- **FHIR Mapping/Validation:** `src/core/fhir/adapters/**`, `src/core/fhir/types/**`, `src/core/fhir/validators/*`
- **Persistence:** `src/services/notePersistence.ts`, `src/repositories/notesRepo.ts`, `src/core/emr/SoapNoteService.ts`
- **Audit & Logging:** `src/core/audit/**`, `src/services/AuditLogger.ts`, `src/core/audit/FirestoreAuditLogger.ts`
- **Sign & Lock:** `src/components/notes/SignNote*`, `src/hooks/useSignNote.ts`
- **Metrics/Analytics:** `src/core/metrics/**`, `src/features/analytics/**`, `src/utils/metricsCollector.ts`

---

## Contracts (per stage)
- **Patient Consent → Workflow:** `ConsentToken` → `ConsentRecord` (ongoing | session-only | declined) → Workflow access granted/denied
- **Capture → STT:** `AudioFrame[]` → `{ transcript: string, segments?: Segment[] }`
- **STT → Normalization:** `Transcript` → `CleanTranscript` (no PHI leakage beyond session scope)
- **Normalization → Entity/Intent:** `CleanTranscript` → `ClinicalEntities` (problems/tests/findings)
- **Entity/Intent → AI Draft:** `ClinicalContext` + prompt schema → `DraftSoap` (strict schema)
- **AI Draft → SOAP Builder:** `DraftSoap` → `SoapNote` (typed)
- **SOAP → Compliance:** `SoapNote` → `SoapNote` + `ComplianceFindings[]`
- **Compliance → FHIR:** `SoapNote` → `FHIR.Bundle`
- **FHIR → Persistence:** `{ SoapNote, Bundle }` → persisted IDs + audit trail
- **Persistence → Sign:** `NoteID` → `SignedNoteID`

---

## Key Schemas & Validators
- **Schema:** `src/orchestration/schemas/clinical-note-schema.ts`
- **Validation:** `src/orchestration/validation/response-validator.ts`, `src/core/fhir/types/validation.ts`
- **Types:** `src/types/clinical.ts`, `src/types/medicalSafety.ts`, `src/types/nlp.ts`

---

## Compliance Guardrails
- **Patient Consent (PHIPA s.18):** `src/pages/PatientConsentPortalPage.tsx` (canonical), `src/services/patientConsentService.ts` (canonical), `src/components/consent/LegalConsentDocument.tsx` (canonical), `src/components/consent/ConsentActionButtons.tsx` (canonical)
- **Rules:** `src/core/compliance/cpo/CpoRules.ts` (+ `ComplianceRunner.ts`)
- **UI gates:** `SaveNoteCPOGate.tsx`, `LegalAlertsDisplay.tsx`, `LegalConsentStatus.tsx`
- **PHIPA/PIPEDA posture:** audit events on create/update/read via `AuditLogger` & `FirestoreAuditLogger`

---

## Golden Paths
- **First session with consent:** Patient Consent (SMS link) → Consent Portal → Consent Record → Capture (WebSpeech) → Normalize → Rails → AI Draft (Vertex) → SOAP → CPO Gate → FHIR → Persist → Sign → Metrics.
- **Realtime consult:** Capture (WebSpeech) → Normalize → Rails → AI Draft (Vertex) → SOAP → CPO Gate → FHIR → Persist → Sign → Metrics.
- **Upload recording:** Upload → Whisper → Normalize → Rails → AI Draft → SOAP → CPO Gate → FHIR → Persist → Sign.
- **Manual edit:** Load last `DraftSoap` → SOAP → CPO Gate → Sign (sin IA si está desactivada).

---

## Governance & SoT (v1)
- **Market/Language:** CA/en-CA por defecto; Spain pilot tras flag.
- **Package manager:** **pnpm** (mantener `pnpm-lock.yaml` como único lockfile).
- **ESLint:** **`eslint.config.js` canónico** (+ opcional `eslint.override.config.js`). Archivar duplicados con sufijos.
- **CI keep list:** `ci.yml`, `no-soap-logs.yml`, `sot-trailers.yml`, `smoke-firestore.yml`, `eval.yml`, `qa-eval-run.yml`, `release-assets-trend-*.yml`.
- **Archivar:** archivos duplicados con “ 2/3/backup”.

---

## Appendix A — Diffs to Baseline
- Ver `tmp/recovery/diff.stat.txt` y `tmp/recovery/diff.full.patch` (generados en esta rama) para diferencias desde el baseline.

