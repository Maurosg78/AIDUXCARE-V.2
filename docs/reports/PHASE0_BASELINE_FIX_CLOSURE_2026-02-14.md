# FASE 0: Baseline Hydration Fix - Documento de Cierre

**Fecha de inicio:** 13 de febrero de 2026  
**Fecha de cierre:** 14 de febrero de 2026  
**Duración:** 1 día  
**Estado:** ✅ COMPLETADO Y VALIDADO

---

## Resumen Ejecutivo

Se resolvió el bug crítico donde FOLLOWUPs cargaban baseline del INITIAL en español en lugar del FOLLOWUP más reciente en inglés. El fix asegura que cada FOLLOWUP actualice el baseline en `clinical_baselines`, garantizando continuidad clínica en el idioma canónico.

---

## Problema Identificado

### Bug Reportado
- **ID:** Zuw7dUjc9dEN8CQPGGkH
- **Severidad:** Alta
- **Descripción:** 
  > "si abro un nuevo follow porque se ha sentido mal y me quiere volver a ver durante la tarde del mismo día, no me carga el úlor tanto no está sirviendo como baseline del new follow: tiene cargada la versión de la primera visita, no hidrata de la visita inmediatamente previa."

### Síntomas
- FOLLOWUP #2 mostraba texto en **español** del INITIAL
- En lugar del FOLLOWUP #1 en **inglés** (más reciente)
- Datos:
  - UI: "durante el último tiempo al paciente se le da un tratamiento focalizado en el uso de su core abdominal..."
  - Firestore: "In-clinic treatment: Initiate session with gentle massage to the back..."

---

## Root Cause Analysis

### Flujo del Bug
```
1. getBaselineSafe() intenta path A1 (consultations)
2. getNotesByPatient() filtra por authorUid == currentUser.uid
3. Si devuelve 0 notas → fallback a A3 (clinical_baselines)
4. A3 usa patient.activeBaselineId → apunta al INITIAL viejo
5. UI muestra planSummary en español del INITIAL
```

### Fuentes de Datos Identificadas

| Fuente | Contenido | Idioma | Fecha |
|--------|-----------|--------|-------|
| **consultations** (nota) | "In-clinic treatment: Initiatés | 13:28:22 |
| **treatment_plans** (plan) | "In-clinic treatment: Initiate..." | Inglés | 13:28:22 |
| **clinical_baselines** (baseline) | "durante el último tiempo..." | Español | (INITIAL) |

### Conclusión
El sistema usaba el fallback A3 (`clinical_baselines`) que contenía el INITIAL en español, en lugar del path A1 que debería cargar la nota más reciente de `consultations`.

---

## Solución Implementada

### Cambio 1: `clinicalStateService.ts`

**Inversión de prioridad:**
- **ANTES:** `patient.activeBaselineId` primero (A3) → `consultations` fallback (A1)
- **DESPUÉS:** `consultations` primero (A1) → `patient.activeBaselineId` fallback (A3)

**Nuevo helper:**
```typescript
async function getBaselineFromActiveId(patientId: string): Promise<...> {
  // Fallback: usa patient.activeBaselineId solo cuando consultations falla
}
```

### Cambio 2: `ProfessionalWorkflowPage.tsx`

**Actualización de baseline al finalizar FOLLOWUP:**
```typescript
// Después de guardar SOAP exitosamente
if (low-up' && user?.uid && result.noteId) {
  const baselineId = await createBaseline({
    patientId,
    sourceSoapId: result.noteId,
    sourceSessionId: sessionId,
    snapshot: {
      primaryAssessment: soapDataToSave.assessment,
      keyFindings: [soapDataToSave.subjective, soapDataToSave.objective],
      planSummary: soapDataToSave.plan,
    },
    createdBy: user.uid,
  });
  
  await PatientService.updatePatient(patientId, { 
    activeBaselineId: baselineId 
  });
}
```

---

## Validación

### Tests Unitarios
- **Archivo:** `src/services/__tests__/clinicalStateService.test.ts`
- **Resultado:** 9/9 tests pasando ✅
- **Coverage:** 
  - Path A1 (consultations)
  - Path A3 (fallback activeBaselineId)
  - Escenario: FOLLOWUP #2 usa FOLLOWUP #1 como baseline

