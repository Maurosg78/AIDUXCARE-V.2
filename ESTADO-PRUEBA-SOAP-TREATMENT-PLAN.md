# ESTADO ACTUAL Y PROTOCOLO DE PRUEBA
## Mejoras al Prompt: Treatment Plan + Estándares CAPR/CPO

**Fecha:** 2026-01-02  
**Estado:** ✅ Cambios aplicados, ⏳ Prueba pendiente

---

## ✅ CAMBIOS APLICADOS

### 1. Prompt Factory Actualizado
**Archivo:** `src/core/ai/PromptFactory-Canada.ts`

**Cambios confirmados:**
- ✅ Campo `treatment_plan` agregado al esquema JSON de salida (línea 14)
- ✅ Sección `LANGUAGE STANDARDS (CAPR/CPO Compliance)` agregada (líneas 18-21)
- ✅ Instrucción crítica sobre plan de tratamiento (línea 30)
- ✅ Instrucciones por defecto actualizadas para visitas iniciales y seguimiento (líneas 32-38)

### 2. Servidor de Desarrollo
**Estado:** ✅ **CORRIENDO** en puerto 5174
- Procesos activos: 969, 49128, 98690
- Los cambios deberían estar activos vía Hot Module Replacement (HMR)

---

## ⚠️ NOTA IMPORTANTE: Parser Necesita Actualización

### Problema Identificado

El parser de respuestas (`src/utils/responseParser.ts` y `src/utils/cleanVertexResponse.ts`) **NO incluye** el campo `treatment_plan` en:

1. **`emptyPayload`** en `responseParser.ts` (líneas 57-81)
   - No tiene estructura para `treatment_plan`
   - Si el JSON viene malformado, no podrá extraer el plan de tratamiento

2. **`StructuredPayload`** en `cleanVertexResponse.ts` (líneas 31-55)
   - No incluye `treatment_plan` en el tipo
   - El normalizador no procesará este campo

### Impacto

- ✅ **El modelo AI generará** el campo `treatment_plan` (el prompt lo requiere)
- ⚠️ **El parser puede ignorar** el campo si no está en el payload estructurado
- ⚠️ **La UI puede no mostrar** el plan de tratamiento si no se normaliza correctamente

### Solución Requerida (Post-Prueba)

Si la prueba muestra que el `treatment_plan` no aparece en la UI, necesitaremos:

1. Agregar `treatment_plan` a `emptyPayload` en `responseParser.ts`
2. Agregar `treatment_plan` a `StructuredPayload` en `cleanVertexResponse.ts`
3. Agregar función de mapeo para normalizar `treatment_plan` a formato de UI
4. Actualizar `ClinicalAnalysis` interface si es necesario

---

## 🧪 PROTOCOLO DE PRUEBA

### Paso 1: Verificar Servidor
```bash
# Ya confirmado: ✅ Servidor corriendo en puerto 5174
```

### Paso 2: Acceder a la Aplicación
1. Abrir navegador en **modo incógnito** (`Cmd + Shift + N`)
2. Ir a: `http://localhost:5174`
3. Verificar que la página carga sin errores

### Paso 3: Login
1. Login con credenciales de prueba
2. Verificar que el login funciona correctamente

### Paso 4: Generar SOAP Note
1. Navegar a la página de workflow profesional
2. Seleccionar o crear un paciente
3. Ingresar un transcript de prueba (ejemplo: caso de dolor lumbar)
4. Hacer clic en "Analyze" o generar SOAP

### Paso 5: Verificar Resultados

#### 5.1 Verificar en Consola del Navegador
Abrir DevTools (F12) → Console y buscar:

**✅ Esperado:**
```javascript
// En la respuesta de Vertex AI debería aparecer:
{
  "treatment_plan": {
    "short_term_goals": [...],
    "long_term_goals": [...],
    "interventions": [...],
    ...
  }
}
```

**❌ Si NO aparece:**
- El modelo no está generando el campo
- Revisar logs del prompt enviado

#### 5.2 Verificar en Network Tab
1. Abrir DevTools → Network
2. Filtrar por "vertexAI" o "analyze"
3. Ver la respuesta del servidor
4. Buscar el campo `treatment_plan` en el JSON

#### 5.3 Verificar en UI
1. Revisar si el plan de tratamiento aparece en la interfaz
2. Verificar formato y completitud

#### 5.4 Verificar Abreviaciones
Buscar en el output generado:
- ❌ "ROM" → ✅ Debería ser "range of motion"
- ❌ "LBP" → ✅ Debería ser "low back pain"
- ❌ "ADLs" → ✅ Debería ser "activities of daily living"
- ❌ "PT" → ✅ Debería ser "physical therapy"

---

## 📋 CHECKLIST DE PRUEBA

### Funcionalidad
- [ ] Servidor carga sin errores
- [ ] Login funciona
- [ ] SOAP se genera sin errores
- [ ] Campo `treatment_plan` aparece en respuesta JSON (consola)
- [ ] Campo `treatment_plan` aparece en respuesta JSON (network)
- [ ] Plan de tratamiento se muestra en UI (si aplica)

