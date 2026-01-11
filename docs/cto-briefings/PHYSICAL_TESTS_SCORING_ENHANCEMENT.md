# 🎯 Mejora de Scoring para Tests Físicos - Briefing CTO

**Fecha:** 2026-01-10  
**Prioridad:** Media-Alta  
**Estado:** ✅ APROBADO - Implementación en progreso  
**Estimación:** 2-3 horas (implementación inmediata) + investigación futura (TBD)  
**CTO Review:** ✅ Aprobado con mejoras sugeridas (protecciones anti-hallucination, algoritmo refinado)

---

## 📋 Resumen Ejecutivo

### Problema Identificado

Los tests físicos sugeridos por Vertex AI actualmente no incluyen valores de **sensibilidad** y **especificidad** cuando no tienen match en nuestra biblioteca MSK. Esto causa que:

1. **Tests neurológicos** (Dermatome, Myotome, Deep tendon reflexes) y otros tests relevantes quedan fuera del top 5 porque no tienen scores
2. **Tests con match en biblioteca** (SLR, Slump) tienen scores y se ordenan primero, aunque algunos tests sin match pueden ser clínicamente más relevantes
3. **Ordenamiento subóptimo**: El algoritmo prioriza tests con scores conocidos sobre tests con `evidence_level: "strong"` pero sin scores

### Solución Propuesta

Hacer que **Vertex AI busque y proporcione valores de sensibilidad/especificidad** para cada test que sugiere, consultando fuentes con datos pre-calculados (PhysioTutor, literatura científica, etc.).

---

## 🔧 IMPLEMENTACIÓN INMEDIATA (Ahora)

### Cambio 1: Modificar Prompt para Solicitar Scores Explícitamente

**Archivo:** `src/core/ai/PromptFactory-Canada.ts`

**Cambio:**
- Agregar instrucciones explícitas en el prompt para que Vertex AI busque y proporcione sensibilidad/especificidad para cada test sugerido
- Especificar fuentes preferidas: PhysioTutor, literatura científica, bases de datos de evidencia clínica

**Instrucciones implementadas (con protecciones anti-hallucination del CTO):**
```typescript
CRITICAL ANTI-HALLUCINATION RULES (MUST FOLLOW):
- ONLY provide values if you have a reliable source (PhysioTutor, Cochrane Review with year, systematic review, meta-analysis, clinical guideline with organization name)
- If no reliable source is available, respond with: "sensitivity": "unknown", "specificity": "unknown"
- NEVER estimate, invent, or fabricate values without a verifiable source
- NEVER create fake citations or invent study references
- Qualitative values ("high", "moderate", "low") are acceptable ONLY if from a reliable source (not estimated by you)
- ALWAYS include source attribution when providing values
- If source is not available, use: "source": "unknown"
- If you provide values without a source, the system will flag them as potential hallucinations and discard them

Preferred sources (in order of reliability):
1. PhysioTutor (trauma/orthopedic tests) - highest priority for MSK tests
2. Cochrane Reviews (include year: "Cochrane Review 2023")
3. Systematic reviews and meta-analyses (include author/year when possible)
4. Clinical guidelines (CPA, CPO, CAPR) - include organization and year
5. Peer-reviewed journal articles (include year)

Fallback strategy (MUST FOLLOW IN ORDER):
1. Search PhysioTutor first (for trauma/orthopedic tests)
2. Search Cochrane Reviews (include year if found)
3. Search systematic reviews/meta-analyses (include citation when possible)
4. Search clinical guidelines (CPA, CPO, CAPR)
5. If no data found in any reliable source → use "unknown" (DO NOT estimate)
```

**Impacto esperado:**
- Vertex AI proporcionará scores para más tests
- Mejor ordenamiento basado en datos reales vs solo evidence level
- Tests neurológicos y otros tests relevantes tendrán scores y se ordenarán correctamente

**Tiempo estimado:** 1-2 horas

---

