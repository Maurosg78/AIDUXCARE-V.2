# WO-AUTO-BASELINE-01 — Tareas por archivo (sin código aún)

Auto-baseline a partir de Initial SOAP finalizado (low-friction). Este documento desglosa el WO en tareas concretas por archivo.

---

## Resumen del WO

- **Regla única (SoT):** Un paciente se considera con baseline completa si existe al menos una SOAP inicial con status === 'finalized'. No se requiere acción manual adicional.
- **Inferencia:** Donde hoy se evalúa `patient.activeBaselineId`, añadir fallback: si no hay activeBaselineId, tratar la última SOAP inicial finalizada como baseline válida.
- **Auto-persistencia (lazy):** Opcionalmente, cuando se necesite baseline (ej. primer follow-up): crear `clinical_baseline` desde esa SOAP, setear `activeBaselineId`, log "Baseline auto-generated from finalized Initial SOAP".
- **Eliminar:** Confirmaciones manuales post-SOAP, "One step left", botones "Set baseline from last SOAP" y "Open workflow → Close Initial Assessment" cuando ya hay SOAP inicial finalizada.

---

## 1. `src/services/clinicalStateService.ts`

**Objetivo:** Que Follow-up tenga baseline cuando exista SOAP inicial finalizada, aunque no exista `activeBaselineId`.

| # | Tarea | Detalle |
|---|--------|--------|
| 1.1 | Añadir fallback en `getBaselineSafe` | Si `!patient?.activeBaselineId`, en lugar de devolver `{ hasBaseline: false }`, llamar a una función nueva que obtenga la **última SOAP inicial finalizada** del paciente (consultations / notas). |
| 1.2 | Nueva función `getLastFinalizedInitialSOAP(patientId)` o equivalente | Obtener última nota del paciente vía PersistenceService.getNotesByPatient (ya ordenado por createdAt desc). La primera nota = última SOAP guardada. Mapear a formato baselineSOAP (subjective, objective, assessment, plan, encounterId, date). Devolver null si no hay notas. |
| 1.3 | (Opcional) Auto-persistencia lazy en `getBaselineSafe` | Cuando se use el fallback (sin activeBaselineId pero sí última SOAP): (a) crear documento en `clinical_baselines` con createBaseline, (b) actualizar paciente con PatientService.updatePatient(patientId, { activeBaselineId }), (c) log "Baseline auto-generated from finalized Initial SOAP", (d) devolver baselineSOAP construido desde esa SOAP. Así la próxima vez el paciente ya tendrá activeBaselineId. |
| 1.4 | Actualizar comentarios / JSDoc | Sustituir "WO-IA-CLOSE-01 use persisted clinical_baselines only when patient.activeBaselineId exists" por WO-AUTO-BASELINE-01: baseline = activeBaselineId O última SOAP inicial finalizada; opcionalmente persistir lazy. |

**Dependencias:** PersistenceService.getNotesByPatient (ya existe). createBaseline, PatientService.updatePatient (ya existen). Necesidad: función o helper que, dado patientId (y opcionalmente userId para PersistenceService), devuelva última nota como objeto tipo baselineSOAP.

---

## 2. `src/features/patient-dashboard/PatientDashboardPage.tsx`

**Objetivo:** No mostrar "One step left" ni botones de cierre manual cuando ya hay SOAP inicial finalizada. Considerar "baseline completa" = activeBaselineId O existencia de SOAP inicial finalizada.

| # | Tarea | Detalle |
|---|--------|--------|
| 2.1 | Cambiar definición de "tiene baseline" | Hoy: `hasActiveBaseline` = !!patient?.activeBaselineId (solo desde Firestore). Nuevo: **hasEffectiveBaseline** = hasActiveBaseline OR (existe al menos una visita inicial con soapNote.status === 'finalized'). La segunda parte ya la tienes en patientVisits.data (consultations con type 'initial' y soapNote.status 'finalized'). |
| 2.2 | Usar hasEffectiveBaseline en Quick Actions | Donde hoy se usa hasActiveBaseline para: (a) mostrar/ocultar "One step left", (b) mostrar "Set baseline from last SOAP" / "Open workflow → Close Initial Assessment", (c) habilitar "Start Follow-up Visit", sustituir por hasEffectiveBaseline. |
| 2.3 | Ocultar bloque "One step left" cuando hasEffectiveBaseline | Si hay SOAP inicial finalizada (hasEffectiveBaseline), no mostrar el banner amarillo ni los dos botones de cierre manual. |
| 2.4 | Habilitar "Start Follow-up Visit" con hasEffectiveBaseline | hasClosedInitial debe ser true cuando hasEffectiveBaseline (no solo hasActiveBaseline). Así "Start Follow-up Visit" aparece en cuanto hay SOAP inicial finalizada. |
| 2.5 | (Opcional) Eliminar o colapsar recuperación manual | Eliminar botón "Set baseline from last SOAP" y "Open workflow → Close Initial Assessment" para el caso "SOAP finalizada pero sin baseline"; o dejarlos solo como fallback de recuperación si se desea (WO dice eliminarlos). |
| 2.6 | Refresco de hasEffectiveBaseline | hasEffectiveBaseline puede derivarse de: patient.activeBaselineId (vía estado actual) + patientVisits.data (si hay initial con soapNote.status === 'finalized'). No hace falta nueva petición si patientVisits ya está cargado. |

