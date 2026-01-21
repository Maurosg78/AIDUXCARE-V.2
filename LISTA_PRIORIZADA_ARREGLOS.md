# 🔧 LISTA PRIORIZADA DE ARREGLOS
## Basada en Logs de Producción | Fecha: 2026-01-21

---

## ⚠️ REGLA FUNDAMENTAL

**Durante esta fase NO se eliminan archivos ni se refactoriza estructura.**
**Solo fixes localizados y quirúrgicos.**

Esta regla evita:
- Regresiones silenciosas
- Pérdida de contexto histórico
- Bugs "fantasma"
- Desviaciones de scope

**Commit boundary:** Cada ítem crítico = 1 commit independiente.

---

## 🎯 RESUMEN EJECUTIVO

**Total de Issues:** 5  
**Críticos:** 2  
**Importantes:** 2  
**Menores:** 1

**Tiempo Total Estimado:** 4-6 horas

---

## 🔴 PRIORIDAD 1 - CRÍTICOS (Bloqueantes para Demo)

### 1.1 Firestore Permissions - `consultations` Collection

**Error:**
```
FirebaseError: Missing or insufficient permissions.
Collection: consultations
Action: create
```

**Causa Raíz:**
- Firestore rules esperan `authorUid == request.auth.uid`
- Código envía `ownerUid` (no `authorUid`)
- Mismatch entre reglas y código

**Archivos Afectados:**
- `firestore.rules` (línea 371-387)
- `src/services/PersistenceService.ts` (línea 77, 84)

**Solución:**
1. **Opción A (Recomendada):** Cambiar código para usar `authorUid`
   - Modificar `PersistenceService.ts` para usar `authorUid` en lugar de `ownerUid`
   - Mantener reglas de Firestore como están
   
2. **Opción B:** Cambiar reglas para usar `ownerUid`
   - Modificar `firestore.rules` para aceptar `ownerUid`
   - Menos recomendado (inconsistente con otras colecciones)

**Tiempo Estimado:** 30 minutos  
**Esfuerzo:** Bajo  
**Impacto:** 🔴 **CRÍTICO** - Bloquea guardado de SOAP notes

**Pasos:**
1. Cambiar `ownerUid` → `authorUid` en `PersistenceService.ts`
2. Verificar que `authorUid` se establece correctamente
3. Probar guardado de SOAP note
4. Deploy de cambios

**Commit:**
```bash
fix(firestore): align consultations ownership with authorUid
```

---

### 1.2 Firestore Permissions - `treatment_plans` Collection

**Error:**
```
Error saving treatment plan: FirebaseError: Missing or insufficient permissions.
```

**Causa Raíz:**
- Similar a `consultations`: falta campo de ownership o reglas incorrectas
- Necesita verificación de reglas de Firestore para `treatment_plans`

**Archivos Afectados:**
- `firestore.rules` (verificar si existe regla para `treatment_plans`)
- `src/services/treatmentPlanService.ts` (o similar)

**Solución:**
1. Verificar si existe regla en `firestore.rules` para `treatment_plans`
2. Si no existe, agregar regla similar a `consultations`
3. Verificar que código envía `authorUid` o `ownerUid` correctamente

**Tiempo Estimado:** 30 minutos  
**Esfuerzo:** Bajo  
**Impacto:** 🔴 **CRÍTICO** - Bloquea guardado de treatment plans

**Pasos:**
1. Buscar reglas de `treatment_plans` en `firestore.rules`
2. Si no existe, agregar regla
3. Verificar código que guarda treatment plans
4. Probar guardado

**Commit:**
```bash
fix(firestore): add ownership rules for treatment_plans
```

---

## 🟡 PRIORIDAD 2 - IMPORTANTES (No Bloqueantes, pero Necesarios)

### 2.1 Analytics Compliance Violation - Campo `transcript`

**Error:**
```
[COMPLIANCE VIOLATION] {
  prohibitedField: 'transcript',
  collection: 'value_analytics',
  reason: 'Contains PHI, violates PHIPA/PIPEDA'
}
```

**Causa Raíz:**
- `trackValueMetrics` recibe objeto con campo `transcript` o `transcriptLength`
- El validador de compliance rechaza correctamente el campo
- El código intenta enviar datos que contienen PHI

**Archivos Afectados:**
- `src/pages/ProfessionalWorkflowPage.tsx` (línea ~2730-2758)
- `src/services/analyticsService.ts` (línea 747-797)
- `src/core/analytics/analyticsValidationService.ts` (validador)

**Solución:**
1. Verificar qué campo exacto se está enviando
2. Remover campo `transcript` o `transcriptLength` de `metrics` antes de llamar a `trackValueMetrics`
3. Asegurar que solo se envían metadatos (counts, timestamps, booleans)

**Tiempo Estimado:** 30 minutos  
**Esfuerzo:** Bajo  
**Impacto:** 🟡 **IMPORTANTE** - Violación de compliance PHIPA/PIPEDA

**Pasos:**
1. Buscar dónde se construye objeto `metrics` en `ProfessionalWorkflowPage.tsx`
2. Verificar que NO incluye `transcript` o `transcriptLength`
3. Si incluye, removerlo
4. Probar que analytics funciona sin el campo