### Cambio 2: Mejorar Algoritmo de Ordenamiento

**Archivo:** `src/utils/sortPhysicalTestsByImportance.ts`

**Cambio implementado (con refinamiento del CTO):**
- Ajustado algoritmo para manejar casos donde tests tienen diferentes disponibilidad de scores
- Tests con `evidence_level: "strong"` pero sin scores ahora ganan sobre tests "moderate" con scores
- Ordenamiento alfabético cuando evidence level es igual para consistencia

**Lógica implementada (refinada por CTO):**
```typescript
// ✅ Si NINGUNO tiene scores (average score = 0), evidence level decide
if (avgScoreA === 0 && avgScoreB === 0) {
  const evidenceDiff = evidenceB - evidenceA;
  if (evidenceDiff !== 0) return evidenceDiff;
  // Si mismo evidence level, ordenar alfabéticamente para consistencia
  return testA.name.localeCompare(testB.name);
}

// ✅ Si AMBOS tienen scores, score decide
if (avgScoreA > 0 && avgScoreB > 0) {
  return avgScoreB - avgScoreA;
}

// ✅ Si SOLO UNO tiene scores, depende de evidence level del otro:
// - Si test sin scores tiene "strong" → priorizar (más confiable que moderate con scores)
// - Si test sin scores tiene "moderate" o menos → el con scores gana
if (avgScoreA === 0 && testA.evidence_level === "strong") {
  return -1; // Test A (strong, sin scores) gana sobre Test B (con scores)
}
if (avgScoreB === 0 && testB.evidence_level === "strong") {
  return 1; // Test B (strong, sin scores) gana sobre Test A (con scores)
}
```

**Tiempo estimado:** 30 minutos

---

### Cambio 3: Actualizar Normalización de Respuesta con Validación Anti-Hallucination

**Archivo:** `src/utils/cleanVertexResponse.ts`

**Cambio implementado:**
- Asegurar que los scores proporcionados por Vertex AI (numéricos, cualitativos, o "unknown") se preserven correctamente
- Mapear campos `sensitivity`/`specificity` del JSON de Vertex AI al formato interno
- **✅ CTO RECOMMENDATION: Validar contra hallucinations** - Si test tiene scores pero no fuente válida, descartar scores y usar "unknown"
- Preservar `source` attribution de Vertex AI para tracking
- Preservar `region` de Vertex AI para filtrado regional

**Validación implementada:**
```typescript
// ✅ CTO RECOMMENDATION: Validate for hallucinations
const hasSource = item.source && item.source !== "unknown" && item.source !== "clinical_reasoning";
const hasScores = (sensitivity !== undefined && sensitivity !== "unknown") || (specificity !== undefined && specificity !== "unknown");

if (hasScores && !hasSource) {
  console.warn(`[Test Scoring] ⚠️ POTENTIAL HALLUCINATION: "${name}" has scores but no valid source`);
  // Discard suspicious scores - set to undefined to use evidence level instead
  return { ...test, sensitivity: undefined, specificity: undefined, source: "unknown" };
}
```

**Tiempo estimado:** 30 minutos (✅ COMPLETADO)

---

## 🔮 TAREAS FUTURAS (Post-aprobación)

### Tarea 1: Investigar Fuentes de Scores por Especialidad

**Objetivo:** Identificar fuentes confiables con datos de sensibilidad/especificidad para tests físicos fuera del área traumatológica.

**Áreas prioritarias:**
- **Neurológico:** Tests neurológicos usados por fisios de trauma (Dermatome, Myotome, Deep tendon reflexes)
- **Cardiorespiratorio:** Tests de capacidad funcional, tolerancia al ejercicio
- **Pediatrico:** Tests específicos para población pediátrica
- **Geriatrico:** Tests adaptados para población geriátrica

**Fuentes a investigar:**
- PhysioTutor (ya identificado para trauma)
- Journal of Physiotherapy
- Physical Therapy Journal
- Clinical databases (UpToDate, ClinicalKey)
- Systematic reviews específicas por especialidad

