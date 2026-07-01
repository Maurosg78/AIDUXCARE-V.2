# Workflow Refactor Baseline
## Baseline de Refactorizacion del Workflow
[DRAFT v0.2 - PENDING CTO APPROVAL / PENDIENTE APROBACION CTO]

**Date / Fecha:** 01 Jul 2026  
**Status / Estado:** Draft only / Solo borrador  
**Source of Truth checked / SoT revisados:** `ENGINEERING.md`, `docs/governance/GOVERNANCE.md`, `docs/governance/REGULATORY_DECISION_TREE.md`, `docs/north/READING_GUIDE.md`

## Document Scope / Scope de este documento

Este documento NO autoriza ningun refactor. Es baseline de lectura.
No se convierte en canonico hasta aprobacion explicita del CEO/CTO.
No debe modificarse junto con cambios de codigo clinico.

This document does NOT authorize any refactor. It is a read-only baseline.
It does not become canonical until explicit CEO/CTO approval.
It must not be modified alongside clinical code changes.

## Update Rules / Reglas de actualizacion

Para actualizar este documento: abrir PR separado, sin codigo de aplicacion.
Cada actualizacion debe indicar version (`v0.2`, `v0.3`, etc.) y fecha.
La version canonica solo existe despues de aprobacion CTO documentada.

To update this document: open a separate PR with no application code.
Each update must declare version (`v0.2`, `v0.3`, etc.) and date.
The canonical version exists only after documented CTO approval.

## Clinical Data Provenance Architecture (v0.2 - 01 Jul 2026)
## Arquitectura de Provenance de Datos Clinicos

### Origen de esta decision

Auditoria PASO 0 (01 Jul 2026) sobre `buildFollowUpPromptV3.ts`
confirmo que el patron de riesgo identificado en HEP provenance
(Fases 1 y 2) es sistemico, no aislado. Feedback `koXGYHhijUnb8cTxph1U`
(P0) confirmo que EVA/dolor puede documentarse en el SOAP sin haber
sido conversado en la sesion actual.

### Principio de arquitectura (no negociable)

Ningun dato clinico entra al prompt de Gemini sin que su provenance
este resuelto por codigo antes de construir el texto. El modelo
de lenguaje NUNCA decide provenance - solo ejecuta instrucciones
sobre datos ya clasificados.

### Contrato de datos - ClinicalDataPoint<T>

```typescript
type ProvenanceSource = 'today' | 'historical' | 'unconfirmed';

type ProvenanceSourceDetail =
  | 'transcript_current_session'
  | 'physio_structured_input'
  | 'clinician_checklist'
  | 'previous_session'
  | 'baseline_soap'
  | 'longitudinal_summary'
  | 'treatment_decision'
  | 'attachment_reviewed_today';

interface ClinicalDataPoint<T> {
  value: T;
  source: ProvenanceSource;
  sourceDetail: ProvenanceSourceDetail;
  sessionId?: string;
  capturedAt?: string;
  confirmedByClinician?: boolean;
}
```

### Regla de oro

Datos con `source: 'historical'` o `source: 'unconfirmed'` NUNCA pueden
presentarse en el SOAP como hallazgo de la sesion actual.
Pueden aparecer como contexto longitudinal, etiquetados
explicitamente como tales.

### Mecanismo de resolucion por tipo de campo

| Campo | Mecanismo | Estado |
|---|---|---|
| HEP / home program | Checklist confirmado (`treatmentDecisionConfirmationRef`) | Resuelto - Fases 1 y 2 |
| Red flags | Gate textual "explicitly mentioned in TODAY'S CLINICAL UPDATE" | Resuelto |
| Adjuntos revisados | Gate textual "reviewed today" | Resuelto |
| EVA / dolor | Captura estructurada UI obligatoria - NUNCA regex como fuente canonica | Diseno aprobado, pendiente implementacion |
| Sintomas / ROM / hallazgos / funcion-tolerancia | `ClinicalDataPoint` con fallback conservador; regex solo como sugerencia UI a confirmar por el fisio | Pendiente diseno detallado |

