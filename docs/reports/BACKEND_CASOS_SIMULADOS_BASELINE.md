# Casos simulados: backend baseline y Ongoing Patient First Time

**Fecha:** 2026-02-01  
**Objetivo:** Verificar que desde back todo está bien conectado para el flujo Ongoing Patient First Time y la rehidratación en follow-up.

## Tests ejecutados

```bash
npm run test:run -- src/services/__tests__/clinicalBaselineService.test.ts src/services/__tests__/sessionFeedingFlow.evidence.test.ts
```

## Resultados

| Suite | Tests | Estado |
|-------|-------|--------|
| `clinicalBaselineService.test.ts` | 10 | ✅ 10 passed |
| `sessionFeedingFlow.evidence.test.ts` | 9 | ✅ 9 passed |
| **Total** | **19** | **✅ 19 passed** |

## Qué se verifica

### 1. `clinicalBaselineService` (createBaselineFromMinimalSOAP)

- **Validación de plan:** Rechaza plan &lt; 15 caracteres, "paciente en tratamiento", "en tratamiento", "n/a".
- **Snapshot correcto:** Con plan válido, `setDoc` recibe `snapshot.primaryAssessment`, `keyFindings` [subjective, objective], `planSummary` y `source: 'ongoing_intake'`.
- **Fuentes:** Acepta `ongoing_intake`, `manual_minimal`, `vertex_from_paste`.
- **getBaselineById / hasBaselineForPatient:** Lectura y existencia de baseline simuladas correctamente.

### 2. Evidencia: flujo Initial Assessment → Follow-up

- E1–E3: Paciente con `activeBaselineId` recibe `baselineSOAP` con el contenido exacto del snapshot; sin baseline no hay baselineSOAP; baseline inexistente → hasBaseline false.
- E4–E5: Mapeo `keyFindings[0]` → subjective, resto → objective (unido con `\n`).
- E6: Precautions no se exponen en baselineSOAP.
- E7: Consent no altera el contenido de baselineSOAP.

### 3. Evidencia: Ongoing Patient First Time — backend conectado

- **E8:** Baseline creado por ongoing intake (snapshot con primaryAssessment, keyFindings, planSummary) se rehidrata en `getClinicalState` como `baselineSOAP` con subjective, objective, assessment, plan y encounterId correctos.
- **E9:** Ongoing intake con un solo keyFinding → objective en baselineSOAP vacío.

## Conclusión

La cadena **Ongoing Patient Intake Modal → createBaselineFromMinimalSOAP → updatePatient(activeBaselineId) → getClinicalState → baselineSOAP** está verificada con casos simulados: el backend persiste el baseline con la forma esperada y el follow-up workflow recibe el mismo contenido vía `getClinicalState`.

Para validar con Firestore real (emuladores o proyecto), ejecutar el flujo en UI: Command Center → "Ongoing patient, first time in AiDuxCare" → completar formulario → "Create baseline & start session" → comprobar en Network/Firestore que se escribe en `clinical_baselines` y se actualiza `patients/{id}.activeBaselineId`, y que en la página de follow-up el prompt usa el baseline.
