# WO-PILOT-STAB-07 — Hardening Pilot Core

**Estado:** ✅ Completado  
**Fecha:** 2025-01-18  
**DoD:** Todos los criterios verificados

---

## Objetivo

Evitar **pérdida/mezcla de datos**, reducir **ruteos erróneos** initial/follow-up, endurecer **serialización del plan** y ajustar **wording** para compliance ("never diagnose").

---

## T1 — Session Storage Keys ✅

### Problema resuelto

Keys tipo `aidux_${patientId}` causaban colisiones entre:
- users distintos
- initial vs follow-up
- sesiones distintas del mismo paciente

### Solución implementada

**Nueva key v2:** `aidux_v2_${userId}_${patientId}_${visitType}_${sessionId}`

**Migración legacy:**
- `getSession()` intenta leer v2 key primero, luego legacy key
- Si encuentra legacy, migra automáticamente a v2 (sin perder datos)
- Legacy key se borra solo si migración exitosa

**Archivos modificados:**
- `src/services/session-storage.ts` (líneas 1-180)
- `src/pages/ProfessionalWorkflowPage.tsx` (4 llamadas actualizadas: líneas 802, 861, 889, 979)
- `src/hooks/useSessionPersistence.ts` (actualizado para nuevos parámetros)

**DoD T1:**
- ✅ No hay más `aidux_${patientId}` como única key
- ✅ Se puede abrir un paciente, hacer cambios, refrescar → se restaura bien
- ✅ Cambiar a otro paciente → no se mezcla estado

---

## T2 — Workflow Detection: Logging + Guard Zona Gris ✅

### Cambios implementados

**1. Logging estructurado (sin PHI):**
- `confidence`, `recommendedWorkflow`, `rationale[]` (genérico, sin transcript)
- Se loguea una vez por detección (no spam)

**2. Guard "zona gris" (60-79):**
- Si `confidence` está 60-79, NO aplicar auto-follow-up "agresivo"
- Política: tratar como initial (no skip analysis), conservar `recommendedWorkflow` solo para logging

**Archivos modificados:**
- `src/services/followUpDetectionService.ts` (líneas 426-442)
- `src/services/workflowRouterService.ts` (líneas 55-92)

**DoD T2:**
- ✅ Logs aparecen una vez por sesión (no spam)
- ✅ En zona gris, el usuario no salta directo a SOAP sin análisis

---

## T3 — SOAP Plan Serialization: Validación + Límite ✅

### Cambios implementados

Cuando `plan` llega como objeto:
- Serialización estable (orden fijo)
- Límite de longitud: 2000 chars
- Si excede: truncar con `… [truncated]`
- Si inválido: `"Not documented"`

**Archivos modificados:**
- `src/services/vertex-ai-soap-service.ts` (líneas 583-606, 614)

**DoD T3:**
- ✅ No hay payloads enormes en plan
- ✅ `pnpm build` sigue OK (verificado)
- ✅ No cambia el resto del SOAP

---

## T4 — Prompt Wording (Compliance): "Never Diagnose" Dominante ✅

### Cambios implementados

En `PromptFactory-Canada.ts`, cambiado wording de:
- ❌ "Medication overdose risk… exceeding safe limits… urgent referral"
- ✅ "Clinical concern: potential medication safety risk… Recommend medical review/referral based on red flags"

**Archivos modificados:**
- `src/core/ai/PromptFactory-Canada.ts` (líneas 89-90)

**DoD T4:**
- ✅ El prompt mantiene red flags + urgencia de derivación
- ✅ Wording no suena a sentencia clínica (concern/review language)

---

## Definition of Done (Global)

### Verificación

```bash
# 1. Typecheck
pnpm typecheck:pilot

# 2. Tests
pnpm test:smoke:pilot

# 3. Locales
pnpm verify:locales

# 4. Build
pnpm build
```

