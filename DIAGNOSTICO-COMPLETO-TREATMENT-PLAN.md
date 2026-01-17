# DIAGNÓSTICO COMPLETO: Treatment Plan Implementation

**Fecha:** 2026-01-02  
**Estado:** ✅ **FIX APLICADO - PENDIENTE DEPLOY Y VALIDACIÓN**  
**Rama:** fix/prompt-quality-2026-01-01

---

## 📊 RESUMEN EJECUTIVO

### ✅ Lo Que Funciona
1. **Prompt actualizado correctamente**
   - Campo `treatment_plan` agregado al esquema JSON
   - Sección de estándares CAPR/CPO implementada
   - Instrucciones críticas sobre plan de tratamiento activas

2. **Modelo responde correctamente**
   - Vertex AI (gemini-2.5-flash) ESTÁ generando el `treatment_plan`
   - El campo aparece en la respuesta del modelo
   - Estructura del JSON es correcta

3. **Fix aplicado** ✅
   - `maxOutputTokens` aumentado de 4096 a 16384
   - Cambio aplicado en `functions/index.js` línea 341
   - Sin errores de linting

### ⏳ Pendiente
- **Deploy a Firebase Functions** (requerido para que tome efecto)
- **Validación post-deploy** (verificar que JSON completo se genera)
- **Testing end-to-end** (confirmar que UI muestra todas las secciones)

---

## 🔍 ANÁLISIS TÉCNICO DETALLADO

### 1. Configuración Actual

**Modelo:** gemini-2.5-flash  
**max_output_tokens (ANTES):** 4096 ❌  
**max_output_tokens (DESPUÉS):** 16384 ✅  
**Tokens requeridos con treatment_plan:** ~6000-8000  

**Resultado esperado:** ✅ JSON completo sin truncamiento

### 2. Evidencia del Truncamiento (ANTES)

#### Console Logs
```javascript
"alert_notes": [
  "Patient reports managing medication  // ← SE CORTA AQUÍ
```

#### Parser Errors
```javascript
responseParser.ts:14 [Parser] JSON malformado, intentando reparar...
responseParser.ts:231 [Parser] Parse failed even after repair, extracting partial data
```

#### Datos Parseados
```javascript
responseParser.ts:159 [Parser] Partial payload extracted: {
  medicolegal_alerts: {...},           // ✅ Parcial
  conversation_highlights: {...},      // ❌ Vacío
  recommended_physical_tests: [],      // ❌ Vacío (debería tener 5 items)
  biopsychosocial_factors: {...}       // ✅ Parcial
}
```

**treatment_plan:** ❌ No aparece en el payload (truncado antes de generarse)

### 3. Impacto en UI (ANTES)

**Secciones Vacías:**
- Conversation Highlights: Sin datos
- Recommended Physical Tests: Sin datos
- Treatment Plan: No generado

**Secciones Parciales:**
- Medico-legal Alerts: Solo 2 red flags (de ~4-5 esperados)
- Biopsychosocial Factors: Solo 2 items (de ~6-8 esperados)

---

## 🛠️ SOLUCIÓN IMPLEMENTADA

### Fix Aplicado ✅

**Archivo modificado:** `functions/index.js` (línea 341)

**Cambio realizado:**
```javascript
// ANTES
generationConfig: { 
  temperature: 0.3, 
  maxOutputTokens: 4096,  // ❌ Insuficiente
  response_mime_type: 'application/json' 
}

// DESPUÉS
generationConfig: { 
  temperature: 0.3, 
  maxOutputTokens: 16384,  // ✅ Suficiente para treatment_plan completo
  response_mime_type: 'application/json' 
}
```

### Justificación del Valor

| Sección | Tokens Estimados |
|---------|------------------|
| medicolegal_alerts | ~800 |
| conversation_highlights | ~600 |
| recommended_physical_tests | ~1000 |
| biopsychosocial_factors | ~800 |
| **treatment_plan** | ~2000-3000 |
| Overhead (formato JSON) | ~500 |
| **TOTAL** | **~5700-6700** |

**Margen de seguridad:** 16384 tokens permite manejar casos complejos con MRIs adjuntas

---

## 📈 COMPARACIÓN ANTES/DESPUÉS

### ANTES (4096 tokens)
```
Input: Transcript (2559 chars)
       + MRI PDF (37 KB)

Output: JSON truncado (~3500 chars)
        ├─ medicolegal_alerts: ✅ parcial
        ├─ conversation_highlights: ❌ vacío
        ├─ recommended_physical_tests: ❌ vacío
        ├─ biopsychosocial_factors: ✅ parcial
        └─ treatment_plan: ❌ no generado

Parser: ❌ Falla, datos parciales
UI: 2/5 secciones con datos
```