### Principio anti-patron (registrar explicitamente)

Deteccion automatica por texto (regex/keywords) NUNCA es fuente
canonica de provenance para datos clinicos que entran al SOAP.
Puede usarse unicamente como sugerencia a la UI que el
fisioterapeuta debe confirmar explicitamente antes de que el
dato se marque como `source: 'today'`.

### Wireframe textual - Captura EVA/dolor (follow-up)

Ubicacion: workflow follow-up (`AnalysisTab` o equivalente), seccion
"contexto clinico adicional" - fuera del editor de SOAP.

Cuando aparece: solo en sesiones follow-up, antes de generar SOAP.

Obligatoriedad: no bloquea generacion de SOAP. Pero si no
se completa, el SOAP no puede mencionar EVA/dolor como
hallazgo de hoy.

Estados:
- Vacio: "No se documento EVA hoy"
- Confirmado: "Dolor/EVA confirmado hoy: X/10"
- Con contexto historico disponible pero sin confirmacion hoy:
  mostrar EVA previo como referencia, etiquetado
  "Ultimo EVA registrado: X/10 (sesion anterior) -
  no confirmado hoy"

### Proxima fase de implementacion (NO EJECUTAR AUN)

1. Campo UI de captura EVA/dolor
2. Estado tipado `ClinicalDataPoint<number>`
3. Payload hacia `buildFollowUpPromptV3`
4. Nueva seccion de prompt: "CURRENT PAIN/EVA - CONFIRMED TODAY"
5. Tests unitarios + QA manual
6. Extension posterior a sintomas/ROM/hallazgos/funcion

## Section A - Responsibility Map
## Seccion A - Mapa de responsabilidades

### Header Metrics / Metricas de cabecera

These metrics are baseline facts, not analysis.

| Metric / Metrica | Value / Valor | Source / Fuente |
|---|---:|---|
| Total lines in `ProfessionalWorkflowPage.tsx` | 8,441 | `wc -l src/pages/ProfessionalWorkflowPage.tsx` |
| `useState` declarations found | 90 | `rg -c "useState<|useState\\(" src/pages/ProfessionalWorkflowPage.tsx` |
| `useRef` declarations found | 33 | `rg -c "useRef<|useRef\\(" src/pages/ProfessionalWorkflowPage.tsx` |
| React state/ref declarations total | 123 | `useState + useRef` |
| Lazy-loaded tabs | Yes / Si | `AnalysisTab`, `EvaluationTab`, `SOAPTab` at lines 158-160 |
| Internal tab state included in this inventory | Deferred / Diferido | This draft inventories parent-owned workflow state only |

Note / Nota: A prior planning note mentioned 124 states. This local baseline reproduces 8,441 lines and finds 90 `useState` plus 33 `useRef` declarations, for 123 state/ref declarations total. This discrepancy remains for CTO validation.

### A1. Clinical Gate and Consent / Gate clinico y consentimiento

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 635-648, 970-978, 1857-1962, 2915-3325, 6976-7173, 8319-8358 |
| What it does / Que hace | Owns consent status, verbal consent modal state, declined-consent reversal, polling, backend consent checks, and render blocking before clinical workflow. |
| Why risky in page / Riesgo de mantenerlo aqui | Consent is a hard clinical/legal gate. Coupling it to rendering, polling, navigation, SOAP generation, and local workflow state increases the chance of bypass by race, refresh, or route-specific behavior. |
| Future extraction risk / Riesgo de extraccion | HIGH - do not extract without dedicated consent replay/smoke coverage. |

Clinical/regulatory note / Nota clinica-regulatoria: Consent controls whether the clinical workflow can render and whether SOAP generation proceeds. Any refactor must preserve the backend consent source of truth and hard-block behavior.

