# ProfessionalWorkflowPage Refactor Baseline v0.2

[DRAFT v0.2 - PENDIENTE APROBACION CTO]

Fecha: 2026-06-28
Modo: diagnostico / documentacion arquitectural
Archivo auditado: `src/pages/ProfessionalWorkflowPage.tsx`
Documento relacionado existente: `docs/governance/workflow-refactor-baseline.md`

Este documento es el contrato tecnico de refactor para `ProfessionalWorkflowPage.tsx`.
No autoriza cambios de codigo. No reemplaza governance. Sirve como baseline
operativo para evitar repetir trabajo ya realizado y para impedir que el
refactor introduzca deuda tecnica o gaps de certificacion.

## 1. Metricas actuales

Fuente: codigo local en branch `stable`, 2026-06-28.

| Metrica | Valor |
|---|---:|
| Lineas totales | 8615 |
| `useState` declarados | 90 |
| `useEffect` declarados | 43 |
| `useCallback` declarados | 42 |
| `useMemo` declarados | 15 |
| `useRef` declarados | 33 |
| Handlers `handle*` declarados | 31 declaraciones / 30 nombres unicos |

### 1.1 `useState` declarados

1. `currentPatient`
2. `loadingPatient`
3. `followUpAlerts`
4. `followUpConsiderations`
5. `followUpPatternInsight`
6. `workflowBlocked`
7. `showVerbalConsentModal`
8. `consentCheckComplete`
9. `showVerbalConsentForDeclined`
10. `workflowConsentStatus`
11. `activeTab`
12. `selectedEntityIds`
13. `selectedRedFlagIds`
14. `dismissedRedFlagIds`
15. `redFlagDecisions`
16. `followUpRedFlagHistoryResolutions`
17. `followUpPreviouslyReviewedRedFlags`
18. `followUpDecisionResolved`
19. `soapStatus`
20. `visitType`
21. `analysisSelectionResetKey`
22. `physicalTestAssistanceChoice`
23. `todayFocus`
24. `inClinicItems`
25. `homeProgramItems`
26. `treatmentDecisionConfirmation`
27. `followUpClinicalState`
28. `previousTreatmentDecision`
29. `followUpBaselineChecked`
30. `greeting`
31. `workflowRoute`
32. `workflowMetrics`
33. `workflowDetected`
34. `showWorkflowFeedback`
35. `soapTokenOptimization`
36. `isGeneratingSOAP`
37. `savingSession`
38. `analysisError`
39. `successMessage`
40. `resumeLoadFailed`
41. `attachments`
42. `isUploadingAttachment`
43. `removingAttachmentId`
44. `attachmentError`
45. `followUpContext`
46. `sessionId`
47. `currentSessionForComparison`
48. `initialAssessmentClosedAt`
49. `baselineIdFromSession`
50. `showCloseInitialConfirmModal`
51. `closeInitialConfirmData`
52. `showCPOBlockModal`
53. `sessionStartTime`
54. `transcriptionStartTime`
55. `transcriptionEndTime`
56. `soapGenerationStartTime`
57. `soapGenerationEndTime`
58. `hasRestoredFromAutoSave`
59. `autoSaveRestoreAttempted`
60. `isRestoringTranscript`
61. `restoredFromInterrupted`
62. `deploymentVersionMismatch`
63. `isFirstSession`
64. `checkingFirstSession`
65. `patientHasConsent`
66. `consentStatus`
67. `consentPending`
68. `consentToken`
69. `smsError`
70. `copyConsentFeedback`
71. `evaluationTests`
72. `pillarNotes`
73. `localSoapNote`
74. `editedAnalysisResults`
75. `physioNotes`
76. `customTestName`
77. `customTestNameError`
78. `customTestRegion`
79. `customTestResult`
80. `customTestNotes`
81. `isCustomFormOpen`
82. `dismissedSuggestionKeys`
83. `treatmentReminder`
84. `previousTreatmentPlan`
85. `referralReportOpen`
86. `referralReportData`
87. `isBuildingReferralReport`
88. `isCertificateEsModalOpen`
89. `isInitialPlanModalOpen`
90. `isShareMenuOpen`