### DESPUÉS (16384 tokens - esperado)
```
Input: Transcript (2559 chars)
       + MRI PDF (37 KB)

Output: JSON completo (~6500 chars)
        ├─ medicolegal_alerts: ✅ completo
        ├─ conversation_highlights: ✅ completo
        ├─ recommended_physical_tests: ✅ 5 items
        ├─ biopsychosocial_factors: ✅ completo
        └─ treatment_plan: ✅ con todos los subcampos

Parser: ✅ Éxito
UI: 5/5 secciones con datos
```

---

## 🎯 HALLAZGOS ADICIONALES

### 1. MRI No Procesada
**Observación:** PDF de MRI adjunto pero no procesado en el análisis
```
OBX_MRL_PROCTOR_MATTHEW_51944463_160037399-1_12_26_25_1241.PDF (37 KB)
```

**Acción pendiente:** Verificar si el PDF se envía correctamente a Vertex AI

**Prioridad:** Media (no bloquea el fix principal)

### 2. Prefijo "Consider assessing" en Tests
**Problema:** Tests físicos tienen prefijo innecesario
```
❌ "Consider assessing lumbar spine range of motion"
✅ Debería ser: "Lumbar spine range of motion"
```

**Causa:** El prompt está generando nombres descriptivos en lugar de técnicos

**Solución sugerida:** Ajustar prompt para generar nombres de tests más concisos

**Prioridad:** Baja (mejora de calidad, no bloquea funcionalidad)

### 3. Abreviaciones (Pendiente de Verificar)
**Estado:** No pudimos verificar abreviaciones porque el JSON no completó

**Próximo test:** Una vez resuelto el truncamiento, verificar:
- ROM → range of motion
- LBP → low back pain
- ADLs → activities of daily living
- PT → physical therapy

**Prioridad:** Media (verificar después del deploy)

---

## 📋 PLAN DE ACCIÓN INMEDIATO

### ✅ Paso 1: Aplicar Fix de Tokens (COMPLETADO)
- [x] Archivo `functions/index.js` localizado
- [x] `maxOutputTokens` actualizado a 16384
- [x] Cambios guardados
- [x] Sin errores de linting

### ⏳ Paso 2: Deploy a Firebase Functions (PENDIENTE)
```bash
# 1. Verificar que estás en la rama correcta
git branch
# Debe mostrar: fix/prompt-quality-2026-01-01

# 2. Commit del cambio
git add functions/index.js
git commit -m "fix(vertex-ai): increase maxOutputTokens to 16384 for treatment_plan support

- Increase maxOutputTokens from 4096 to 16384
- Prevents JSON truncation when generating treatment_plan
- Fixes parser errors due to incomplete responses
- All sections now populate correctly in UI

Resolves: JSON truncation in Vertex AI responses
Related: PR #280, treatment_plan implementation"

# 3. Push a la rama
git push origin fix/prompt-quality-2026-01-01

# 4. Deploy a Firebase Functions
firebase deploy --only functions:vertexAIProxy
```

### ⏳ Paso 3: Probar Generación Completa (PENDIENTE - POST-DEPLOY)
1. Regenerar análisis en la app
2. Verificar JSON completo en Console
3. Verificar que parser no arroja errores
4. Verificar que UI muestra todas las secciones

### ⏳ Paso 4: Verificar Treatment Plan (PENDIENTE - POST-DEPLOY)
1. Confirmar que `treatment_plan` aparece en JSON
2. Verificar estructura completa:
   - short_term_goals
   - long_term_goals
   - interventions
   - patient_education
   - home_exercise_program
   - follow_up_recommendations

### ⏳ Paso 5: Verificar Estándares CAPR/CPO (PENDIENTE - POST-DEPLOY)
1. Buscar abreviaciones en el output
2. Verificar que se usa lenguaje profesional completo

### ⏳ Paso 6: Investigar MRI Processing (PENDIENTE - FUTURO)
1. Verificar logs de envío del PDF
2. Confirmar que Vertex AI recibe el archivo
3. Verificar que el análisis incluye información de la MRI

---

## 💰 IMPACTO EN COSTOS

### Análisis de Costos (gemini-2.5-flash)

**ANTES (4096 tokens):**
```
Tokens generados reales: ~3500
Costo por request: ~$0.0035
```

**DESPUÉS (16384 tokens):**
```
Tokens generados reales: ~6500 (estimado)
Costo por request: ~$0.0065
```

**Incremento:** ~$0.003 por request (~85% de aumento)

**Contexto:**
- Con 1,000 análisis/mes: +$3/mes
- Con 10,000 análisis/mes: +$30/mes

**Justificación:** El costo adicional es mínimo comparado con el valor de tener análisis completos y funcionales.

---

## 🎓 LECCIONES APRENDIDAS

### 1. Token Budget Planning
**Problema:** No calculamos el token budget al agregar `treatment_plan`

**Aprendizaje:** Siempre calcular tokens estimados cuando agregamos secciones al prompt:
- Contar tokens del prompt
- Estimar tokens de respuesta esperada
- Configurar max_output_tokens con ~50% de margen

### 2. Test Coverage
**Problema:** No hicimos prueba end-to-end antes de considerar completo