### A2. Transcript Capture, Restore, and Autosave / Captura, recuperacion y autosave de transcript

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 599, 1033-1092, 2198-2458, 2492-2521, 2659-2740, 7639-7640, 7809-7810, 8141-8142 |
| What it does / Que hace | Receives transcript state from transcription hooks, restores transcript from local/session storage and Firestore, persists transcript while recording, and passes transcript into workflow tabs and SOAP generation. |
| Why risky in page / Riesgo de mantenerlo aqui | Transcript loss is clinical data loss. The current ownership crosses refs, local storage, Firestore, route resume, recording state, and SOAP payloads. |
| Future extraction risk / Riesgo de extraccion | HIGH - requires replay for recovery, discard, browser refresh, and cross-device scenarios. |

### A3. Session Identity and Recovery / Identidad de sesion y recuperacion

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 587, 932, 1026-1056, 1205-1274, 2463-2567, 2742-2788, 5615-5669, 6147-6216 |
| What it does / Que hace | Resolves URL session id, active session id, reserved workflow id, Firestore session creation, resume hydration, transcript session refs, and post-SOAP persisted ids. |
| Why risky in page / Riesgo de mantenerlo aqui | Session id controls clinical recovery, Firestore writes, audit/tracking, interrupted sessions, and SOAP persistence. A silent id mismatch can fork records or lose transcript. |
| Future extraction risk / Riesgo de extraccion | HIGH - extract only after session-id golden master/replay cases. |

### A4. Visit Type and Routing Semantics / Tipo de visita y semantica de ruta

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 578-583, 671, 1651-1738, 1846-1848, 4989, 7251-7279, 7935, 8243 |
| What it does / Que hace | Determines `initial` vs `follow-up` from URL, workflow detection, route state, and session context; controls analysis path, follow-up path, tab rendering, and persistence semantics. |
| Why risky in page / Riesgo de mantenerlo aqui | Wrong visit type changes clinical workflow, baseline/follow-up context, SOAP path, and session status. This already overlaps with the documented race-condition class. |
| Future extraction risk / Riesgo de extraccion | HIGH - extract after session type baseline and UI lock behavior are covered. |

### A5. Clinical Analysis and Niagara/Vertex Orchestration / Analisis clinico y orquestacion Niagara/Vertex

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 4000-4250, 5288-5665 |
| What it does / Que hace | Builds clinical input from transcript, physio notes and documented pillars; invokes analysis for initial sessions; transforms normalized output into interactive results; prepares data for SOAP. |
| Why risky in page / Riesgo de mantenerlo aqui | Analysis output feeds medication, red flags, yellow flags, physical tests, and SOAP context. Refactor can alter source ordering or what is considered clinician-verified. |
| Future extraction risk / Riesgo de extraccion | HIGH - no extraction without clinical replay and prompt/output fixtures. |

### A6. HEP and Treatment Decision Flow / HEP y flujo de decision de tratamiento

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 210-234, 815-824, 879-899, 5075-5268, 5450-5474, 5721-5800, 6166-6178, 7422-7564, 7990-7991, 8275-8276 |
| What it does / Que hace | Owns `todayFocus`, `inClinicItems`, `homeProgramItems`, treatment decision confirmation, HEP adherence checkboxes, injection into SOAP context, and SOAPTab overrides. |
| Why risky in page / Riesgo de mantenerlo aqui | HEP can enter SOAP from previous plan or baseline context without item-level transcript provenance. This is a known P0 clinical provenance finding from 21 Jun 2026. |
| Future extraction risk / Riesgo de extraccion | HIGH - requires clinical replay, provenance design, and CEO/CTO decision before implementation. |

Clinical/regulatory note / Nota clinica-regulatoria: `homeProgramItems` participa en el flujo HEP/SOAP. El diagnostico PASO 0 del 21 Jun 2026 confirmo que se hidrata desde `previousTreatmentDecision` o `baselineSOAP.plan` sin validacion de provenance en transcript actual.