**Resultados:**
- ✅ `pnpm typecheck:pilot` → 0 errores
- ✅ `pnpm test:smoke:pilot` → 8/8 passed
- ✅ `pnpm verify:locales` → OK
- ✅ `pnpm build` → OK

### Manual Sanity (2 minutos)

**Escenarios verificados:**
1. ✅ Crear sesión initial, escribir algo, refresh → se restaura bien
2. ✅ Abrir follow-up mismo paciente → NO pisa el initial (keys distintas)
3. ✅ Abrir otro paciente → NO mezcla estado (keys incluyen patientId)

---

## Evidencia Requerida

### 1. Diff de cambios

**Archivos modificados:**
- `src/services/session-storage.ts` (nueva key v2 + migración legacy)
- `src/services/followUpDetectionService.ts` (logging estructurado)
- `src/services/workflowRouterService.ts` (guard zona gris 60-79)
- `src/services/vertex-ai-soap-service.ts` (validación + límite 2000 chars)
- `src/core/ai/PromptFactory-Canada.ts` (wording concern/review)
- `src/pages/ProfessionalWorkflowPage.tsx` (4 llamadas actualizadas)
- `src/hooks/useSessionPersistence.ts` (parámetros nuevos)

### 2. Comandos de verificación

**Confirmar nueva key v2 + legacy fallback:**
```bash
rg -n "aidux_v2_|aidux_\$\{patientId\}" src/services/session-storage.ts
```

**Confirmar guard zona gris 60-79:**
```bash
rg -n "SUGGEST_FOLLOW_UP|AUTO_FOLLOW_UP|60|79|zone|gray|confidence" src/services/followUpDetectionService.ts src/services/workflowRouterService.ts
```

**Confirmar plan cap:**
```bash
rg -n "truncated|2000|slice\(|substring\(|max.*plan|serialize.*plan" src/services/vertex-ai-soap-service.ts
```

**Confirmar wording "concern/review":**
```bash
rg -n "Clinical concern|Recommend medical review|Never diagnose|urgent medical referral" src/core/ai/PromptFactory-Canada.ts
```

---

## Notas Técnicas

### Compatibilidad / Migración

- **Backward compatible:** `SessionStorage` acepta parámetros opcionales (userId, visitType, sessionId)
- **Legacy fallback:** `getSession()` lee legacy key si v2 no existe
- **Migración automática:** Si encuentra legacy, migra a v2 sin perder datos
- **Sin breaking changes:** Código existente sigue funcionando (usa defaults)

### Zona Gris (60-79)

**Política implementada:**
- Confidence 80%+ → Auto follow-up (skip analysis, direct to SOAP)
- Confidence 60-79% → Tratar como initial (NO skip analysis)
- Confidence <60% → Initial evaluation (full workflow)

**Razón:** Reduce riesgo de saltar análisis cuando confidence es intermedia.

### SOAP Plan Cap

**Límite:** 2000 chars (incluyendo marker `… [truncated]`)
**Marker:** `… [truncated]` (takes 16 chars)
**Truncate at:** 1984 chars (2000 - 16)

**Validación:**
- Si vacío/inválido → `"Not documented"`
- Si objeto → serializar estable
- Si string largo → truncar con marker

### Prompt Wording

**Cambio clave:**
- Antes: "Medication overdose risk… exceeding safe limits"
- Ahora: "Clinical concern: potential medication safety risk… Recommend medical review"

**Compliance:**
- Mantiene red flags + urgencia
- No suena a diagnóstico definitivo
- Usa concern/review language

---

## Próximos Pasos

1. ✅ Hardening completado (T1-T4)
2. ⏳ Deploy y monitoreo en piloto
3. ⏳ Verificar que session keys funcionan correctamente en producción
4. ⏳ Monitorear logs de workflow detection para validar guard zona gris

---

**Nota CTO:** Todos los cambios son **estabilización**, no "feature work". Enfoque en **no perder datos + no bloquear flujo + cumplimiento clínico**. Riesgo mínimo, cambios quirúrgicos.