**Commit:**
```bash
fix(analytics): remove PHI fields from value metrics
```

---

### 2.2 Performance - Loop de `persistEvaluation`

**Síntoma:**
- `persistEvaluation` se ejecuta 20+ veces en logs
- Se dispara en cada cambio de notas (`Notes change detected`)
- Puede causar degradación de performance

**Causa Raíz:**
- `useEffect` se dispara en cada cambio de notas
- Falta debouncing o throttling
- Condición de guardado demasiado permisiva

**Archivos Afectados:**
- `src/pages/ProfessionalWorkflowPage.tsx` (función `persistEvaluation`)
- `src/components/workflow/tabs/EvaluationTab.tsx` (onChange handlers)

**Solución:**
1. Implementar debouncing en `persistEvaluation` (500ms-1000ms)
2. Agregar condición para evitar guardados innecesarios
3. Usar `useMemo` o `useCallback` para optimizar

**Tiempo Estimado:** 1-2 horas  
**Esfuerzo:** Medio  
**Impacto:** 🟡 **IMPORTANTE** - Degradación de performance  
**Estado:** ⚠️ **POST-STABILITY** - No pre-demo crítico (no bloquea funcionalidad)

**Pasos:**
1. Agregar debounce a `persistEvaluation`
2. Agregar condición para evitar guardados si no hay cambios reales
3. Probar que guardado funciona correctamente
4. Verificar que número de llamadas se reduce significativamente

---

## 🟢 PRIORIDAD 3 - MENORES (Mejoras, No Urgentes)

### 3.1 Login Error en Primer Intento

**Error:**
```
FirebaseError: Error (auth/invalid-credential)
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword 400
```

**Síntoma:**
- Primer intento de login falla
- Segundo intento funciona correctamente
- No bloqueante - usuario puede hacer login

**Causa Probable:**
- Timing issue con Firebase Auth
- Posible caché de credenciales
- Race condition en inicialización

**Archivos Afectados:**
- `src/pages/LoginPage.tsx`
- `src/contexts/AuthContext.tsx`

**Solución:**
1. Investigar timing de Firebase Auth
2. Agregar retry logic o delay
3. Verificar estado de auth antes de intentar login

**Tiempo Estimado:** 1 hora  
**Esfuerzo:** Medio  
**Impacto:** 🟢 **MENOR** - Funciona, solo requiere doble click

**Pasos:**
1. Agregar logging para entender timing
2. Implementar retry logic si es necesario
3. Probar que login funciona en primer intento

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Críticos (1 hora)
- [ ] **1.1** Corregir `ownerUid` → `authorUid` en `PersistenceService.ts`
- [ ] **1.1** Probar guardado de SOAP note
- [ ] **1.2** Verificar/agregar reglas para `treatment_plans`
- [ ] **1.2** Probar guardado de treatment plan

### Fase 2: Importantes (1.5-2.5 horas)
- [ ] **2.1** Remover campo `transcript` de analytics
- [ ] **2.1** Probar que analytics funciona sin PHI
- [ ] **2.2** Implementar debouncing en `persistEvaluation`
- [ ] **2.2** Verificar reducción de llamadas

### Fase 3: Menores (1 hora)
- [ ] **3.1** Investigar y corregir error de login

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

1. **1.1** Firestore Permissions - `consultations` (30 min) ⚡ **URGENTE**
2. **1.2** Firestore Permissions - `treatment_plans` (30 min) ⚡ **URGENTE**
3. **2.1** Analytics Compliance (30 min) 🟡 **IMPORTANTE**
4. **2.2** Performance Loop (1-2 horas) 🟡 **IMPORTANTE**
5. **3.1** Login Error (1 hora) 🟢 **MEJORA**

**Tiempo Total:** 3.5-5 horas

---

## 📊 IMPACTO POR PRIORIDAD

| Prioridad | Issues | Tiempo | Bloqueante |
|-----------|--------|--------|------------|
| 🔴 Crítico | 2 | 1 hora | Sí |
| 🟡 Importante | 2 | 1.5-2.5 horas | No |
| 🟢 Menor | 1 | 1 hora | No |
| **Total** | **5** | **3.5-5 horas** | - |

---

## ✅ CRITERIOS DE ACEPTACIÓN

### 1.1 y 1.2 - Firestore Permissions
- ✅ SOAP notes se guardan correctamente en Firestore
- ✅ Treatment plans se guardan correctamente
- ✅ No hay errores de permisos en consola
- ✅ Datos son accesibles después de guardar

### 2.1 - Analytics Compliance
- ✅ No hay errores de compliance violation en consola
- ✅ Analytics funciona correctamente
- ✅ No se envía PHI en eventos de analytics

### 2.2 - Performance Loop
- ✅ `persistEvaluation` se ejecuta máximo 2-3 veces por sesión
- ✅ No hay degradación de performance
- ✅ Guardado funciona correctamente

### 3.1 - Login Error
- ✅ Login funciona en primer intento
- ✅ No hay errores en consola
- ✅ UX mejorada

---

**Generado:** 2026-01-21  
**Basado en:** Logs de producción del 2026-01-21  
**Próxima Revisión:** Después de implementar fixes críticos