### A7. Physical Evaluation State / Estado de evaluacion fisica

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 1098-1105, 2132-2144, 2801-2908, 3341-3422, 3510-3570, 4057-4094, 4651-4695, 5421, 5628, 6192, 7950, 8198, 8258 |
| What it does / Que hace | Owns selected/evaluated physical tests, custom test state, region filtering, structured physical exam results, and payloads into SOAP and persistence. |
| Why risky in page / Riesgo de mantenerlo aqui | The regulatory decision tree distinguishes evaluated tests from suggested tests. Mixing them silently changes medical-record meaning. |
| Future extraction risk / Riesgo de extraccion | HIGH - extract after test provenance and evaluated-vs-suggested controls are locked. |

### A8. Red Flags and Clinical Safety / Red flags y seguridad clinica

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 627-746, 751-813, 1809-1839, 4827-4982, 5363-5396, 5708, 5822-5857, 7852-7857, 7931-7943, 8178-8183, 8251-8278 |
| What it does / Que hace | Owns red flag selections, dismissals, decisions, follow-up alerts, hard gate before follow-up SOAP, referral report trigger, and SOAP skip-plan validation. |
| Why risky in page / Riesgo de mantenerlo aqui | Red flags are direct patient safety controls. Refactoring with UI logic can change whether SOAP is blocked or referral decisions persist. |
| Future extraction risk / Riesgo de extraccion | HIGH - safety replay and deterministic tests required. |

### A9. SOAP Generation and Finalization / Generacion y finalizacion SOAP

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 5288-5665, 5705-5879, 5880-6020, 6128-6230, 6247-6680, 7927-7996, 8235-8281 |
| What it does / Que hace | Checks consent, builds unified clinical data, reconciles safety after evaluation, generates initial/follow-up SOAP, sets review flags, persists drafts/finalized notes, writes finalization state. |
| Why risky in page / Riesgo de mantenerlo aqui | This is the highest-value clinical record path. Refactor can silently alter what reaches SOAP or the write-state sequence. |
| Future extraction risk / Riesgo de extraccion | HIGH - only after Clinical Replay Sandbox and golden masters. |

### A10. Persistence, Analytics, and Audit / Persistencia, analitica y auditoria

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 1555-1614, 1968-2085, 2570-2740, 5880-6020, 5948-5982, 6049, 6217, 6473, 6702-6772 |
| What it does / Que hace | Autosaves workflow state, writes session/notes/encounters, tracks analytics, writes physical-test assistance audit event, tracks SOAP/session lifecycle and value metrics. |
| Why risky in page / Riesgo de mantenerlo aqui | Audit and persistence prove provenance. If state, tracking, and writes diverge, the UI can look correct while records become incomplete. |
| Future extraction risk / Riesgo de extraccion | MEDIUM/HIGH - split into service/hook only with evidence pack. |

### A11. UI Orchestration / Orquestacion UI

| Field / Campo | Detail / Detalle |
|---|---|
| Approximate region / Region aproximada | Lines 7358-8416 |
| What it does / Que hace | Coordinates briefing, transcript, analysis, evaluation, SOAP tabs, modals, certificates, referral reports, and follow-up/initial conditional rendering. |
| Why risky in page / Riesgo de mantenerlo aqui | UI controls visibility of clinical gates and edit/confirm controls. Layout changes can change behavior if coupled to state ownership. |
| Future extraction risk / Riesgo de extraccion | MEDIUM - UI-only extraction is safer after clinical state is isolated or covered. |

## Section B - Critical State Inventory
## Seccion B - Inventario de estados criticos

This draft intentionally excludes UI-only state from detailed inventory unless it affects clinical content, persistence, consent, audit trail, SOAP generation, navigation safety, or recovery after reload.

### B1. `visitType`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `VisitType` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:671` |
| Mutated / Mutado | `setVisitType('follow-up')` lines 1672, 1726, 1846; `setVisitType('initial')` lines 1674, 1848; `setVisitType(detection.detectedType)` line 4989; passed to SOAPTab at lines 7956 and 8264 |
| Child components / Componentes hijos | `AnalysisTab`, `SOAPTab`, `EvaluationTab`, layout conditionals |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | Controls initial vs follow-up path, baseline context, red flag gates, HEP behavior, and persistence session type. |
| Future owner / Duenio futuro | reducer or workflow route/session hook |