### Validación UAT
- **Paciente:** Matthew (Matt) Procotor (`UAq8lyrtl3LnlkXsgohE`)
- **Escenario:** FOLLOWUP #2 después de FOLLOWUP #1 (mismo día)
- **Resultado:** ✅ Texto en inglés carga correctamente
- **Evidencia:** Captura de pantall2-14 09:59)
  - "Initiate session with gentle massage to the back"
  - "Progress with exercises, incorporating one new progression today"
  - "Continue focalized core abdominal work (transversus abdominis)"

---

## Impacto

### Beneficios Clínicos
- ✅ Continuidad clínica correcta (FOLLOWUP carga baseline del FOLLOWUP previo)
- ✅ Idioma canónico mantenido (inglés en todos los workflows)
- ✅ Profesionales ven información actualizada (no datos obsoletos)

### Beneficios Técnicos
- ✅ Baseline actualizado automáticamente en cada FOLLOWUP
- ✅ Fallback robusto si consultations falla
- ✅ Código bien probado (9/9 tests)

### Compliance
- ✅ Cumple con CPO Documentation Standards (información actualizada)
- ✅ Idioma canónico (inglés) para todo el sistema
- ✅ Trazabilidad completa (baseline → SOAP → session)

---

## Archivos Modificados

| Archivo | Cambios | Tests |
|---------|---------|-------|
| `src/services/clinicalStateService.ts` | Inversión de prioridad A1/A3, nuevo helper | orkflowPage.tsx` | Actualización baseline post-FOLLOWUP | ✅ Manual |

---

## Commits y Tags

**Commit:**
```
fix(baseline): PHASE0 - Update clinical baseline after FOLLOWUP completion
```

**Tag:**
```
v0.1.1-phase0-baseline-fix
```

**Branch:** `main`

---

## Lecciones Aprendidas

### Investigación
1. **Buscar en TODAS las colecciones de Firestore**, no solo en la más obvia
2. **Verificar filtros de queries** (el `authorUid` causó el fallback no esperado)
3. **Logs de debug temporales** son esenciales para debugging complejo

### Arquitectura
1. **Prioridad explícita** en fallbacks (A1 primero, A3 segundo)
2. **Actualizar TODAS las fuentes** cuando se completa un workflow (consultations + clinical_baselines + treatment_plans)
3. **Tests para fallbacks** son tan importantes como para happy paths

### Proceso
1. **Validación UAT antes de merge** evita regresiones
2. **Capturas de pantalla** son evidencia valiosa para documentación
3. **Commit messages detallados** facilitan onboarding de futuros ddores

---

## Próximos Pasos

### Fase 1: Flujo Follow-up + Hidratación Completa
- Reordenar bloques UI (audio → in-clinic → HEP → SOAP)
- Campo de notas de ajustes
- Gate del botón SOAP
- Hidratación completa del prompt Vertex
- **Estimación:** 4-5.5 días

### Monitoreo Post-Deploy
- Verificar logs `[Workflow] ✅ Clinical baseline updated from FOLLOWUP`
- Monitorear errores de baseline creation
- Validar con múltiples usuarios en producción

---

## Aprobaciones

- [x] CTO: Mauricio Sobarzo
- [x] Tests: 9/9 pasando
- [x] UAT: Validado con paciente real
- [x] Documentación: Completa

**Fecha de cierre:** 14 de febrero de 2026  
**Estado:** ✅ APROBADO PARA PRODUCCIÓN

---

## Referencias

- **Bug original:** `user_feedback_aiduxcare-v2-uat-dev_2026-02-13T14-40-24.json` (ID: Zuw7dUjc9dEN8CQPGGkH)
- **Informe investigación:** `docs/reports/INFORME_CTO_BASELINE_IDIOMA_INCONSISTENTE_2026-02-13.md`
- **Scripts debug:** `scripts/debug-baseline-sources.cjs`, `scripts/debug-treatment-plans-by-pa** `src/services/__tests__/clinicalStateService.test.ts`
