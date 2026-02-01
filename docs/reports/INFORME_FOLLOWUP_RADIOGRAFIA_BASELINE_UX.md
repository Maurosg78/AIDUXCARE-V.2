# Radiografía del Follow-up — Modelo clínico, flujo técnico, estado y UX

**Fecha:** 2026-01-27  
**Contexto:** Post WO-IA-CLOSE-01 + WO-P0-GATE-01. SoT: baseline persistido + gate normalizado.  
**Objetivo:** Documentar cómo se guarda la sesión de Initial Assessment, cómo alimenta al Follow-up, y cómo (o si) cada follow-up alimenta al siguiente. Incluye gaps detectados para el relato del piloto.

---

## 1. Modelo clínico real del Follow-up (cómo “piensa” el sistema)

Tras WO-IA-CLOSE-01, el sistema trata el Follow-up como:

> “Esta visita NO es para descubrir el caso; es para **evaluar evolución sobre un baseline ya cerrado**.”

Eso se traduce en tres fuentes de información, en este orden:

| Capa | Fuente | Rol |
|------|--------|-----|
| **Primaria** | Baseline persistido (`clinical_baselines`) | Marco clínico: problema, hallazgos, precauciones, plan inicial |
| **Secundaria** | Estado actual de la sesión (transcript, focos de hoy) | Variación / evolución, no definición del caso |
| **Contextual** | Historial mínimo | Solo lo necesario para no perder continuidad; no se re-parsea todo el Initial |

---

## 2. Cómo se guarda la sesión de Initial Assessment

### 2.1 Dónde y cuándo

- **Dónde:** `ProfessionalWorkflowPage.tsx` — botón “Close Initial Assessment” (visible solo si `visitType === 'initial'`, `soapStatus === 'finalized'`, y no existe `initialAssessmentClosedAt`).
- **Cuándo:** Al hacer clic en “Close Initial Assessment”, después de finalizar el SOAP.

### 2.2 Flujo de persistencia (orden real en código)

1. **Guard rails:** SOAP finalizado, no ya cerrado, existe `localSoapNote`, usuario autenticado.
2. **Crear baseline:** Se llama a `createBaseline()` en `clinicalBaselineService.ts`. Se persiste en Firestore en la colección `clinical_baselines/{baselineId}`.
3. **Contenido del snapshot (desde SOAP final):**
   - `primaryAssessment` ← `localSoapNote.assessment`
   - `keyFindings` ← `[localSoapNote.subjective, localSoapNote.objective]` (filter Boolean)
   - `precautions` ← `localSoapNote.precautions ? [localSoapNote.precautions] : undefined`
   - `planSummary` ← `localSoapNote.plan`
4. **Actualizar paciente:** `PatientService.updatePatient(pid, { activeBaselineId: baselineId })`.
5. **Actualizar sesión (workflow local):** `SessionStorage.saveSession(...)` con `initialAssessmentClosedAt` (ISO now) y `baselineId`.
6. **UX:** Mensaje “Initial Assessment closed. Baseline saved.” y redirección a `/command-center`.

La fuente de verdad clínica para el baseline es **el SOAP final** de esa sesión inicial; no formularios intermedios.

---

## 3. Cómo el baseline alimenta al Follow-up

### 3.1 Al iniciar Follow-up (`FollowUpWorkflowPage.tsx`)

- **Identificación:** `patientId` desde URL; tipo de visita normalizado desde query (`type` o `sessionType` → followup).
- **Carga de estado clínico:** Una sola llamada a `getClinicalState(patientId, user.uid)` en mount. Todo el gate y el contenido del baseline pasan por ahí.

### 3.2 Dentro de `clinicalStateService` (gate y mapeo)

1. **Gate real del follow-up:**
   - `patient = PatientService.getPatientById(patientId)`.
   - Si no existe `patient.activeBaselineId` → `hasBaseline = false` → follow-up bloqueado con mensaje “Initial assessment required before follow-up.”