### B2. `sessionId`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `string | null` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:932` |
| Mutated / Mutado | Cleared lines 1205-1207 and 2489-2492; hydrated lines 1272-1274 and 2503; recording/session creation lines 2728 and 2779-2783; SOAP/session persistence lines 5669 and 6213-6216 |
| Child components / Componentes hijos | `AnalysisTab`, `SOAPTab`, certificate modal, session navigation handlers |
| Contributes to SOAP / Contribuye a SOAP | YES, indirectly through persistence and resume |
| Clinical/safety impact / Impacto clinico | Determines which Firestore document receives transcript, SOAP, status, physical tests, and finalization state. |
| Future owner / Duenio futuro | `useWorkflowSessionState` / reducer |

### B3. `soapStatus`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `SOAPStatus` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:670` |
| Mutated / Mutado | Resume/hydration line 1276; restored line 2512; draft line 5612; handler line 6095; finalized payload line 6665 |
| Child components / Componentes hijos | `SOAPTab` lines 7930 and 8238; certificate visibility lines 7996, 8281, 8378 |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | Controls draft/finalized state, recovery, whether session exits as interrupted, and certificate availability. |
| Future owner / Duenio futuro | persistence/session reducer |

### B4. `writeState`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `FinalizationWriteState` union, not React state |
| Initialized / Inicializado | Type declared at `src/pages/ProfessionalWorkflowPage.tsx:5902`; Firestore field typed in `src/services/sessionService.ts:94` |
| Mutated / Mutado | `updateSessionFinalizationState` lines 5948-5982; failure payload lines 6004-6011; fully committed write lines 6656-6667 |
| Child components / Componentes hijos | None directly |
| Contributes to SOAP / Contribuye a SOAP | YES, via finalization/persistence state |
| Clinical/safety impact / Impacto clinico | Records whether SOAP was generated, saved, encounter created, fully committed, or failed. |
| Future owner / Duenio futuro | persistence service / finalization service |

### B5. `transcript`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | Owned by transcription hook; used as string in page |
| Initialized / Inicializado | Hook result around lines 1062-1074; passed as `transcript`/`setTranscript` throughout workflow |
| Mutated / Mutado | `setTranscript('')` lines 1208, 2334, 2492; restored from Firestore/local state lines 2221, 2428, 2521; passed to child editors lines 7639-7640, 7809-7810, 8141-8142 |
| Child components / Componentes hijos | `TranscriptArea`, `AnalysisTab`, `SOAPTab` |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | Primary clinical source for analysis and SOAP. Loss or stale transcript changes the medical record. |
| Future owner / Duenio futuro | `useTranscriptState` + persistence adapter |

### B6. `homeProgramItems`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `TodayFocusItem[]` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:819` |
| Mutated / Mutado | `updateHomeProgramItems` lines 5075-5109; reset line 5125; hydrated from `previousTreatmentDecision` line 5138; derived/preserved lines 5169-5238; checkboxes lines 7536-7564 |
| Child components / Componentes hijos | Clinical briefing UI, `SOAPTab` via `hepItemsOverride` lines 7991 and 8276 |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | HEP/adherence enters follow-up SOAP context and can be persisted in treatment decisions. |
| Future owner / Duenio futuro | treatment decision state/pipeline with provenance model |

Known finding / Hallazgo conocido: `homeProgramItems` enters SOAP through `organized.context.homeProgramPrescribed = homeProgramItems.map((i) => i.label)` at line 5474 and follow-up input `homeProgram: homeProgramItems.map((i) => i.label)` at line 5799. PASO 0 on 21 Jun 2026 confirmed it can be hydrated from `previousTreatmentDecision` line 5138 or derived from `baselineSOAP.plan` / `previousTreatmentPlan` lines 5143-5156 without item-level validation against current transcript provenance.