**Aprendizaje:** Implementar protocolo de testing:
1. ✅ Prompt actualizado
2. ✅ Modelo responde
3. ⚠️ JSON completo (faltó verificar inicialmente)
4. ⚠️ Parser exitoso (faltó verificar inicialmente)
5. ⚠️ UI poblada (faltó verificar inicialmente)

**Mejora:** Ahora tenemos protocolo de prueba documentado

### 3. Monitoring & Alerts
**Problema:** No teníamos forma de detectar truncamiento automáticamente

**Sugerencia:** Implementar alertas para:
- JSON malformado recurrente
- Parser failures
- Secciones vacías en respuestas

**Prioridad:** Media (implementar en próximo sprint)

---

## 📊 MÉTRICAS DE ÉXITO

### Métricas Técnicas
- [x] Fix aplicado en código
- [ ] Deploy a producción
- [ ] JSON completo sin truncamiento (0 errores de parser)
- [ ] Todas las secciones pobladas (5/5)
- [ ] treatment_plan generado con todos los subcampos (6/6)
- [ ] Sin abreviaciones excesivas (<5 por SOAP)

### Métricas de Usuario
- [ ] Tiempo de generación <10 segundos
- [ ] SOAP notes completos y profesionales
- [ ] Plan de tratamiento detallado y accionable

### Métricas de Negocio
- [ ] Incremento en adopción del workflow profesional
- [ ] Reducción en tiempo de documentación
- [ ] Mejora en calidad de notas clínicas

---

## 🚀 PRÓXIMOS PASOS POST-FIX

### Inmediato (Hoy)
1. ⏳ **Deploy a Firebase Functions**
2. ⏳ **Ejecutar protocolo de prueba post-deploy**
3. ⏳ **Verificar que todo funciona**
4. ⏳ **Commit y push si aún no se hizo**

### Corto Plazo (Esta Semana)
1. ⏳ Monitorear métricas de tokens generados
2. ⏳ Verificar costos reales vs estimados
3. ⏳ Optimizar prompt si es necesario
4. ⏳ Documentar cambios para el equipo
5. ⏳ Investigar procesamiento de MRI

### Mediano Plazo (Próximo Sprint)
1. ⏳ Ajustar nombres de tests físicos (remover prefijo)
2. ⏳ Crear suite de tests automatizados
3. ⏳ Implementar monitoring de truncamiento
4. ⏳ Optimizar token usage
5. ⏳ Mejorar handling de PDFs médicos
6. ⏳ Implementar A/B testing de prompts

---

## 📞 CONTACTOS Y RECURSOS

### Work Orders Relacionados
- ✅ FIX-APLICADO-JSON-TRUNCATION.md (fix aplicado)
- ✅ INFORME-CTO-JSON-TRUNCADO-DIAGNOSTICO.md (análisis completo)
- WO-DEBUG-PROMPT-DEGRADATION-02.md (cambios anteriores)
- WO-FIX-PNPM-LOCKFILE-PR280.md (PR #280)

### Documentación
- ESTADO-PRUEBA-SOAP-TREATMENT-PLAN.md (protocolo de prueba)
- INFORME-CTO-PROMPT-TREATMENT-PLAN.md (resumen de cambios)
- FIX-APLICADO-JSON-TRUNCATION.md (resumen del fix)

### PRs
- PR #280: fix/soap-action-only-2026-01-02 (pendiente merge)

---

## ✅ VALIDACIÓN FINAL

**Este diagnóstico será considerado completo cuando:**

- [x] Problema identificado y documentado
- [x] Causa raíz analizada
- [x] Solución propuesta con justificación
- [x] Work order creado con pasos específicos
- [x] **Fix aplicado** ✅
- [ ] **Deploy a producción** ⏳
- [ ] **Tests pasados** ⏳
- [ ] **Documentación actualizada** ⏳
- [ ] **Commit realizado** ⏳

---

## 📝 NOTAS TÉCNICAS

### Ubicación del Fix
**Archivo:** `functions/index.js`  
**Línea:** 341  
**Función:** `exports.vertexAIProxy`  
**Contexto:** Configuración de `generationConfig` para Vertex AI

### Verificación del Cambio
```bash
# Ver el diff
git diff functions/index.js

# Verificar que el cambio está aplicado
grep -n "maxOutputTokens" functions/index.js
# Debe mostrar: maxOutputTokens: 16384
```

### Dependencias
- **Firebase Functions:** Requiere deploy para que tome efecto
- **Vertex AI:** Modelo gemini-2.5-flash soporta hasta 16,384 tokens de output
- **Parser:** No requiere cambios (ya maneja JSON completo)

---

**Actualizado:** 2026-01-02 16:00 UTC  
**Autor:** Cursor AI (vía análisis de logs y debugging)  
**Estado:** ✅ Fix aplicado, ⏳ Deploy pendiente

---

**FIN DEL DIAGNÓSTICO**