**Nota:** "Initial Eval" en verde cuando hay SOAP inicial finalizada ya se puede expresar con la misma condición (visit type initial + soap finalized).

---

## 3. `src/components/workflow/tabs/SOAPTab.tsx`

**Objetivo:** Tras finalizar SOAP inicial, mostrar mensaje de cierre exitoso sin exigir clic en "Close Initial Assessment".

| # | Tarea | Detalle |
|---|--------|--------|
| 3.1 | Cambiar mensaje post-finalización (Initial) | Cuando visitType === 'initial' y soapStatus === 'finalized': en lugar del bloque actual que pide "One more step: save the baseline" y el botón "Close Initial Assessment", mostrar: **"Initial Assessment completed. This note will be used as baseline for follow-up visits."** (sin botón de cierre). |
| 3.2 | Ocultar/eliminar botón "Close Initial Assessment" en este flujo | Dejar de pasar `onCloseInitialAssessment` como obligatorio para mostrar el bloque, o no mostrar el bloque de "Close Initial Assessment" cuando WO-AUTO-BASELINE-01 está activo (baseline se considera automática). |

**Dependencia:** ProfessionalWorkflowPage sigue pudiendo pasar `onCloseInitialAssessment`; SOAPTab simplemente no lo muestra (o se deja opcional para poder "cerrar" explícitamente si en el futuro se quiere). Según WO, no se exige ese clic.

---

## 4. `src/pages/ProfessionalWorkflowPage.tsx`

**Objetivo:** Dejar de exigir "Close Initial Assessment" para considerar el Initial cerrado; opcionalmente mantener el handler por si se usa en otro contexto.

| # | Tarea | Detalle |
|---|--------|--------|
| 4.1 | Condición de mostrar botón "Close Initial Assessment" | Hoy: onCloseInitialAssessment se pasa cuando visitType === 'initial' && soapStatus === 'finalized' && !initialAssessmentClosedAt. Para WO-AUTO-BASELINE-01: no pasar onCloseInitialAssessment (o pasarlo solo en modo "legacy" si se mantiene una feature flag). Así en SOAPTab no aparece el bloque. |
| 4.2 | (Opcional) Mensaje de éxito al finalizar | Si se quiere feedback explícito en workflow: al guardar SOAP como finalized (handleSaveSOAP(soap, 'finalized')), mostrar breve toast o mensaje: "Initial Assessment completed. This note will be used as baseline for follow-up visits." Puede hacerse en SOAPTab (arriba) o aquí. |
| 4.3 | No cambiar persistencia de sessionStorage | initialAssessmentClosedAt / baselineId en sessionStorage pueden seguir guardándose si el usuario llega a cerrar explícitamente; para WO no es obligatorio usar ese flujo. |

---

## 5. `src/pages/FollowUpWorkflowPage.tsx`

**Objetivo:** Sin cambios de lógica si clinicalStateService ya devuelve hasBaseline + baselineSOAP cuando existe SOAP inicial finalizada (fallback en getBaselineSafe). Solo verificar que no se bloquee follow-up.

| # | Tarea | Detalle |
|---|--------|--------|
| 5.1 | Verificar gate follow-up | followUpBlockedReason === 'no-baseline' cuando !clinicalState.hasBaseline. Con WO, hasBaseline será true cuando exista última SOAP inicial finalizada (vía clinicalStateService). No cambiar condición; solo asegurar que el servicio devuelve hasBaseline true en el nuevo caso. |
| 5.2 | Verificar hidratación | clinicalState.baselineSOAP ya se usa para hidratar el prompt de follow-up. Si getBaselineSafe devuelve baselineSOAP desde la última nota (o desde baseline recién creada en lazy), Follow-up seguirá hidratándose correctamente. |

