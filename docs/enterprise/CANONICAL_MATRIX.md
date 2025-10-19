# Canonical Matrix — Components & Tabs (SoT)

**Spec HEAD:** 2b9b282  
**Baseline:** recorded in CANONICAL_PIPELINE.md

---

## A) UI Component Registry

### AddCustomItemButton (Canonical)
- **Path:** src/components/AddCustomItemButton.tsx
- **Layer:** UI / User Interaction (no pipeline impact)
- **Contract (approved):**
  - Props: onAdd(text), placeholder?, labelAddButton?, labelOpenComposer?, maxLength? (256), analyticsCategory? ("CustomItem")
  - Behavior: Enter=add, Escape=cancel, trim + strip HTML + limit length
  - A11y: aria-labels + focus ring
  - i18n: en-CA default (ui.customItem.*)
  - Analytics: CustomItem:open/add/cancel
  - Security: strip HTML, trim, limit, normalize spaces
  - DoD: tests (behavior + security + i18n), (optional) Storybook
- **Keep:** canonical file arriba
- **Archive:** variantes con sufijos " 2/3/4" en docs/_archive/ui/ (con README de deprecación)

---

## B) Workflow Tabs — Single Source of Truth

> Las pestañas son **capas de orquestación de UI** que se apoyan en el pipeline canónico Audio→SOAP. No cambian el pipeline; lo **exponen** y **permiten edición/validación**.

### 1) Análisis Inicial (Initial Analysis)
- **Objetivo:** presentar transcripción, limpieza, entidades/alertas y borrador IA preliminar.
- **Cobertura de etapas:** STT → Normalization → Entity/Intent → (preview) AI Draft
- **Componentes canónicos:**
  - Transcripción: `src/components/MultimodalTranscriptArea.tsx`
  - Resultado clínico: `src/components/ClinicalAnalysisResults.tsx`
  - Alertas: `src/components/RedFlagsAlert.tsx`, `src/components/ClinicalAlerts.tsx`
  - Utilidades: `src/components/testing/PromptTestingWidget.tsx` (opcional)
- **I/O contrato:**
  - Input: Transcript/CleanTranscript/ClinicalEntities
  - Output: `DraftSoap` (no final), snapshots auditables
- **Eventos clave:** `analysis.loaded`, `analysis.redflags`, `analysis.previewDraft`
- **Persistencia:** draft en memoria + opcional snapshot (no firma)
- **Keep/Archive:** mantener archivos sin sufijos; mover duplicados “ 2/3/backup” a `docs/_archive/analysis/`

### 2) Evaluación Física (Physical Evaluation)
- **Objetivo:** enriquecer Objetivo (O) con hallazgos/tests; permite items personalizados.
- **Cobertura de etapas:** Entity/Intent (enriquecida por usuario) → prepara `SoapNote.O`
- **Componentes canónicos:**
  - `src/components/PhysicalEvaluationTab.tsx`
  - `src/components/SelectableFindings.tsx`
  - `src/components/CustomTestInput.tsx`
  - `src/components/DynamicTestTransfer.tsx`
  - `src/components/GenericClinicalDisplay.tsx`
  - **AddCustomItemButton** (aprobado) para ítems custom en O
- **I/O contrato:**
  - Input: `ClinicalEntities`, estado local de hallazgos
  - Output: actualizaciones en `DraftSoap.Objective`
- **Eventos clave:** `objective.addFinding`, `objective.addCustom`, `objective.remove`
- **Persistencia:** actualiza `DraftSoap` (no persiste final)
- **Keep/Archive:** idéntico criterio; variantes a `docs/_archive/physical/`

### 3) Informe SOAP (SOAP Report)
- **Objetivo:** consolidar S/O/A/P, pasar por Compliance, mapear FHIR, **guardar** y **firmar**.
- **Cobertura de etapas:** SOAP Builder → Compliance (CPO/PHIPA/PIPEDA) → FHIR → Persistencia → Firma
- **Componentes canónicos:**
  - `src/components/SOAPReportTab.tsx`, `src/components/SOAPDisplay.tsx`
  - Acciones: `src/components/notes/SaveNoteButton.tsx`, `src/components/notes/SignNoteButton.tsx`
  - Gates legales: `src/components/SaveNoteCPOGate.tsx`, `src/components/LegalChecklist.tsx`, `src/components/LegalAlertsDisplay.tsx`
  - Métricas: `src/components/ValidationMetrics.tsx`
- **I/O contrato:**
  - Input: `DraftSoap`
  - Output: `SoapNote` final + `FHIR.Bundle` + Audit trail + `SignedNoteID`
- **Eventos clave:** `soap.save`, `soap.compliance.block`, `soap.sign`, `fhir.validated`, `audit.logged`
- **Persistencia:** **sí** (repositorios + audit log). Firma bloquea edición.
- **Keep/Archive:** mantener canónicos; duplicados a `docs/_archive/soap/`

---

## C) CI & Governance (aplicado a Tabs/Componentes)
- **Market/Language:** CA/en-CA por defecto; es-ES tras feature flag.
- **Package manager:** pnpm (mantener `pnpm-lock.yaml` como único lockfile)
- **ESLint SoT:** `eslint.config.js` (+ `eslint.override.config.js` si aplica)
- **Workflows a mantener:** `ci.yml`, `no-soap-logs.yml`, `sot-trailers.yml`, `smoke-firestore.yml`, `eval.yml`, `qa-eval-run.yml`, `release-assets-trend-*`
- **Archivar:** variantes con sufijos “ 2/3/backup” documentadas

---

## D) Definition of Done (repo-wide)
- Matriz actualizada aquí + vínculos desde `docs/enterprise/ARCHITECTURE.md`
- Archivos duplicados movidos a `docs/_archive/**` con README de deprecación
- E2E “Golden path” verde (tools/eval/scenarios/01-save-note-valid.json)
- Validadores FHIR corriendo en CI