### B7. `inClinicItems`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `TodayFocusItem[]` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:818` |
| Mutated / Mutado | `handleInClinicItemsChange` lines 879-882; reset lines 5124 and 5168; hydrate line 5137; derived lines 5186-5192; UI mark-all lines 7689-7690 |
| Child components / Componentes hijos | Follow-up in-clinic block, `SuggestedFocusEditor`, `SOAPTab` via `inClinicItemsOverride` lines 7990 and 8275 |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | Controls treatment performed/planned context for follow-up SOAP. |
| Future owner / Duenio futuro | treatment decision state/pipeline |

### B8. `physicalExamResults`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | Memoized array derived from `filteredEvaluationTests` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:4057` |
| Mutated / Mutado | Not directly mutated; source state is `evaluationTests` initialized line 1098 and mutated/restored at lines 1210, 2335, 2375-2376, 2526-2528, 2801-2908, 3341-3422, 4651-4695 |
| Child components / Componentes hijos | `SOAPTab` lines 7950 and 8258; `EvaluationTab` receives `evaluationTests` line 8198 |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | Converts performed/evaluated tests into SOAP objective content and safety reconciliation. |
| Future owner / Duenio futuro | physical evaluation hook/reducer |

### B9. `redFlagDecisions`

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | `Record<string, { decision: 'continue' | 'referral_stop' | 'referral_continue_partial'; continuationNote?: string }>` |
| Initialized / Inicializado | `src/pages/ProfessionalWorkflowPage.tsx:662` |
| Mutated / Mutado | `setRedFlagDecisions` lines 706, 786, 2339, 2363, 2420, 2423; child callback lines 7857 and 8183 |
| Child components / Componentes hijos | `AnalysisTab`, `SOAPTab`, referral report flow |
| Contributes to SOAP / Contribuye a SOAP | YES / SI |
| Clinical/safety impact / Impacto clinico | Controls red-flag resolution, referral stop/continue decisions, SOAP skip-plan validation, and follow-up hard gate. |
| Future owner / Duenio futuro | clinical safety reducer/context |

### B10. `consentState` or equivalent

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | Equivalent state: `workflowConsentStatus`, `consentCheckComplete`, `patientHasConsent`, `consentStatus`, `consentPending`, `consentToken`, refs for polling/granted |
| Initialized / Inicializado | `workflowConsentStatus` lines 644-648; legacy/supporting consent states lines 973-978; refs lines 2918 and 3102-3108 |
| Mutated / Mutado | Backend check lines 1909-1955; patient change reset lines 2924-2931; first-session consent lines 3021-3088; immediate consent lines 3114-3129; polling lines 3212-3306; render gate lines 6976-7173 |
| Child components / Componentes hijos | `ConsentGateScreen`, `VerbalConsentModal`, `AnalysisTab` consent props |
| Contributes to SOAP / Contribuye a SOAP | YES, as gate before generation |
| Clinical/safety impact / Impacto clinico | Blocks clinical UI and SOAP generation when consent is missing/declined. |
| Future owner / Duenio futuro | `useConsentGate` / consent domain service |

### B11. `auditLog` or equivalent

| Field / Campo | Detail / Detalle |
|---|---|
| Type / Tipo | No single `auditLog` state found. Equivalent audit/tracking flows include `workflowRoute.auditLog`, `FirestoreAuditLogger.logEvent`, analytics tracking, and session finalization metadata. |
| Initialized / Inicializado | `workflowRoute` line 905; `FirestoreAuditLogger` import line 104; workflow route confidence consumed line 8371 |
| Mutated / Mutado | Physical-test assistance audit event lines 5948-5962; analytics/session events lines 1555-1614, 5489-5514, 6473, 6702-6772 |
| Child components / Componentes hijos | Detection confidence passed to verbal consent modal line 8371; analytics not generally passed to children |
| Contributes to SOAP / Contribuye a SOAP | NO direct SOAP content; YES for clinical traceability |
| Clinical/safety impact / Impacto clinico | Audit trail supports provenance, finalization evidence, and regulatory review. |
| Future owner / Duenio futuro | audit service / workflow telemetry adapter |