---

## 6. Origen de "última SOAP inicial finalizada"

**Opción A — Usar solo PersistenceService (consultations):**  
Las notas guardadas en consultations son las SOAP finalizadas guardadas. No hay campo "initial" vs "follow-up" en SavedNote; usePatientVisits ya trata todas las consultations como tipo 'initial'. Para WO, "última SOAP inicial finalizada" = última nota del paciente por createdAt (PersistenceService.getNotesByPatient ya ordena por createdAt desc).  
- **Dónde implementar:** En clinicalStateService (o en un helper usado por clinicalStateService): llamar PersistenceService.getNotesByPatient(patientId), tomar la primera (más reciente), mapear note.soapData a { subjective, objective, assessment, plan, encounterId: note.id o note.sessionId, date: new Date(note.createdAt) }.

**Opción B — Reutilizar uso de patientVisits en dashboard:**  
En PatientDashboardPage ya tienes patientVisits.data con visitas que vienen de consultations; la visita "initial" con soapNote.status === 'finalized' es la SOAP inicial finalizada. Para el **dashboard** basta con hasEffectiveBaseline = hasActiveBaseline OR (esa visita existe). Para **Follow-up** (clinicalStateService) no tienes patientVisits; ahí sí hace falta obtener la última nota desde PersistenceService (o desde una API que devuelva "last finalized initial SOAP") para construir baselineSOAP.

**Recomendación:** En clinicalStateService usar PersistenceService.getNotesByPatient(patientId), primera nota = última SOAP; mapear a baselineSOAP. Si se implementa auto-persistencia lazy, crear baseline desde esa nota y setear activeBaselineId.

---

## 7. Tests y regresión

| # | Tarea | Detalle |
|---|--------|--------|
| 7.1 | clinicalStateService | Añadir caso: patient sin activeBaselineId pero con al menos una nota en consultations → getClinicalState devuelve hasBaseline true y baselineSOAP poblado desde esa nota. Caso: con activeBaselineId sigue igual (getBaselineById). |
| 7.2 | sessionFeedingFlow.evidence.test.ts | E2 actualmente: "Sin activeBaselineId el follow-up no tiene baseline". Ajustar a WO: cuando no hay activeBaselineId pero sí última SOAP finalizada, hasBaseline true y baselineSOAP definido (mockear getNotesByPatient o el nuevo helper). |
| 7.3 | PatientDashboardPage | Verificar que con SOAP inicial finalizada y sin activeBaselineId: no se muestra "One step left", sí "Start Follow-up Visit". |
| 7.4 | Legacy | Pacientes que ya tienen activeBaselineId: sin cambios de comportamiento. |

---

## 8. Orden sugerido de implementación

1. **clinicalStateService** — getLastFinalizedInitialSOAP (o lógica equivalente) + fallback en getBaselineSafe + opcional lazy persist.
2. **PatientDashboardPage** — hasEffectiveBaseline y ocultar "One step left" y botones cuando corresponda; habilitar "Start Follow-up Visit".
3. **SOAPTab** — Mensaje "Initial Assessment completed. This note will be used as baseline..." sin botón Close Initial Assessment.
4. **ProfessionalWorkflowPage** — Dejar de pasar onCloseInitialAssessment (o condicionar a feature flag).
5. **Tests** — Actualizar/ampliar tests según 7.

---

## 9. Qué no se toca (según WO)

- Esquema Firestore (clinical_baselines, patients.activeBaselineId).
- Auditoría (quién/cuándo se mantiene; si hay lazy persist, log "Baseline auto-generated from finalized Initial SOAP").
- Capacidad futura baseline encadenado follow-up → follow-up.
- FollowUpWorkflowPage lógica de gate/hidratación (solo depende de que clinicalState devuelva hasBaseline/baselineSOAP correctos).

---

**Cierre:** Con estas tareas por archivo se puede implementar WO-AUTO-BASELINE-01 sin refactor grande y cumplir el DoD (finalizar SOAP inicial ⇒ paciente listo para follow-up sin clics extra; Patient History sin "One step left" cuando hay SOAP inicial finalizada; Follow-up hidratado desde esa SOAP; sin regresión en legacy).