### 1.2 `useRef` declarados

1. `localStorageClearedRef`
2. `useEffectClearedRef`
3. `hasCleanedForInitial`
4. `initialWorkflowPatientRef`
5. `isFinalizingRef`
6. `hasResumeLoadAttemptedRef`
7. `restoreTranscriptPollRef`
8. `secondaryMemorySourceRef`
9. `lastAnalysisTimestampRef`
10. `treatmentDecisionConfirmationRef`
11. `sessionIdRef`
12. `sessionIdForTranscriptRef`
13. `workflowReservedSessionIdRef`
14. `patientIdForPersistRef`
15. `userForPersistRef`
16. `lastFirestoreTranscriptRef`
17. `lastFirestoreTranscriptSessionIdRef`
18. `recordingStartTimeRef`
19. `transcriptionStartTimeRef`
20. `trackedSessionsRef`
21. `trackedOnceRef`
22. `unmountPersistRef`
23. `evaluationPersistTimeoutRef`
24. `latestEvaluationPersistRef`
25. `prevStateRef`
26. `isAddingTestsRef`
27. `lastSharedStateRef`
28. `prevPatientIdRef`
29. `consentCheckRef`
30. `consentPollingRef`
31. `consentPollingAttemptsRef`
32. `consentPollingPatientIdRef`
33. `consentGrantedRef`

### 1.3 Handlers `handle*`

Hay 31 declaraciones `handle*`; `handleBeforeUnload` aparece dos veces en
regiones distintas.

1. `handleRedFlagDismiss`
2. `handleTreatmentDecisionConfirmationChange`
3. `handleInClinicItemsChange`
4. `handleTodayFocusChange`
5. `handleHomeProgramItemsChange`
6. `handlePillarNotesChange`
7. `handleBeforeUnload`
8. `handleLogout`
9. `handleCopyConsentLink`
10. `handleResendConsentSMS`
11. `handleWorkflowSelected`
12. `handleBeforeUnload`
13. `handleConsentGrantedImmediate`
14. `handleAddCustomTest`
15. `handleAnalyzeWithVertex`
16. `handleAttachmentUpload`
17. `handleAttachmentRemove`
18. `handleAttachmentReviewedToggle`
19. `handleLibrarySelect`
20. `handleOpenReferralReport`
21. `handleConfirmFollowUpRedFlags`
22. `handlePlanCreated`
23. `handleGenerateSoap`
24. `handleGenerateSOAPFollowUp`
25. `handlePhysicalTestAssistanceChoiceChange`
26. `handleSaveSOAP`
27. `handleUnfinalizeSOAP`
28. `handleCloseInitialAssessment`
29. `handleFinalizeSOAP`
30. `handleRegenerateSOAP`
31. `handleGenerateSoapFromEvaluation`

## 2. Responsabilidades identificadas