### Appendix B - UI-only State Summary / Apendice B - Resumen de estado solo UI

This draft does not inventory every UI-only variable. Examples deferred to future UI-only refactor planning include modal open flags, transient copy feedback, upload spinners, local success/error messages, greeting, share menu state, and custom-test form UI fields unless they affect clinical persistence or SOAP content.

## Section C - Risk Matrix Skeleton
## Seccion C - Esqueleto de matriz de riesgo

Clinical and regulatory risk values are intentionally marked `[PENDIENTE VALIDACION CEO/CTO]`. This section seeds only technical findings already confirmed.

| Area | Riesgo tecnico | Riesgo clinico | Riesgo regulatorio | Notas | Accion recomendada |
|---|---|---|---|---|---|
| `ProfessionalWorkflowPage.tsx` responsibility concentration | 8,441 lines; 90 `useState`; 33 `useRef`; 123 state/ref declarations; clinical, persistence, consent, audit, and UI orchestration in one file | [PENDIENTE VALIDACION CEO/CTO] | [PENDIENTE VALIDACION CEO/CTO] | Prior planning note mentioned 124 states; local baseline found 123 state/ref declarations | Baseline + replay before refactor |
| `homeProgramItems` / HEP provenance | Enters SOAP through follow-up context and SOAPTab overrides without item-level current-transcript provenance gate | [PENDIENTE VALIDACION CEO/CTO] | [PENDIENTE VALIDACION CEO/CTO] | Confirmed in PASO 0, 21 Jun 2026 | CEO/CTO decision before fix design |
| `regulatoryLanguageGuard` non-blocking | Detects/logs but does not block prescriptive language | [PENDIENTE VALIDACION CEO/CTO] | [PENDIENTE VALIDACION CEO/CTO] | Confirmed in diagnostic V5 | Separate clinical safety PR |
| `gemini-2.5-flash` hardcoded | Model alias hardcoded in `functions/index.js:8`; no explicit version or external control | [PENDIENTE VALIDACION CEO/CTO] | [PENDIENTE VALIDACION CEO/CTO] | Confirmed in diagnostic V6 | Separate model-versioning decision |
| Untracked QA scripts | `scripts/qa/backfill-orphan-encounters.cjs`, `classify-orphan-encounters.cjs`, `smoke-consent-ca-on.cjs` untracked and not ignored | [PENDIENTE VALIDACION CEO/CTO] | [PENDIENTE VALIDACION CEO/CTO] | One script can write with `--apply`; others diagnostic/read-only per first 30 lines | Decide commit vs `.gitignore` |
| Unused Vertex AI dependency | `@google-cloud/vertexai` installed in `functions/package.json` but not imported in `functions` or `src` | [PENDIENTE VALIDACION CEO/CTO] | [PENDIENTE VALIDACION CEO/CTO] | Runtime uses REST + `google-auth-library`, not Vertex SDK module | Separate dependency cleanup PR |

## Current Uncertainties / Incertidumbres actuales

- The baseline reproduces 8,441 lines and finds 90 `useState` + 33 `useRef`; prior planning referenced 124 states. This requires CTO validation before treating either number as canonical.
- This draft does not include internal state owned by lazy-loaded tabs (`AnalysisTab`, `EvaluationTab`, `SOAPTab`).
- Risk values are not filled; clinical/regulatory risk remains pending CEO/CTO validation.
- No replay/golden-master evidence is attached to this draft.

## Non-Authorization Statement / Declaracion de no autorizacion

This draft is documentation only. It does not approve extraction, refactor,
prompt changes, Firebase changes, Firestore schema changes, routing changes,
clinical behavior changes, or deployment.

Este borrador es solo documentacion. No aprueba extracciones, refactor,
cambios de prompts, Firebase, esquema Firestore, routing, comportamiento
clinico ni deploy.