2. **Si hay baseline:** `baseline = getBaselineById(patient.activeBaselineId)` (Firestore `clinical_baselines`).
3. **Mapeo snapshot → baselineSOAP (objeto “SOAP previo” para el prompt):**
   - `subjective` ← `snap.keyFindings?.[0] ?? ''` (en la práctica, el texto del subjective del IA).
   - `objective` ← `(snap.keyFindings?.slice(1) ?? []).join('\n')` (en la práctica, el objective del IA).
   - `assessment` ← `snap.primaryAssessment`.
   - `plan` ← `snap.planSummary`.
   - `encounterId` ← `baseline.sourceSoapId ?? baseline.id`.
   - `date` ← `baseline.createdAt` (convertido a `Date` si es Timestamp).

**Importante:** El snapshot incluye `precautions` (array), pero **no se mapean a `baselineSOAP`**. El tipo `ClinicalState.baselineSOAP` solo tiene subjective, objective, assessment, plan, encounterId, date. Por tanto, **las precauciones del Initial Assessment no entran hoy al contexto que recibe el LLM en follow-up**.

### 3.3 Uso del baseline en la generación del SOAP de follow-up

- En `handleGenerateSOAPFollowUp` se usa **solo** `clinicalState.baselineSOAP` (ya rehidratado).
- Se arma un objeto `baseline` con `previousSOAP: { ...clinicalState.baselineSOAP }` y se llama a `buildFollowUpPromptV3({ baseline, clinicalUpdate })`, donde `clinicalUpdate` es el transcript de la sesión actual.
- El LLM recibe así el “caso base” (subjective, objective, assessment, plan del IA) y la “variación de hoy” (transcript); no tiene que adivinar el caso.

### 3.4 Qué parte viene del SOAP Plan (Initial Assessment)

- **Sí entra al follow-up:**
  - **planSummary** (texto del plan): objetivos generales, enfoque terapéutico, restricciones explícitas que estén en el plan.
  - Ese plan es además la fuente de **todayFocus**: `parsePlanToFocusItems(clinicalState.baselineSOAP.plan)` extrae ítems (interventions, home exercises, etc.) para la UI de “focos de hoy”.
- **No entra hoy (y es un gap conocido):**
  - **Precauciones** del Initial Assessment: están en el snapshot pero no en `baselineSOAP` ni, por tanto, en el prompt de follow-up.
  - Objetivos cuantificados, progresiones estructuradas, métricas ROM/fuerza como números (no están en el modelo actual; coherente con no sobre-prometer para el piloto).

---

## 4. Qué NO está entrando todavía (gaps para el relato)

| Gap | Descripción | Impacto |
|-----|-------------|--------|
| **Precauciones fuera del prompt** | `snapshot.precautions` se persiste pero no se mapea a `baselineSOAP` ni se inyecta en `buildFollowUpPromptV3`. | El modelo de follow-up no ve explícitamente “precauciones del IA” al generar la nota. |
| **Un solo baseline por paciente** | `patient.activeBaselineId` apunta siempre al baseline del **Initial Assessment** cerrado. No se actualiza después de un follow-up. | El 2.º, 3.º, … follow-up siguen usando el **mismo** baseline (IA). “Cada follow-up alimenta al siguiente” **no está implementado**: no hay cadena Follow-up 1 → baseline 2 → Follow-up 2 → … |
| **todayFocus y prompt** | `todayFocus` se deriva del plan del baseline y se usa en la UI (checklist de focos). En el código revisado, `buildFollowUpPromptV3` recibe `baseline` y `clinicalUpdate` (transcript). | No está verificado en este informe si los ítems de todayFocus se envían explícitamente al prompt (p. ej. como lista de “focos de hoy”); si no, el modelo solo ve el plan como texto en el baseline. |
| **Historial mínimo** | No se re-parsea el IA; no se re-infieren diagnósticos. Solo se usa el snapshot ya guardado. | Esto es intencional y correcto para el piloto. |

---

## 5. Flujo técnico resumido (de dónde sale cada cosa)