- Parseo de URL params (`patientId`, `sessionId`, `dateKey`, `sessionType`, `resume`).
- Normalizacion de fecha clinica local.
- Resolucion de `clinicalSessionDateKey`.
- Deteccion de Spain Pilot.
- Navegacion entre workflow, Command Center y rutas de fallback.
- Carga del paciente actual desde Firestore.
- Normalizacion de identidad del paciente.
- Resolucion de email de paciente desde multiples rutas de datos.
- Resolucion de edad del paciente.
- Resolucion de nombre profesional.
- Resolucion de nombre de clinica.
- Resolucion de jurisdiccion para consentimiento SMS.
- Gate de consentimiento previo a workflow clinico.
- Consentimiento verbal.
- Consentimiento por SMS.
- Polling de consentimiento.
- Reversion de consentimiento declinado.
- Hard block de consentimiento declinado.
- Estado de workflow bloqueado.
- Estado de tabs (`analysis`, `evaluation`, `soap`).
- Deteccion de workflow inicial vs follow-up.
- Deteccion de primera sesion.
- Carga de contexto longitudinal de follow-up.
- Carga de baseline clinico para follow-up.
- Carga de treatment plan previo.
- Carga de treatment decision previa.
- Gestion de HEP / home program items.
- Gestion de tratamiento en clinica / in-clinic items.
- Gestion de today focus.
- Confirmacion explicita de treatment decision.
- HEP adherence context.
- Red flags actuales.
- Red flags historicos de follow-up.
- Seleccion de red flags.
- Descarte de red flags.
- Decision clinica sobre red flags.
- Persistencia de decisiones confirmadas de red flags.
- Referral report ES.
- Modal de certificado ES.
- Estado de transcript.
- Inicio y parada de grabacion.
- Restauracion de transcript.
- Autosave de transcript.
- Autosave de estado de workflow.
- Recuperacion de sesiones interrumpidas.
- Deteccion de mismatch de version desplegada.
- Gestion de adjuntos clinicos.
- Upload de adjuntos.
- Eliminacion de adjuntos.
- Marcado de adjuntos revisados.
- Construccion de input clinico para Vertex.
- Separacion transcript / clinical additions.
- Analisis clinico inicial.
- Analisis follow-up.
- Preparacion de datos interactivos de analisis.
- Gestion de entidades seleccionadas del analisis.
- Gestion de sugerencias de tests.
- Gestion de evaluacion fisica.
- Gestion de tests custom.
- Persistencia debounced de evaluacion fisica.
- Construccion de resultados fisicos para SOAP.
- Gestion de Magee pillar notes.
- Conteo de tests completados.
- Region clinica detectada.
- Generacion SOAP inicial.
- Generacion SOAP follow-up.
- Reconciliacion de safety antes de SOAP.
- Estado local de SOAP.
- Guardado SOAP draft.
- Guardado SOAP finalized.
- Desfinalizacion SOAP.
- Regeneracion SOAP.
- Cierre de initial assessment.
- Persistencia en `sessions`.
- Persistencia en `notes`.
- Persistencia en `encounters`.
- Actualizacion de `treatment_plans`.
- Actualizacion de `writeState`.
- Calculo de metricas de valor.
- Tracking de analytics.
- Workflow feedback.
- Universal share menu.
- Export/copy/share orchestration.
- Email resumen paciente via `SOAPTab`.
- Routing visual follow-up vertical.
- Routing visual initial por tabs.
- Render de modales globales.
- Render de banners de seguridad y estado.
- Wiring de props hacia `AnalysisTab`.
- Wiring de props hacia `EvaluationTab`.
- Wiring de props hacia `SOAPTab`.
- Wiring indirecto hacia `SOAPEditor`.

## 3. Props que pasan a componentes hijos

### 3.1 `AnalysisTab`

`AnalysisTab` se monta en dos rutas: follow-up vertical y tabbed workflow.
La lista siguiente es la union de ambas instancias.

- `key`
- `currentPatient`
- `patientIdFromUrl`
- `patientClinicalInfo`
- `calculateAge`
- `consentStatus`
- `consentPending`
- `consentToken`
- `consentLink`
- `smsError`
- `user`
- `setConsentStatus`
- `setPatientHasConsent`
- `setConsentPending`
- `setSmsError`
- `handleCopyConsentLink`
- `handleResendConsentSMS`
- `lastEncounter`
- `isFirstSession`
- `formatLastSessionDate`
- `visitType`
- `visitCount`
- `sessionTypeConfig`
- `previousTreatmentPlan`
- `setIsInitialPlanModalOpen`
- `physioNotes`
- `setPhysioNotes`
- `recordingTime`
- `isRecording`
- `startRecording`
- `stopRecording`
- `transcript`
- `setTranscript`
- `transcriptError`
- `transcriptMeta`
- `languagePreference`
- `setLanguagePreference`
- `mode`
- `setMode`
- `isTranscribing`
- `isProcessing`
- `isGeneratingSOAP`
- `audioStream`
- `handleAnalyzeWithVertex`
- `attachments`
- `isUploadingAttachment`
- `attachmentError`
- `removingAttachmentId`
- `handleAttachmentUpload`
- `handleAttachmentRemove`
- `handleAttachmentReviewedToggle`
- `niagaraResults`
- `interactiveResults`
- `onEditedResultsChange`
- `selectedEntityIds`
- `setSelectedEntityIds`
- `physicalTestAssistanceChoice`
- `onPhysicalTestAssistanceChoiceChange`
- `continueToEvaluation`
- `analysisError`
- `successMessage`
- `setAnalysisError`
- `setSuccessMessage`
- `onTodayFocusChange`
- `onFinishSession`
- `hideHeader`
- `hideTranscriptArea`
- `followUpHasContent`
- `hasSoapContent`
- `todayFocusBlockRenderedByParent`
- `resumeLoadFailed`
- `selectedRedFlagIds`
- `onRedFlagSelectionChange`
- `dismissedRedFlagIds`
- `onRedFlagDismiss`
- `redFlagDecisions`
- `onRedFlagDecisionChange`
- `currentUserId`
- `currentSessionId`
- `currentPatientId`
- `previouslyReviewedRedFlags`
- `onConfirmFollowUpRedFlags`
- `onGenerateReferralReport`

