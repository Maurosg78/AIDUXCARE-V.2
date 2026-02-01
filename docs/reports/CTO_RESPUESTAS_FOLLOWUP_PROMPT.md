# Respuestas a dudas del CTO — Follow-up prompt y baseline

**Fecha:** 2026-01-31  
**Contexto:** Validación pre-producción del flujo follow-up (tres inputs a Vertex, physio a cargo).

---

## 1. Outputs solicitados (reproducibles en terminal)

### 1.1 Cómo se persiste la P del SOAP como baseline

```bash
# ProfessionalWorkflowPage.tsx — baseline
grep -n "baseline" src/pages/ProfessionalWorkflowPage.tsx
```

**Resultado:**
```
303:  const [baselineIdFromSession, setBaselineIdFromSession] = useState<string | null>(null);
1140:        setBaselineIdFromSession(savedState.baselineId != null && savedState.baselineId !== '' ? savedState.baselineId : null);
1173:          ...(baselineIdFromSession != null && { baselineId: baselineIdFromSession }),
1185:          baselineIdFromSession,
1226:  }, [patientId, transcript, niagaraResults, evaluationTests, activeTab, selectedEntityIds, localSoapNote, soapStatus, visitType, initialAssessmentClosedAt, baselineIdFromSession]);
3256:  // WO-IA-CLOSE-01: Close Initial Assessment — persist baseline, update patient/session, redirect
3266:      setAnalysisError('No SOAP note to save as baseline.');
3278:      const baselineId = await createBaseline({
3290:      await PatientService.updatePatient(pid, { activeBaselineId: baselineId });
3293:      setBaselineIdFromSession(baselineId);
3308:        baselineId,
```

```bash
# FollowUpWorkflowPage.tsx — baseline
grep -n "baseline" src/pages/FollowUpWorkflowPage.tsx
```

**Resultado:** (21 líneas; las relevantes: `followUpBlockedReason === 'no-baseline'`, `clinicalState?.baselineSOAP`, `baseline = { previousSOAP: { ...clinicalState.baselineSOAP } }`).

```bash
# baselineSOAP en todo src/
grep -rn "baselineSOAP" src/
```

**Resultado:** 49 coincidencias en `FollowUpWorkflowPage.tsx`, `clinicalStateService.ts`, `clinicalBaselineService` (no directo; se usa vía getBaselineSafe), y tests (`sessionFeedingFlow.evidence.test.ts`, `clinicalStateService.test.ts`).

---

### 1.2 Gate de continuidad (type vs sessionType — P0)

```bash
grep -n "sessionType\|visitType\|type" src/pages/ProfessionalWorkflowPage.tsx | head -30
```

**Resultado (extracto clave):**
```
209:  // WO-P0-GATE-01: single source of truth — normalize type vs sessionType (priority: type)
210:  const rawType = searchParams.get('type') ?? searchParams.get('sessionType');
211:  const sessionTypeFromUrl = (rawType === 'followup' || rawType === 'follow-up'
212:    ? 'followup'
213:    : (rawType ?? null));
215:  const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
269:  const [visitType, setVisitType] = useState<VisitType>(isExplicitFollowUp ? 'follow-up' : 'initial');
...
692:        if (route.type === 'follow-up' || isExplicitFollowUp) {
```

**Conclusión:** El P0 (WO-P0-GATE-01) está resuelto en código: una sola normalización en 209–213; se lee tanto `type` como `sessionType` y se unifica a `sessionTypeFromUrl === 'followup'` para activar follow-up.

---

### 1.3 Cómo se construye el baseline que se pasa al prompt

**Archivo:** `src/core/soap/followUp/buildFollowUpPromptV3.ts` — contenido relevante ya compartido (interfaces `FollowUpPromptV3Baseline`, uso de `baseline.previousSOAP`: subjective, objective, assessment, plan, encounterId, date). El baseline que *recibe* el builder viene de **quien lo llama** (ver Duda 1).

---

## 2. Respuestas directas a las dudas

### Duda 1 — ¿De dónde viene realmente el baseline que consume el follow-up?

**Respuesta:** El baseline es **estructurado y recuperable**, no solo texto libre.

- **Persistencia (Initial → P como baseline):**
  - En **ProfessionalWorkflowPage** (líneas 3256–3308), al hacer "Close Initial Assessment":
    - Se llama a `createBaseline()` con un **snapshot estructurado**: `primaryAssessment`, `keyFindings` (array), `precautions` (opcional), **`planSummary: localSoapNote.plan`** (la P del SOAP).
    - Ese documento se guarda en Firestore en **`clinical_baselines/{baselineId}`** (ver `clinicalBaselineService.ts`: `setDoc` con `snapshot.planSummary`, etc.).
    - Se actualiza el paciente con **`activeBaselineId: baselineId`** (`PatientService.updatePatient`).
- **Lectura (Follow-up consume baseline):**
  - **FollowUpWorkflowPage** no lee Firestore directo; usa **`clinicalStateService.getClinicalState(patientId, userId)`**.
  - En **clinicalStateService.ts**, `getBaselineSafe(patientId)`:
    - Lee `patient.activeBaselineId`.
    - Llama a **`getBaselineById(activeBaselineId)`** (Firestore `clinical_baselines/{id}`).
    - Convierte el documento en **`baselineSOAP`** con campos fijos: `subjective`, `objective`, `assessment`, **`plan`** (desde `snapshot.planSummary`), `encounterId`, `date` (líneas 106–114).
  - FollowUpWorkflowPage recibe `clinicalState.baselineSOAP` y arma `baseline = { previousSOAP: { ...clinicalState.baselineSOAP } }` para **buildFollowUpPromptV3**.