**Estimación:** 8-16 horas de investigación

---

### Tarea 2: Integrar Fuentes Externas (Opcional - Futuro Lejano)

**Objetivo:** Si encontramos APIs o bases de datos accesibles, integrarlas directamente para obtener scores en tiempo real.

**Consideraciones:**
- Costos de API
- Latencia vs precisión
- Fallbacks si la fuente no está disponible
- Actualización de datos

**Estimación:** 2-3 semanas (análisis + implementación)

---

### Tarea 3: Expandir Biblioteca MSK con Scores

**Archivo:** `src/core/msk-tests/library/mskTestLibrary.ts`

**Objetivo:** Agregar scores de sensibilidad/especificidad a más tests en nuestra biblioteca local cuando los encontremos en fuentes confiables.

**Beneficios:**
- No depender 100% de Vertex AI para scores
- Mejor matching con tests conocidos
- Ordenamiento más preciso

**Estimación:** 4-8 horas por cada lote de tests agregados

---

## 📊 Métricas de Éxito

### Corto Plazo (Post-implementación inmediata)
- ✅ % de tests con scores proporcionados por Vertex AI > 60%
- ✅ % de tests con scores + fuente válida (no hallucinations) > 50%
- ✅ % de tests con scores sin fuente (posibles hallucinations) < 10%
- ✅ Tests con `evidence_level: "strong"` aparecen en top 5 correctamente (incluso sin scores)
- ✅ Tests neurológicos con "strong" evidence aparecen en top 5 correctamente
- ✅ Reducción de tests neurológicos relevantes en sidebar (deben estar en top 5)
- ✅ Tiempo de respuesta del primer llamado < 10 segundos (con scores adicionales)

### Mediano Plazo (Post-investigación)
- ✅ Fuentes identificadas para 3+ especialidades
- ✅ % de tests con scores > 80%
- ✅ Mejora en ordenamiento basado en datos reales vs solo evidence level

---

## 🎯 Aprobación Requerida

### Implementación Inmediata
- [x] **Cambio 1:** Modificar prompt para solicitar scores explícitamente (✅ COMPLETADO - con protecciones anti-hallucination)
- [x] **Cambio 2:** Mejorar algoritmo de ordenamiento (✅ COMPLETADO - con refinamiento del CTO)
- [x] **Cambio 3:** Actualizar normalización de respuesta (✅ COMPLETADO - con validación anti-hallucination)

**Tiempo total:** 2-3 horas  
**Riesgo:** Bajo (cambios incrementales, no rompe funcionalidad existente)  
**Beneficio:** Alto (mejor ordenamiento, más tests con scores, protección contra hallucinations)  
**Estado:** ✅ EN PROGRESO - Pendiente testing

### Tareas Futuras
- [ ] **Tarea 1:** Investigar fuentes de scores por especialidad (8-16 horas)
- [ ] **Tarea 2:** Integrar fuentes externas (si aplicable, 2-3 semanas)
- [ ] **Tarea 3:** Expandir biblioteca MSK con scores (4-8 horas por lote)

---

## 📝 Notas Técnicas

### Zona Gris Identificada
Los tests neurológicos (Dermatome, Myotome, Deep tendon reflexes) están en una **zona gris** porque:
- Son usados por fisios de trauma (área MSK)
- También son parte del arsenal neurológico
- Actualmente no tienen scores en nuestra biblioteca MSK
- Vertex AI puede proporcionar scores si se le solicita explícitamente

### Estrategia de Fallback (Implementada con Protecciones Anti-Hallucination)
1. **Primero:** Vertex AI busca scores en fuentes confiables (PhysioTutor, Cochrane Reviews, systematic reviews, meta-analyses, clinical guidelines)
2. **Si encuentra fuente válida:** Proporciona scores numéricos o cualitativos con source attribution
3. **Si no encuentra fuente válida:** Usa "unknown" (NO estima ni inventa valores) - ✅ CTO RECOMMENDATION
4. **Validación en código:** Si test tiene scores pero no fuente válida → descarta scores como posible hallucination → usa evidence level como criterio principal
5. **Algoritmo de ordenamiento:** Usa evidence level como criterio principal cuando no hay scores válidos