### 3.2 `SOAPTab`

`SOAPTab` se monta en dos rutas: follow-up vertical y tabbed workflow.
La lista siguiente es la union de ambas instancias.

- `localSoapNote`
- `soapStatus`
- `visitType`
- `isGeneratingSOAP`
- `patientId`
- `sessionId`
- `handleGenerateSoap`
- `handleSaveSOAP`
- `handleRegenerateSOAP`
- `handleFinalizeSOAP`
- `handleUnfinalizeSOAP`
- `setIsShareMenuOpen`
- `isTreatmentDecisionConfirmed`
- `onTreatmentDecisionConfirmationChange`
- `skipPlanValidation`
- `workflowMetrics`
- `workflowRoute`
- `soapTokenOptimization`
- `niagaraResults`
- `transcript`
- `physioNotes`
- `physicalExamResults`
- `treatmentReminder`
- `analysisError`
- `successMessage`
- `setAnalysisError`
- `setSuccessMessage`
- `setVisitType`
- `recordingTime`
- `isRecording`
- `startRecording`
- `stopRecording`
- `setTranscript`
- `transcriptError`
- `transcriptMeta`
- `languagePreference`
- `setLanguagePreference`
- `mode`
- `setMode`
- `isTranscribing`
- `isProcessing`
- `audioStream`
- `handleAnalyzeWithVertex`
- `attachments`
- `isUploadingAttachment`
- `attachmentError`
- `removingAttachmentId`
- `handleAttachmentUpload`
- `handleAttachmentRemove`
- `onCloseInitialAssessment`
- `onBackToCommandCenter`
- `patientEmail`
- `patientFirstName`
- `professionalName`
- `professionalTitle`
- `sessionDateKey`
- `inClinicItemsOverride`
- `hepItemsOverride`
- `patientName`
- `redFlagDecisions`

### 3.3 `SOAPEditor`

`SOAPEditor` no es montado directamente por `ProfessionalWorkflowPage`.
Lo monta `SOAPTab`. La lista siguiente corresponde a la instancia actual
en `src/components/workflow/tabs/SOAPTab.tsx`.

- `soap`
- `status`
- `visitType`
- `isGenerating`
- `skipPlanValidation`
- `patientId`
- `sessionId`
- `onSave`
- `onRegenerate`
- `onFinalize`
- `onUnfinalize`
- `onPreview`
- `onShare`
- `onSendPatientSummary`
- `patientSummarySent`
- `isOptimized`
- `tokenOptimization`
- `isTreatmentDecisionConfirmed`
- `onTreatmentDecisionConfirmationChange`
- `onBackToCommandCenter`
- `sessionState`
- `redFlagDecisions`
- `onFieldEdited`

### 3.4 `EvaluationTab`