### Calidad del Output
- [ ] Plan incluye `short_term_goals`
- [ ] Plan incluye `long_term_goals`
- [ ] Plan incluye `interventions` con estructura completa
- [ ] Plan incluye `patient_education`
- [ ] Plan incluye `home_exercise_program`
- [ ] Plan incluye `follow_up_recommendations`

### Estándares CAPR/CPO
- [ ] No hay "ROM" (debe ser "range of motion")
- [ ] No hay "LBP" (debe ser "low back pain")
- [ ] No hay "ADLs" (debe ser "activities of daily living")
- [ ] No hay "PT" como abreviación (debe ser "physical therapy")
- [ ] Lenguaje profesional y claro

### Errores
- [ ] Sin errores en consola del navegador
- [ ] Sin errores en network requests
- [ ] Sin errores en logs del servidor

---

## 🔍 QUÉ BUSCAR EN LOS LOGS

### En Consola del Navegador

**Logs esperados:**
```
[OK] PromptFactory-Canada ready
[PROMPT] Building professional context from profile: {...}
[PROMPT] Professional context added: ...
```

**Respuesta de Vertex AI:**
```javascript
{
  ok: true,
  text: {
    "medicolegal_alerts": {...},
    "conversation_highlights": {...},
    "recommended_physical_tests": [...],
    "biopsychosocial_factors": {...},
    "treatment_plan": {  // ← ESTE CAMPO DEBE APARECER
      "short_term_goals": [...],
      "long_term_goals": [...],
      "interventions": [...],
      "patient_education": [...],
      "home_exercise_program": [...],
      "follow_up_recommendations": [...]
    }
  }
}
```

**Errores a reportar:**
- `[Parser] JSON malformado` - El JSON viene truncado o malformado
- `[Parser] Parse failed` - El parser no puede procesar la respuesta
- Cualquier error de TypeScript o runtime

### En Network Tab

**Request a Vertex AI:**
- URL: `vertexAIProxy` o similar
- Status: 200 OK
- Response body: Debe contener `treatment_plan`

**Si el status es 400:**
- Revisar el prompt enviado
- Verificar que el JSON del prompt es válido

---

## 📊 RESULTADOS ESPERADOS

### Escenario Ideal ✅
1. SOAP se genera correctamente
2. Campo `treatment_plan` presente en JSON de respuesta
3. Plan completo con todos los subcampos
4. Sin abreviaciones excesivas
5. UI muestra el plan de tratamiento (si está implementado)

### Escenario Parcial ⚠️
1. SOAP se genera correctamente
2. Campo `treatment_plan` presente en JSON de respuesta
3. **PERO** UI no muestra el plan
   - **Causa probable:** Parser no normaliza el campo
   - **Solución:** Actualizar parsers (ver sección "Nota Importante")

### Escenario Problemático ❌
1. SOAP se genera
2. Campo `treatment_plan` **NO** presente en JSON
   - **Causa probable:** Modelo no está siguiendo el prompt
   - **Solución:** Revisar prompt enviado, verificar que las instrucciones se están inyectando

---

## 🚨 ACCIONES INMEDIATAS POST-PRUEBA

### Si el `treatment_plan` NO aparece en JSON:
1. Revisar logs del prompt completo enviado a Vertex AI
2. Verificar que `PROMPT_HEADER` incluye `treatment_plan` en el esquema
3. Verificar que las instrucciones críticas se están inyectando
4. Revisar si hay algún filtro que esté removiendo el campo

### Si el `treatment_plan` aparece en JSON pero NO en UI:
1. Actualizar `responseParser.ts` para incluir `treatment_plan` en `emptyPayload`
2. Actualizar `cleanVertexResponse.ts` para incluir `treatment_plan` en `StructuredPayload`
3. Agregar función de mapeo para normalizar el plan de tratamiento
4. Actualizar componentes UI para mostrar el plan

### Si hay abreviaciones excesivas:
1. Verificar que la sección `LANGUAGE STANDARDS` se está inyectando
2. Reforzar las instrucciones en el prompt
3. Considerar agregar ejemplos negativos (qué NO hacer)

---

## 📝 REPORTE DE PRUEBA

**Por favor, documentar:**

1. **Estado del servidor:** ✅/❌
2. **Generación de SOAP:** ✅/❌
3. **Campo `treatment_plan` en JSON:** ✅/❌
4. **Campo `treatment_plan` en UI:** ✅/❌/N/A
5. **Abreviaciones encontradas:** Lista de abreviaciones encontradas
6. **Errores en consola:** Lista de errores
7. **Screenshots:** Si es posible, capturas de pantalla del SOAP generado

---

## 📞 PRÓXIMOS PASOS

1. **Ejecutar prueba** siguiendo este protocolo
2. **Documentar resultados** en este mismo archivo o crear nuevo
3. **Si hay problemas:** Reportar y actualizar parsers según necesidad
4. **Si todo funciona:** Marcar como completado y proceder con merge a main

---

**FIN DEL PROTOCOLO**