---

## 🚀 Próximos Pasos

1. ✅ **CTO aprobó implementación inmediata** (2-3 horas) - ✅ COMPLETADO
2. ✅ **Implementar cambios 1, 2, 3** - ✅ COMPLETADO (con protecciones anti-hallucination del CTO)
3. **🔄 SIGUIENTE:** Testing con casos reales (verificar que más tests tienen scores con fuente válida)
4. **🔄 SIGUIENTE:** Monitorear métricas:
   - % de tests con scores + fuente válida (> 50% objetivo)
   - % de tests con scores sin fuente (< 10% objetivo - posibles hallucinations)
   - Tests neurológicos con "strong" evidence en top 5
   - Tiempo de respuesta del primer llamado (< 10s objetivo)
5. **FUTURO:** Si éxito, proceder con investigación de fuentes (Tarea 1)
6. **FUTURO:** Si no hay mejora suficiente, re-evaluar estrategia

---

## ✅ IMPLEMENTACIÓN COMPLETADA

### Cambios Implementados

1. ✅ **Prompt modificado** (`src/core/ai/PromptFactory-Canada.ts`):
   - Instrucciones explícitas para solicitar scores con fuente
   - Protecciones anti-hallucination estrictas (usar "unknown" si no hay fuente)
   - Fuentes preferidas claramente definidas (PhysioTutor > Cochrane > systematic reviews > guidelines)
   - Ejemplos de formato correcto e incorrecto

2. ✅ **Algoritmo de ordenamiento refinado** (`src/utils/sortPhysicalTestsByImportance.ts`):
   - Si NINGUNO tiene scores → evidence level decide (alfabético si igual)
   - Si AMBOS tienen scores → score decide
   - Si SOLO UNO tiene scores → test con "strong" evidence (sin scores) gana sobre test "moderate" (con scores)

3. ✅ **Normalización con validación** (`src/utils/cleanVertexResponse.ts`):
   - Maneja valores numéricos, cualitativos ("high"/"moderate"/"low"), y "unknown"
   - **Validación anti-hallucination:** Descarta scores sin fuente válida
   - Preserva source attribution y region de Vertex AI
   - Logging de posibles hallucinations para debugging

### Mejoras del CTO Incorporadas

- ✅ Protecciones anti-hallucination más estrictas (no estimar sin fuente)
- ✅ Validación en código para detectar posibles hallucinations
- ✅ Algoritmo refinado según lógica del CTO (tests "strong" sin scores vs tests "moderate" con scores)
- ✅ Métricas adicionales para tracking (% con fuente, % sin fuente, tiempo de respuesta)

---

## 📊 Métricas de Seguimiento (Post-Testing)

### Métricas Principales
- % de tests con scores + fuente válida (objetivo: > 50%)
- % de tests con scores sin fuente - posibles hallucinations (objetivo: < 10%)
- % de tests con "unknown" (esperado: ~30-40% inicialmente)
- Tests neurológicos con "strong" evidence en top 5 (objetivo: 100%)
- Tiempo de respuesta del primer llamado (objetivo: < 10s, baseline: ~8s)

### Logs a Monitorear
- `[Test Scoring] ⚠️ POTENTIAL HALLUCINATION` warnings (debe ser < 10% de tests)
- Vertex AI responses con source attribution (trackear fuentes más usadas)

---

**Preparado por:** AI Assistant  
**Revisado por:** ✅ CTO (2026-01-10)  
**Aprobado por:** ✅ CTO (2026-01-10)  
**Implementado por:** AI Assistant (2026-01-10)  
**Estado:** ✅ COMPLETADO - Pendiente testing con casos reales