- `visitType`
- `filteredEvaluationTests`
- `evaluationTests`
- `completedCount`
- `detectedCaseRegion`
- `pendingAiSuggestions`
- `allAiSuggestions`
- `physicalTestAssistanceChoice`
- `isTestAlreadySelected`
- `addEvaluationTest`
- `removeEvaluationTest`
- `updateEvaluationTest`
- `createEntryFromLibrary`
- `createCustomEntry`
- `customTestName`
- `customTestNameError`
- `customTestRegion`
- `customTestResult`
- `customTestNotes`
- `isCustomFormOpen`
- `setCustomTestName`
- `setCustomTestNameError`
- `setCustomTestRegion`
- `setCustomTestResult`
- `setCustomTestNotes`
- `setIsCustomFormOpen`
- `resetCustomForm`
- `handleAddCustomTest`
- `handleLibrarySelect`
- `isGeneratingSOAP`
- `handleGenerateSoap`
- `sessionTypeFromUrl`
- `workflowRoute`
- `onPillarNotesChange`

## 4. Candidatos para extraccion fase 1

Scope aprobado para fase 1 recomendada: solo acciones post-finalizacion.
No mover generacion SOAP, HEP, red flags, consentimiento, transcript,
session identity ni persistencia clinica.

### 4.1 Handlers involucrados

Directos:

- `setIsShareMenuOpen`
- `setIsCertificateEsModalOpen`
- `handleRegenerateSOAP`
- `handleUnfinalizeSOAP`
- `handleFinalizeSOAP`
- `handleSaveSOAP`

Indirectos por `SOAPEditor` / acciones post-finalizacion:

- `onShare`
- `onSendPatientSummary`
- `onBackToCommandCenter`
- `onPreview`
- `onFieldEdited`

No extraer en fase 1, pero registrar dependencia:

- `handleFinalizeSOAP` es el handler mas largo y riesgoso del archivo.
- `handleSaveSOAP` participa en persistencia de draft/finalized.
- `handleUnfinalizeSOAP` cambia semantica de estado clinico.
- `handleRegenerateSOAP` reabre generacion clinica.

### 4.2 State involucrado

Estado directo de acciones post-finalizacion:

- `localSoapNote`
- `soapStatus`
- `isShareMenuOpen`
- `isCertificateEsModalOpen`
- `successMessage`
- `analysisError`

Estado requerido para acciones de paciente / sesion:

- `sessionId`
- `patientIdFromUrl`
- `currentPatient`
- `patientSummaryEmail`
- `clinicalSessionDateKey`
- `clinicianDisplayName`
- `professionalProfile`
- `isSpainPilotActive`

Estado requerido para texto exportable:

- `inClinicItems`
- `homeProgramItems`
- `localSoapNote.plan`

Estado indirecto que no debe moverse en fase 1:

- `visitType`
- `workflowRoute`
- `soapTokenOptimization`
- `redFlagDecisions`
- `treatmentDecisionConfirmation`
- `transcript`
- `physioNotes`
- `physicalExamResults`

### 4.3 Dependencias que arrastran

- `SOAPEditor` contiene copy/download/PDF/export local.
- `SOAPTab` contiene modal de email resumen paciente.
- `PatientSummaryEmailModal` contiene envio real de email.
- `CertificateEsModal` vive fuera de `SOAPTab`, montado en `ProfessionalWorkflowPage`.
- `UniversalShareMenu` vive fuera de `SOAPTab`, montado en `ProfessionalWorkflowPage`.
- `derivePlanFromText` alimenta `hepItemsOverride` desde el SOAP finalizado.
- `patientSummaryEmail` resuelve email desde rutas multiples del documento paciente.
- `sessionService.updateSession` se usa en callbacks de volver al Command Center.
- `isSpainPilotActive` y `isSpainPilot()` gatean certificado/email Spain pilot.
- `currentPatient`, `professionalProfile` y `clinicianDisplayName` alimentan outputs legales/comunicaciones.

### 4.4 Forma de extraccion sugerida

Primera extraccion permitida solo si CTO aprueba:

- Crear un modelo de datos de solo lectura para acciones finalizadas.
- Crear un panel reusable de acciones finalizadas sin persistencia clinica propia.
- Alimentar ese panel desde el estado actual sin cambiar el orden de guardado.
- Mantener `handleFinalizeSOAP`, `handleSaveSOAP`, `handleGenerateSoap`,
  `handleGenerateSOAPFollowUp`, HEP y red flags en `ProfessionalWorkflowPage`
  hasta tener replay clinico.

