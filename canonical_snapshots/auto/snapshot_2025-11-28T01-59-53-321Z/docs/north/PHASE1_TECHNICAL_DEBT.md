# 🔴 Technical Debt - Phase 1

**Date:** November 21, 2025  
**Status:** 📋 **DEFERRED TO PHASE 2**  
**Priority:** 🔴 **HIGH** - Affects core workflow functionality

---

## 🐛 **BUG CRÍTICO: Tests Seleccionados No Se Transfieren**

### **Problema Reportado:**

1. **Tests seleccionados en "Initial Analysis" no aparecen en "Physical Evaluation"**
   - Usuario selecciona tests recomendados por IA (ej: Finkelstein's Test, UCL Stress Test, Grip Strength Testing, Wrist Range of Motion Assessment)
   - Al hacer clic en "Continue to physical evaluation", los tests NO aparecen en el área de evaluación física
   - El área muestra tests incorrectos o mockeados (ej: "Schober's Test" para un caso de muñeca)

2. **Tests incorrectos aparecen en evaluación física**
   - Tests de regiones incorrectas aparecen (ej: test lumbar "Schober's Test" en caso de muñeca)
   - Posiblemente hay datos mockeados o hardcodeados que se están cargando

---

## 🔍 **ÁREAS A INVESTIGAR**

### **1. Transferencia de Tests Seleccionados**

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Función:** `continueToEvaluation()` (línea ~991)

**Problema potencial:**
- Los tests seleccionados en `ClinicalAnalysisResults` tienen IDs como `physical-0`, `physical-1`, etc.
- La función `continueToEvaluation` debería mapear estos IDs a `EvaluationTestEntry` y agregarlos a `evaluationTests`
- Puede haber un problema en el mapeo o en la persistencia

**Código relevante:**
```typescript
const continueToEvaluation = () => {
  const suggestionMap = new Map(aiSuggestions.map((item) => [item.key, item]));
  
  selectedEntityIds
    .filter((id) => id.startsWith("physical-"))
    .forEach((entityId) => {
      const index = parseInt(entityId.split("-")[1], 10);
      const suggestion = suggestionMap.get(index);
      if (!suggestion) return;
      
      let entry: EvaluationTestEntry;
      if (suggestion.match) {
        entry = createEntryFromLibrary(suggestion.match, "ai");
      } else {
        entry = createCustomEntry(suggestion.rawName, "ai");
      }
      
      addEvaluationTest(entry);
    });
  
  setActiveTab("evaluation");
};
```

**Posibles causas:**
- `aiSuggestions` no está correctamente mapeado con los tests recomendados
- `selectedEntityIds` no contiene los IDs correctos
- `addEvaluationTest` está fallando silenciosamente
- Los tests se agregan pero luego se filtran o sobrescriben

---

### **2. Tests Mockeados o Hardcodeados**

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx` o `src/hooks/useSharedWorkflowState.ts`

**Problema potencial:**
- Puede haber tests iniciales o por defecto que se cargan desde `sharedState.physicalEvaluation?.selectedTests`
- Estos tests pueden estar mockeados o venir de una sesión anterior
- El `useEffect` en línea ~357 puede estar sobrescribiendo los tests agregados

**Código relevante:**
```typescript
useEffect(() => {
  if (sharedState.physicalEvaluation?.selectedTests) {
    const sanitized = sharedState.physicalEvaluation.selectedTests.map(sanitizeEvaluationEntry);
    
    if (detectedCaseRegion) {
      const filtered = sanitized.filter(test => !test.region || test.region === detectedCaseRegion);
      setEvaluationTests(filtered);
    } else {
      setEvaluationTests(sanitized);
    }
  }
}, [sharedState.physicalEvaluation?.selectedTests, detectedCaseRegion]);
```

**Posibles causas:**
- `sharedState.physicalEvaluation?.selectedTests` contiene tests de una sesión anterior
- Los tests mockeados se están cargando desde localStorage o sessionStorage
- El `useEffect` se ejecuta después de `continueToEvaluation` y sobrescribe los tests agregados

---

### **3. Mapeo de Tests Recomendados**

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Función:** `interactiveResults` (línea ~766)

**Problema potencial:**
- Los tests recomendados por Vertex AI vienen en `niagaraResults.evaluaciones_fisicas_sugeridas`
- Estos se mapean a `physicalTests` en `interactiveResults`
- Puede haber un problema en cómo se mapean estos tests a `aiSuggestions`

**Código relevante:**
```typescript
const physicalTests = rawTests
  .map((test: any, index: number) => {
    if (!test) return null;
    
    if (typeof test === "string") {
      return {
        name: test,
        sensitivity: undefined,
        specificity: undefined,
        indication: "",
        justification: ""
      };
    }
    
    return {
      name: test.test || test.name || "Physical test",
      sensitivity: ...,
      specificity: ...,
      indication: test.objetivo || test.indicacion || "",
      justification: test.justificacion || ""
    };
  })
  .filter(Boolean) ?? [];
```

---

## 🎯 **PLAN DE RESOLUCIÓN (FASE 2)**

### **Prioridad 1: Debugging y Logging**

1. **Agregar logging detallado en `continueToEvaluation`:**
   ```typescript
   console.log('[DEBUG] continueToEvaluation called');
   console.log('[DEBUG] selectedEntityIds:', selectedEntityIds);
   console.log('[DEBUG] aiSuggestions:', aiSuggestions);
   console.log('[DEBUG] suggestionMap:', suggestionMap);
   console.log('[DEBUG] Tests to add:', testsToAdd);
   console.log('[DEBUG] evaluationTests after add:', evaluationTests);
   ```

2. **Agregar logging en `addEvaluationTest`:**
   ```typescript
   console.log('[DEBUG] addEvaluationTest called:', entry);
   console.log('[DEBUG] Current evaluationTests:', evaluationTests);
   console.log('[DEBUG] Will persist:', [...evaluationTests, entry]);
   ```

3. **Agregar logging en `useEffect` que carga desde sharedState:**
   ```typescript
   console.log('[DEBUG] Loading tests from sharedState:', sharedState.physicalEvaluation?.selectedTests);
   console.log('[DEBUG] Sanitized tests:', sanitized);
   console.log('[DEBUG] Filtered tests:', filtered);
   ```

### **Prioridad 2: Investigar Origen de Tests Mockeados**

1. **Buscar en código fuente:**
   - Buscar "Schober" en todo el código
   - Buscar tests hardcodeados o mockeados
   - Revisar `useSharedWorkflowState` para datos iniciales

2. **Revisar localStorage/sessionStorage:**
   - Verificar si hay datos persistentes de sesiones anteriores
   - Limpiar datos de prueba si existen

3. **Revisar flujo de datos:**
   - Verificar cómo se inicializa `sharedState.physicalEvaluation`
   - Verificar si hay datos por defecto en algún lugar

### **Prioridad 3: Corregir Transferencia de Tests**

1. **Validar mapeo de IDs:**
   - Asegurar que `physical-0`, `physical-1`, etc. se mapean correctamente a `aiSuggestions`
   - Verificar que `suggestionMap` contiene todos los tests recomendados

2. **Validar timing:**
   - Asegurar que `continueToEvaluation` se ejecuta antes de que `useEffect` sobrescriba los tests
   - Considerar usar `useRef` o `useState` con callback para evitar race conditions

3. **Validar persistencia:**
   - Asegurar que `persistEvaluation` realmente persiste los tests
   - Verificar que `updatePhysicalEvaluation` actualiza correctamente el shared state

### **Prioridad 4: Testing**

1. **Test unitario para `continueToEvaluation`:**
   - Mock `selectedEntityIds`, `aiSuggestions`, `addEvaluationTest`
   - Verificar que los tests se agregan correctamente

2. **Test de integración:**
   - Simular selección de tests en `ClinicalAnalysisResults`
   - Verificar que aparecen en el área de evaluación física

3. **Test end-to-end:**
   - Flujo completo desde análisis hasta evaluación física
   - Verificar que los tests correctos aparecen

---

## 📊 **IMPACTO**

**Severidad:** 🔴 **ALTA**
- Bloquea el flujo principal de trabajo
- Los usuarios no pueden usar los tests recomendados por IA
- Genera confusión con tests incorrectos

**Frecuencia:** 🔴 **ALTA**
- Ocurre en cada caso donde se seleccionan tests recomendados
- Afecta a todos los usuarios

**Esfuerzo estimado:** 4-6 horas
- Debugging: 1-2 horas
- Corrección: 2-3 horas
- Testing: 1 hora

---

## ✅ **CRITERIOS DE ACEPTACIÓN**

1. ✅ Tests seleccionados en "Initial Analysis" aparecen correctamente en "Physical Evaluation"
2. ✅ No aparecen tests mockeados o de regiones incorrectas
3. ✅ Los tests recomendados por IA se transfieren correctamente
4. ✅ Los tests manuales también se transfieren correctamente
5. ✅ No hay datos residuales de sesiones anteriores

---

## 📝 **NOTAS**

- Este bug fue identificado durante testing de Fase 1
- El usuario reportó que los tests seleccionados no aparecen y que hay tests incorrectos
- Se documenta como deuda técnica para Fase 2 ya que requiere investigación profunda
- Fase 1 se enfoca en logging y UX, este bug requiere debugging de flujo de datos

---

**Asignado a:** Fase 2  
**Fecha de resolución:** Pendiente  
**Estado:** 🔴 **ABIERTO**