```
Initial Assessment (ProfessionalWorkflowPage)
  → SOAP finalizado → Close Initial Assessment
  → createBaseline(snapshot: assessment, [subjective, objective], precautions?, plan)
  → Firestore: clinical_baselines/{id}
  → Patient: activeBaselineId = id
  → SessionStorage: initialAssessmentClosedAt, baselineId

Follow-up (FollowUpWorkflowPage)
  → getClinicalState(patientId, userId)
     → PatientService.getPatientById → activeBaselineId?
     → getBaselineById(activeBaselineId) → snapshot
     → baselineSOAP = map(snapshot)  // precautions no mapeados
  → todayFocus = parsePlanToFocusItems(baselineSOAP.plan)
  → handleGenerateSOAPFollowUp
     → buildFollowUpPromptV3({ baseline: { previousSOAP: baselineSOAP }, clinicalUpdate: transcript })
     → Vertex → SOAP follow-up

Siguiente follow-up (mismo paciente)
  → Sigue usando el mismo activeBaselineId (mismo baseline del IA).
  → No se crea ni se usa un “nuevo baseline” tras el primer follow-up.
```

---

## 6. UX real del Follow-up (qué ve el fisio)

1. Entra a Follow-up (Command Center, Dashboard o URL con `type=followup` o `sessionType=followup`).
2. Si no hay baseline → mensaje “Initial assessment required before follow-up.” (no puede continuar).
3. Si hay baseline + consent:
   - No vuelve a explicar el caso.
   - El sistema ya tiene: qué se trata (assessment, plan), hallazgos relevantes (subjective/objective en keyFindings), y focos editables derivados del plan (todayFocus).
   - El fisio se concentra en: qué cambió, cómo respondió el paciente, qué ajustar hoy (transcript + checklist).
4. Al generar SOAP follow-up, el modelo recibe el baseline (sin precauciones explícitas) y el transcript como evolución.

Esto alinea con un flujo clínico real: **Initial = definición del caso; Follow-up = evolución**. No es un scribe genérico; es continuidad clínica sobre un contrato (baseline) cerrado.

---

## 7. Qué está bien logrado (para el relato del lunes)

- Separación semántica clara: Initial vs Follow-up.
- Baseline como contrato clínico único y persistido.
- Gate explícito: sin `activeBaselineId` no hay follow-up.
- No re-parsear todo el IA en cada follow-up; solo usar el snapshot.
- Normalización del gate de entrada (`type` / `sessionType`) en un solo lugar.
- planSummary (y por tanto el plan completo en texto) sí alimenta el contexto del follow-up y la UI de todayFocus.

---

## 8. Qué NO hacer antes del lunes (recordatorio)

- No estructurar más el baseline ni añadir “objetivos inteligentes”.
- No tocar prompts grandes ni re-interpretar SOAP antiguos.
- Las precauciones y la “cadena” follow-up → siguiente follow-up son **fase post-piloto**; el informe solo los deja documentados como gaps.

---

---

## 9. Pruebas de evidencia (backend, casos ficticios)

Para entender el flujo con **evidencia concreta** (sin teoría):

1. **Script ejecutable (Node, sin Vitest ni Firestore):**
   ```bash
   npm run test:evidence-session-flow
   ```
   o:
   ```bash
   node scripts/evidence-session-feeding-flow.mjs
   ```
   Imprime: SOAP ficticio → snapshot → baselineSOAP (mapeo exacto) y el gap de precautions.

2. **Tests unitarios (Vitest, mocks):**  
   `src/services/__tests__/sessionFeedingFlow.evidence.test.ts`  
   Casos: E1 flujo completo, E2/E3 gate sin baseline, E4/E5 mapeo keyFindings, E6 precautions no en baselineSOAP, E7 consent no altera baseline.  
   *Nota:* en algunos entornos Vitest puede fallar por tinypool; en ese caso usar el script anterior.

3. **Siguiente paso:** validar en UI con pacientes creados en Aidux (Initial cerrado → Follow-up con mismo paciente).

---

*Informe investigativo; sin cambios de código. Gaps identificados para priorización post-piloto.*