Nombre tentativo:

- `FinalizedSessionActions`
- `SOAPActionsPanel`

Contrato tentativo:

```text
FinalizedSessionActionModel
- soapNote
- soapStatus
- sessionId
- patientId
- patientName
- patientEmail
- sessionDateKey
- professionalName
- professionalTitle
- isSpainPilotActive
```

## 5. Riesgos identificados antes de tocar

- Riesgo de cambiar semantica clinica al mover `handleFinalizeSOAP`.
- Riesgo de cambiar orden de persistencia `sessions` / `notes` / `encounters`.
- Riesgo de bifurcar `sessionId` o escribir en documento equivocado.
- Riesgo de perder `writeState` o dejar finalizacion incompleta.
- Riesgo de perder audit trail de finalizacion.
- Riesgo de que un SOAP finalizado cambie sin revision explicita.
- Riesgo de que HEP vuelva a derivarse desde estado UI desactualizado.
- Riesgo de que HEP historico aparezca como activo sin decision clinica actual.
- Riesgo de que red flags de follow-up dejen de bloquear SOAP cuando corresponde.
- Riesgo de que certificado/email se habiliten fuera de Spain pilot por error.
- Riesgo de ocultar o duplicar acciones post-finalizacion por condiciones divergentes.
- Riesgo de que email resumen use fecha no clinica si se rompe `sessionDateKey`.
- Riesgo de que email resumen use HEP no derivado del SOAP final editado.
- Riesgo de que acciones historicas dependan de estado activo de la sesion actual.
- Riesgo de introducir componentes nuevos sin contrato de props estable.
- Riesgo de crear deuda adicional por prop drilling sin modelo comun.
- Riesgo de mover UI antes de definir DTO de sesion finalizada.
- Riesgo de alterar comportamiento de copy/download/PDF al extraer `SOAPEditor`.
- Riesgo de cambiar tracking analytics sin evidencia.
- Riesgo de romper recuperacion de sesiones interrumpidas.
- Riesgo de incumplir `ENGINEERING.md` creando abstracciones sin necesidad probada.
- Riesgo de no poder auditar el refactor si mezcla documentacion y codigo clinico.

## 6. Reglas de trabajo para este refactor

- No repetir trabajo ya existente: revisar `docs/governance/workflow-refactor-baseline.md`
  antes de cualquier nuevo documento.
- No tocar codigo clinico sin diagnostico y aprobacion explicita CEO/CTO.
- No mover `handleFinalizeSOAP` en fase 1.
- No mover `handleSaveSOAP` en fase 1.
- No mover generacion SOAP en fase 1.
- No mover HEP/treatment decision en fase 1.
- No mover red flags en fase 1.
- No mover consentimiento en fase 1.
- No mover session identity/recovery en fase 1.
- Todo nuevo componente requiere aprobacion explicita.
- Cada paso de refactor debe poder verificarse con `pnpm exec tsc --noEmit`.
- Cada paso de refactor debe tener `git diff --stat` antes de commit.
- Todo commit de refactor requiere instruccion explicita CEO/CTO.
- Todo cambio debe preservar autoridad clinica humana y trazabilidad.
- La unidad de avance debe ser pequena, revisable y reversible.

## 7. Punto de partida recomendado

Punto ideal de partida para hoy:

1. Congelar este baseline como contrato de refactor.
2. Abrir fase 1 solo para acciones post-finalizacion.
3. Definir DTO de acciones finalizadas antes de crear componentes.
4. Extraer acciones historicas solo despues de confirmar que el DTO puede
   alimentarse desde `localSoapNote` y desde sesiones Firestore finalizadas.

No empezar por:

- `handleFinalizeSOAP`
- `handleSaveSOAP`
- `handleGenerateSoap`
- `handleGenerateSOAPFollowUp`
- HEP
- red flags
- consentimiento
- autosave
- session recovery

Estos dominios son clinicos o de persistencia critica y requieren replay
clinico/golden master antes de refactor.