Por tanto: la P se persiste como **`planSummary`** en un documento estructurado en `clinical_baselines`; el follow-up la recibe como **`baselineSOAP.plan`** y se la pasa a Vertex con estructura clara (Previous Assessment, Previous Treatment Plan). No depende de “interpretar un string libre” sin garantías; el flujo es **documento estructurado → baselineSOAP → prompt**.

---

### Duda 2 — Gate entre initial y follow-up (P0: type vs sessionType)

**Respuesta:** Sí está resuelto en código.

- En **ProfessionalWorkflowPage.tsx** (209–215):
  - **Una sola fuente de verdad:** `rawType = searchParams.get('type') ?? searchParams.get('sessionType')`.
  - `sessionTypeFromUrl = (rawType === 'followup' || rawType === 'follow-up') ? 'followup' : (rawType ?? null)`.
  - `visitType` se inicializa con `isExplicitFollowUp ? 'follow-up' : 'initial'` (línea 269).
- El flujo follow-up (in-clinic, HEP, feedback, buildFollowUpPromptV3) solo se activa cuando **`visitType === 'follow-up'`** (o equivalente vía `sessionTypeFromUrl === 'followup'`). El informe no lo detallaba; el código sí implementa el gate unificado (WO-P0-GATE-01).

---

### Duda 3 — Tests no ejecutables (tinypool)

**Respuesta:** Riesgo aceptado como conocido; no bloqueante de diseño pero sí para producción.

- **Situación:** La suite Vitest en este entorno falla con "Maximum call stack size exceeded" (tinypool), no por el contenido de los tests del follow-up.
- **Qué existe:** Tests unitarios en `src/core/soap/followUp/__tests__/buildFollowUpPromptV3.test.ts` (snapshot + flujo de tres inputs) y script de evidencia `scripts/evidence-followup-prompt-flow.mjs` que sí se ejecuta con Node y pasa.
- **Recomendación para producción:** Ejecutar la suite en CI (o en un entorno donde tinypool no falle) y/o añadir el script de evidencia como paso de CI (`npm run test:evidence-followup-prompt-flow`) para garantizar al menos que el prompt se construye correctamente. Para PHI, es deseable que los tests del flujo follow-up (y los de clinicalStateService/sessionFeedingFlow) estén verdes en un entorno estable antes de producción.

---

### Duda 4 — Evidencia como script manual vs test integrado

**Respuesta:** Correcto: el script valida construcción del prompt, no integración Firestore ni E2E.

- **evidence-followup-prompt-flow.mjs:** Verifica que, dado un objeto `baseline` + `clinicalUpdate` + `inClinicToday` + `homeProgramPrescribed`, el prompt generado contiene las secciones esperadas. No comprueba que los datos vengan bien desde Firestore ni que la persistencia del baseline esté correcta end-to-end.
- **Cobertura E2E / integración:** Los tests en `sessionFeedingFlow.evidence.test.ts` y `clinicalStateService.test.ts` sí validan que, con `activeBaselineId` y documento en `clinical_baselines`, `getClinicalState` devuelve `baselineSOAP` con el mapeo correcto (snapshot → baselineSOAP). Es decir, la cadena “persistencia → lectura → baselineSOAP” está cubierta por tests existentes, pero esos tests hoy tampoco se ejecutan en el mismo entorno por el fallo de tinypool.
- **Recomendación:** Mantener el script de evidencia como smoke rápido del builder; para “datos llegan correctos desde Firestore y persistencia funciona E2E”, depender de los tests de `clinicalStateService` y `sessionFeedingFlow` una vez la suite sea ejecutable en CI.

---

## 3. Resumen para el CTO

| Tema | Estado | Dónde verlo |
|------|--------|-------------|
| Baseline: persistencia y origen | Estructurado: `clinical_baselines` + `activeBaselineId` → `getBaselineSafe` → `baselineSOAP` → prompt | `clinicalBaselineService.ts`, `clinicalStateService.ts` (getBaselineSafe), `ProfessionalWorkflowPage.tsx` (createBaseline), `FollowUpWorkflowPage.tsx` (baseline desde clinicalState) |
| Gate type vs sessionType (P0) | Resuelto: una normalización, follow-up se activa con `type` o `sessionType` | `ProfessionalWorkflowPage.tsx` líneas 209–215, 269, 692 |
| Construcción del baseline en el prompt | Objeto `baseline.previousSOAP` con S, O, A, P, encounterId, date; builder solo formatea | `buildFollowUpPromptV3.ts`; llamada en `FollowUpWorkflowPage.tsx` con `clinicalState.baselineSOAP` |
| Tests / evidencia | Tests escritos; suite no estable en este entorno (tinypool). Script de evidencia ejecutable y en verde | `src/core/soap/followUp/__tests__/`, `scripts/evidence-followup-prompt-flow.mjs`, `npm run test:evidence-followup-prompt-flow` |

Con esto el CTO puede validar en código las tres cosas que pidió (persistencia del baseline, gate, construcción del baseline en el prompt) y tomar la decisión de producción con las salvedades de tests/CI documentadas arriba.
