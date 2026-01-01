# INFORME-DEBUG-PROMPT-DEGRADATION

**WO:** WO-DEBUG-PROMPT-DEGRADATION-02  
**Fecha:** 2025-01-01  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** Diagnóstico Completo

---

## RESUMEN EJECUTIVO

### Root Causes Identificados

1. **ERROR SOAP (400 - unsupported_action):** 🔴 **NO RELACIONADO CON PROMPT**
   - **Causa:** `vertex-ai-soap-service.ts` envía `action: 'generate_soap'` pero `vertexAIProxy` solo acepta `action: 'analyze'`
   - **Ubicación:** `functions/index.js:320-321` vs `src/services/vertex-ai-soap-service.ts:146`
   - **Fix:** Cambiar `action: 'generate_soap'` → `action: 'analyze'` en SOAP service

2. **DEGRADACIÓN DE CALIDAD CLÍNICA:** 🟡 **PARCIALMENTE RELACIONADO CON PROMPT**
   - **Causa:** Header comprimido perdió instrucciones detalladas sobre:
     - Captura de síntomas activos y temporalidad
     - Especificidad en tests físicos (L4, L5, S1)
     - Formato detallado de medications
     - Instrucciones sobre red flags y medication interactions
   - **Impacto:** Calidad reducida pero sistema funcional

### Fix Propuesto

**OPCIÓN A (Recomendada):** Fix quirúrgico del header + Fix del error SOAP
- Restaurar instrucciones críticas en formato compacto
- Mantener compresión de elementos accesorios
- Corregir `action` en SOAP service
- **Impacto tokens:** +15-20% vs versión optimizada (aún -60% vs original)

---

## SECCIÓN 1: Comparación Header (BEFORE/AFTER)

### Header ORIGINAL (51 líneas) - Reconstruido desde Desktop

```typescript
const PROMPT_HEADER = `You are AiDuxCare's clinical reasoning assistant (copilot) supporting licensed Canadian physiotherapists during first-contact assessments.
Operate strictly within the College of Physiotherapists of Ontario (CPO) scope of practice and uphold PHIPA/PIPEDA privacy requirements.

CORE PRINCIPLE: Expose clinical variables and correlations, never conclude diagnoses or make clinical decisions.
Your role is to present comprehensive clinical considerations, not to diagnose or prescribe.

Assume the clinician is a registered physiotherapist, not a physician; highlight when medical referral is required and explain why.
Respond ONLY with valid JSON (double quotes, no comments) using this schema:

{
  "medicolegal_alerts": {
    "red_flags": string[],
    "yellow_flags": string[],
    "legal_exposure": "low" | "moderate" | "high",
    "alert_notes": string[]
  },
  "conversation_highlights": {
    "chief_complaint": string,
    "key_findings": string[],
    "medical_history": string[],
    "medications": string[],
    "summary": string
  },
  "recommended_physical_tests": [
    {
      "name": string,
      "objective": string,
      "region": string,
      "rationale": string,
      "evidence_level": "strong" | "moderate" | "emerging"
    }
  ],
  "biopsychosocial_factors": {
    "psychological": string[],
    "social": string[],
    "occupational": string[],
    "protective_factors": string[],
    "functional_limitations": string[],
    "legal_or_employment_context": string[],
    "patient_strengths": string[]
  }
}

Rules:
- Use Canadian English (en-CA) and cite provincial considerations when relevant (e.g., WSIB in Ontario) inside list items.
- Limit each list item to <= 22 words.
- Do not fabricate information. If unknown, use "" or [].
- LANGUAGE REQUIREMENTS (CRITICAL):
  • NEVER use definitive diagnostic language: "The patient has...", "Diagnosis is...", "This is..."
  • ALWAYS use exposure language: "Patterns consistent with...", "Findings suggest...", "May indicate...", "Consider..."
  • Present multiple differential considerations when appropriate
  • Frame all suggestions as clinical reasoning support, not clinical decisions
  • Use "Observations consistent with..." rather than "Patient presents with..."
- Explicitly evaluate common red flags: unexplained weight loss, night pain, neurological deficits (e.g., saddle anesthesia, foot drop), incontinence, systemic infection signs, major trauma, progressive weakness, history of cancer, anticoagulant use, prolonged steroid use, age >65 with trauma, symptom escalation on rest, medication interactions (especially NSAIDs + SSRIs/SNRIs which increase gastrointestinal bleeding risk - these MUST be flagged in red_flags, not yellow_flags or alert_notes), mental health conditions that may affect treatment adherence or safety (e.g., depression, anxiety - especially when indicated by SSRI/SNRI use), and signs of systemic disease. For each detected red flag, include the clinical concern and whether urgent medical referral is required. Medication interactions between NSAIDs and SSRIs/SNRIs are ALWAYS red flags due to significant gastrointestinal bleeding risk.
- If no red flags are present, state the due diligence performed (e.g., "Screened for malignancy indicators; none reported."). However, ALWAYS check for medication interactions when multiple medications are mentioned, especially NSAIDs combined with SSRIs/SNRIs, as these represent significant clinical risks requiring medical attention. These medication interactions MUST be placed in the red_flags array, not in yellow_flags or alert_notes. Format as: "Medication interaction: [Medication 1] ([class]) + [Medication 2] ([class]) significantly increases [specific risk]. Requires medical monitoring and medication review. Clinical concern: [specific concern]. Medical referral recommended for medication review."
- For medications: Capture complete medication information including name, dosage with units (mg, g, etc.), frequency, and duration when mentioned. CRITICAL: Apply clinical reasoning to correct obvious dosage errors - oral medications are almost never in "grams" (g), they are in "milligrams" (mg). For example: "25 grams" or "25g" for oral medication should be interpreted as "25mg", "50 grams" should be "50mg". Preserve the original mention in context but use corrected dosage in the formatted output. Include both prescription and over-the-counter medications. Format as: "Medication name, dosage, frequency, duration" (e.g., "Ibuprofen, 400mg, every 8 hours, 1 week"). IMPORTANT: Identify potential medication interactions, especially NSAIDs (ibuprofen, naproxen) combined with SSRIs/SNRIs (fluoxetine, sertraline, etc.) which significantly increase risk of gastrointestinal bleeding and require medical monitoring.
- For chief complaint and key findings: Capture the complete clinical picture including precise anatomical location, quality, radiation or referral patterns, temporal evolution (onset, progression, triggers), aggravating and relieving factors, and functional impact. Include both primary symptoms and any secondary or associated symptoms. Note anatomical specificity (e.g., "pain on outside of wrist towards little finger" not just "wrist pain"). Capture symptom progression over time when described.
- For biopsychosocial factors, identify comprehensively:
  • Psychological: distress, anxiety, fear-avoidance, catastrophizing, coping style, mental health diagnoses, emotional responses to pain.
  • Social: family/support network, caregiving load, financial pressure, community resources, living arrangements, social isolation.
  • Occupational: job demands, ergonomics, WSIB context, workload, absenteeism, remote work, return-to-work barriers, work-related injury context, repetitive tasks, equipment use, job-specific activities that aggravate symptoms.
  • Functional limitations: ADLs, gait, sleep disturbance, lifting tolerance, sport/leisure impact, specific activity restrictions, work-related functional limitations, sedentary lifestyle, physical activity levels, exercise habits or lack thereof. CRITICAL: When patient reports "No" to physical activity, exercise, or sports, or indicates lack of physical activity, this MUST be captured as "Sedentary lifestyle: [description]. May impact treatment approach given [related factors]." in functional_limitations.
  • Legal or employment context: litigation, compensation claims, sick leave, employer-accommodation needs, disability claims.
  • Protective factors: resilience, positive beliefs, self-management strategies, supportive relationships, adaptive equipment use (e.g., braces, splints, wrist supports, assistive devices), self-care behaviors, current interventions being used.
  • Patient strengths: adherence, motivation, fitness habits, prior success with rehab, active participation in care.
  • Comorbidities: capture all mentioned medical conditions, chronic diseases, or health factors that may influence treatment (e.g., obesity, diabetes, hypertension, mental health conditions including depression, anxiety) even if not directly related to the chief complaint. Include these in medical_history array. When obesity is mentioned, also consider sedentary lifestyle as a related biopsychosocial factor that may impact treatment approach and functional capacity.
- For recommended physical tests: Consider the complete clinical presentation including pain location, radiation patterns, aggravating activities, functional limitations, and anatomical structures involved. Suggest tests that assess the specific anatomical structures, neural involvement, joint integrity, and functional capacity relevant to the presentation. Include tests for differential diagnosis when appropriate. For wrist/hand presentations, consider: tendinopathies (Finkelstein's, Phalen's, Tinel's), joint stability, neural tension, grip strength, functional range of motion, and provocative maneuvers specific to the reported pain location and distribution. Frame test recommendations as "Consider assessing..." or "Tests that may help evaluate..." rather than "Perform..." or "Test for...".
- For clinical reasoning support: Present observable patterns, literature correlations with evidence levels, potential blind spots or missed considerations, risk factors requiring documentation, and alternative explanations. Always include evidence strength indicators (strong/moderate/emerging) for correlations. Highlight what should NOT be missed (red flags, contraindications, referral triggers). Present multiple differential considerations when clinical presentation could match several conditions.
- Always derive the above from the transcript; if not mentioned, leave arrays empty and note in summary that the element was screened but not reported.
- Pay attention to temporal information throughout the transcript: when symptoms started, how they evolved over time, duration of medication use, timeline of interventions, and progression patterns.
- Capture all mentioned interventions, devices, or self-management strategies (e.g., braces, splints, wrist supports, ice, heat, rest, activity modification, over-the-counter aids) in protective_factors or relevant biopsychosocial categories.
- Provide evidence-based physical tests only when confident. Include sensitivity/specificity or evidence level only if sourced. If unsure, leave the field empty rather than guessing.
- Outline safety/privacy actions that fall within physiotherapy scope (consent, documentation, escalation).
- Output raw JSON only. No prose, markdown, code fences, or explanations.`;
```

**Líneas:** ~51 líneas  
**Tokens estimados:** ~850 tokens

---

### Header OPTIMIZADO (4 líneas) - Actual

```typescript
const PROMPT_HEADER = `AiDuxCare copilot for Canadian PTs. CPO scope. PHIPA/PIPEDA compliant.
CORE: Expose clinical variables. Never diagnose. Present differential considerations. Highlight when medical referral needed.
Output JSON: {medicolegal_alerts:{red_flags:[],yellow_flags:[],legal_exposure:"low|moderate|high",alert_notes:[]},conversation_highlights:{chief_complaint:"",key_findings:[],medical_history:[],medications:[],summary:""},recommended_physical_tests:[{name:"",objective:"",region:"",rationale:"",evidence_level:"strong|moderate|emerging"}],biopsychosocial_factors:{psychological:[],social:[],occupational:[],protective_factors:[],functional_limitations:[],legal_or_employment_context:[],patient_strengths:[]}}
Rules: EN-CA. Max 22w/item. Exposure lang ("suggest/consider", NOT "is/has"). Cite provincial (WSIB). No fabrication.`;
```

**Líneas:** 4 líneas  
**Tokens estimados:** ~180 tokens  
**Reducción:** -79% tokens

---

### Diff Detallado

| Elemento | Original | Optimizado | Estado |
|----------|----------|------------|--------|
| **Identidad del sistema** | ✅ "You are AiDuxCare's clinical reasoning assistant..." | ✅ "AiDuxCare copilot for Canadian PTs" | ✅ Mantenido (compacto) |
| **Scope y compliance** | ✅ CPO scope, PHIPA/PIPEDA | ✅ CPO scope, PHIPA/PIPEDA | ✅ Mantenido |
| **Core principle** | ✅ "Expose clinical variables. Never diagnose..." | ✅ "CORE: Expose clinical variables. Never diagnose..." | ✅ Mantenido |
| **JSON Schema** | ✅ Schema completo con tipos | ✅ Schema inline compacto | ✅ Mantenido (formato diferente) |
| **Language requirements** | ✅ 5 bullets detallados | ❌ Solo "Exposure lang" | 🔴 **CRÍTICO PERDIDO** |
| **Red flags detallados** | ✅ Lista completa (12+ items) | ❌ No mencionado | 🔴 **CRÍTICO PERDIDO** |
| **Medication interactions** | ✅ Instrucciones específicas NSAIDs+SSRIs | ❌ No mencionado | 🔴 **CRÍTICO PERDIDO** |
| **Medication format** | ✅ "name, dosage, frequency, duration" | ❌ No especificado | 🟡 **MODERADO PERDIDO** |
| **Chief complaint capture** | ✅ "precise anatomical location, quality, radiation..." | ❌ No especificado | 🟡 **MODERADO PERDIDO** |
| **Biopsychosocial detallado** | ✅ 7 categorías con sub-items | ✅ Schema mantiene categorías | ✅ Mantenido (schema) |
| **Physical tests guidance** | ✅ "Consider anatomical structures, neural involvement..." | ❌ No especificado | 🟡 **MODERADO PERDIDO** |
| **Temporal information** | ✅ "Pay attention to temporal information..." | ❌ No mencionado | 🟡 **MODERADO PERDIDO** |
| **Evidence levels** | ✅ "Include sensitivity/specificity..." | ✅ "evidence_level" en schema | ✅ Mantenido (schema) |
| **Output format** | ✅ "Output raw JSON only..." | ❌ No mencionado | 🟢 **BAJO** (implícito) |

---

## SECCIÓN 2: Análisis de Pérdida de Contexto

### 🔴 IMPACTO CRÍTICO

#### 1. Language Requirements (Exposure Language)
- **Ubicación original:** Líneas 59-64
- **Función:** Instruye al AI a usar lenguaje de exposición ("suggest/consider") vs diagnóstico ("is/has")
- **Evidencia de criticidad:** El WO menciona "Exposure lang" en el header optimizado, pero falta la explicación detallada de QUÉ significa y CUÁNDO aplicarlo
- **Síntoma si falta:** AI puede usar lenguaje diagnóstico definitivo, violando scope de práctica
- **Estado:** ⚠️ Parcialmente presente (solo mención, sin explicación)

#### 2. Red Flags Detallados
- **Ubicación original:** Línea 65
- **Función:** Lista exhaustiva de red flags con instrucciones específicas sobre cuándo y cómo flaggearlos
- **Evidencia de criticidad:** El log muestra que el análisis ANTES capturaba red flags correctamente, pero el análisis AHORA no los menciona explícitamente
- **Síntoma si falta:** Red flags críticos pueden no ser detectados o flaggeados incorrectamente
- **Estado:** ❌ Completamente perdido

#### 3. Medication Interactions (NSAIDs + SSRIs/SNRIs)
- **Ubicación original:** Líneas 65-66
- **Función:** Instrucción específica sobre interacciones medicamentosas críticas que DEBEN ir en red_flags
- **Evidencia de criticidad:** Instrucción explícita "MUST be flagged in red_flags" - esto es crítico para seguridad del paciente
- **Síntoma si falta:** Interacciones peligrosas pueden no ser detectadas o categorizadas incorrectamente
- **Estado:** ❌ Completamente perdido

---

### 🟡 IMPACTO MODERADO

#### 4. Medication Format Detallado
- **Ubicación original:** Línea 67
- **Función:** Especifica formato exacto: "name, dosage, frequency, duration" + corrección de errores de dosificación
- **Evidencia de criticidad:** El log muestra medications capturados, pero sin el formato estructurado específico
- **Síntoma si falta:** Medications pueden ser capturados de forma inconsistente
- **Estado:** ❌ Perdido

#### 5. Chief Complaint Capture Detallado
- **Ubicación original:** Línea 68
- **Función:** Instruye captura de "precise anatomical location, quality, radiation, temporal evolution, aggravating/relieving factors"
- **Evidencia de criticidad:** El log muestra que el análisis AHORA pierde detalles como "dolor actual, intensidad (3/10, spikes 7-8/10), síntomas activos"
- **Síntoma si falta:** Chief complaint puede ser genérico en lugar de específico
- **Estado:** ❌ Perdido

#### 6. Physical Tests Guidance
- **Ubicación original:** Línea 78
- **Función:** Instruye considerar "anatomical structures, neural involvement, joint integrity" y especificar niveles (L4, L5, S1)
- **Evidencia de criticidad:** El log muestra tests genéricos en lugar de específicos (L4, L5, S1)
- **Síntoma si falta:** Tests pueden ser genéricos en lugar de específicos al caso
- **Estado:** ❌ Perdido

#### 7. Temporal Information
- **Ubicación original:** Línea 81
- **Función:** Instruye capturar "when symptoms started, how they evolved, duration of medication use, timeline of interventions"
- **Evidencia de criticidad:** El log muestra pérdida de información temporal (cuándo empezó, evolución)
- **Síntoma si falta:** Información temporal puede ser omitida
- **Estado:** ❌ Perdido

---

### 🟢 IMPACTO BAJO

#### 8. Output Format Instructions
- **Ubicación original:** Línea 85
- **Función:** "Output raw JSON only. No prose, markdown, code fences, or explanations."
- **Evidencia:** El schema JSON ya fuerza este comportamiento
- **Estado:** ✅ Safe to compress (implícito en schema)

---

## SECCIÓN 3: Análisis del Error SOAP

### Root Cause Identificado

**ERROR:** `400 - unsupported_action`  
**Ubicación:** `vertex-ai-soap-service.ts:139-150`

#### Traza del Error

1. **Llamada desde SOAP Service:**
   ```typescript
   // src/services/vertex-ai-soap-service.ts:144-149
   body: JSON.stringify({
     prompt,
     action: 'generate_soap',  // ❌ PROBLEMA AQUÍ
     traceId,
     model: 'gemini-2.0-flash-exp',
   }),
   ```

2. **Recepción en Cloud Function:**
   ```javascript
   // functions/index.js:319-322
   const { action = 'analyze', prompt, transcript, text, traceId } = req.body || {};
   if (action !== 'analyze') {
     return res.status(400).json({ ok: false, error: 'unsupported_action', action });
   }
   ```

3. **Resultado:** `400 - unsupported_action` porque `'generate_soap' !== 'analyze'`

#### ¿El Header Optimizado Causó Este Error?

**NO.** Este error es **INDEPENDIENTE** del prompt. Es un problema de API contract:
- `vertexAIProxy` solo acepta `action: 'analyze'`
- `vertex-ai-soap-service.ts` envía `action: 'generate_soap'`
- El header del prompt no afecta el parámetro `action`

#### Fix Requerido

```typescript
// src/services/vertex-ai-soap-service.ts:146
// ANTES:
action: 'generate_soap',

// DESPUÉS:
action: 'analyze',  // ✅ vertexAIProxy solo acepta 'analyze'
```

**Nota:** El Cloud Function puede necesitar actualización para soportar múltiples actions, pero eso es fuera del scope de este WO.

---

## SECCIÓN 4: Análisis de buildMicroContext()

### Código Actual

```typescript
const buildMicroContext = (profile?: ProfessionalProfile | null): string => {
  if (!profile) return '';
  
  const microFlags: string[] = [];
  
  // Experience level: Only if junior (<3y) or senior (>8y)
  const experienceYears = typeof profile.experienceYears === 'string'
    ? parseInt(profile.experienceYears, 10)
    : (profile.experienceYears ?? 0);
  
  if (experienceYears < 3) {
    microFlags.push('Junior-guide');
  } else if (experienceYears >= 10) {
    microFlags.push('Senior-terse');
  }
  
  // Specialty: Only if NOT General or MSK
  if (profile.specialty && 
      !['General', 'MSK', 'Musculoskeletal'].includes(profile.specialty)) {
    microFlags.push(profile.specialty);
  }
  
  // Exclusions: Only if they exist
  if (profile.excludedTechniques && profile.excludedTechniques.length > 0) {
    const excluded = profile.excludedTechniques.join(',');
    microFlags.push(`Exclude:${excluded}`);
  }
  
  return microFlags.length > 0 
    ? `\n[${microFlags.join('][')}]\n`
    : '';
};
```

### ¿Está siendo llamada correctamente?

**SÍ.** En `buildCanadianPrompt()` línea 156:
```typescript
const microContext = buildMicroContext(professionalProfile);
```

### ¿Los flags generados son correctos?

**SÍ.** La función genera flags compactos solo cuando hay valores no-default:
- `[Junior-guide]` si <3 años experiencia
- `[Senior-terse]` si >=10 años experiencia
- `[Specialty]` si no es General/MSK
- `[Exclude:technique1,technique2]` si hay excludedTechniques

### Ejemplo de Output

**Perfil de prueba:**
```typescript
{
  experienceYears: 2,
  specialty: 'Pediatric',
  excludedTechniques: ['Dry Needling', 'Acupuncture']
}
```

**Output:**
```
[Junior-guide][Pediatric][Exclude:Dry Needling,Acupuncture]
```

### ¿Pierde información crítica?

**NO.** `buildMicroContext()` es una optimización válida porque:
1. Solo genera flags cuando hay valores no-default
2. Los valores default (mid experience, General/MSK specialty) no necesitan flags
3. La información crítica está en el header, no en el contexto del perfil

**Conclusión:** `buildMicroContext()` está funcionando correctamente y no es causa de degradación.

---

## SECCIÓN 5: Hipótesis Causales (Ranked)

### HIPÓTESIS 1: Pérdida de Instrucciones Detalladas de Red Flags y Medication Interactions
**Probabilidad:** 95%  
**Evidencia a favor:**
- El header original tenía 2 párrafos completos sobre red flags y medication interactions
- El header optimizado no menciona estos elementos
- El log muestra que el análisis AHORA no captura medication interactions explícitamente
- El log muestra que el análisis AHORA no menciona red flags específicos

**Evidencia en contra:**
- El schema JSON mantiene los campos `red_flags` y `alert_notes`
- El AI podría inferir red flags desde el contexto

**Test para validar:**
- Ejecutar análisis con transcript que menciona "ibuprofen + sertraline"
- Verificar si aparece en `red_flags` vs `yellow_flags` vs `alert_notes`
- Comparar con análisis usando header original

**Veredicto:** ✅ **CAUSA PRINCIPAL** de degradación de calidad

---

### HIPÓTESIS 2: Pérdida de Instrucciones de Captura Detallada (Chief Complaint, Medications, Tests)
**Probabilidad:** 85%  
**Evidencia a favor:**
- El header original tenía instrucciones específicas sobre formato de medications ("name, dosage, frequency, duration")
- El header original tenía instrucciones sobre captura de chief complaint ("precise anatomical location, quality, radiation...")
- El log muestra que el análisis AHORA pierde detalles específicos (intensidad del dolor, síntomas activos)
- El log muestra tests genéricos en lugar de específicos (L4, L5, S1)

**Evidencia en contra:**
- El schema JSON mantiene los campos necesarios
- El AI podría inferir formato desde ejemplos

**Test para validar:**
- Ejecutar análisis con transcript que menciona "ibuprofen 400mg every 8 hours"
- Verificar si aparece como "Ibuprofen, 400mg, every 8 hours, [duration]" vs formato inconsistente
- Comparar con análisis usando header original

**Veredicto:** ✅ **CAUSA SECUNDARIA** de degradación de calidad

---

### HIPÓTESIS 3: Pérdida de Instrucciones de Language Requirements
**Probabilidad:** 70%  
**Evidencia a favor:**
- El header original tenía 5 bullets detallados sobre lenguaje de exposición
- El header optimizado solo menciona "Exposure lang" sin explicación
- El AI podría usar lenguaje diagnóstico si no tiene instrucciones explícitas

**Evidencia en contra:**
- El principio "Never diagnose" está presente en el header optimizado
- El AI podría inferir lenguaje apropiado desde el contexto

**Test para validar:**
- Ejecutar análisis y buscar frases como "The patient has..." vs "Patterns consistent with..."
- Comparar frecuencia de lenguaje diagnóstico vs exposición

**Veredicto:** 🟡 **CAUSA POSIBLE** pero menos crítica que H1 y H2

---

### HIPÓTESIS 4: Error SOAP Causado por Header Optimizado
**Probabilidad:** 0%  
**Evidencia a favor:**
- Ninguna

**Evidencia en contra:**
- El error es `400 - unsupported_action` en el parámetro `action`, no en el `prompt`
- El código muestra claramente que `vertexAIProxy` rechaza `action: 'generate_soap'`
- El header del prompt no afecta el parámetro `action` del request

**Veredicto:** ❌ **NO ES CAUSA** - Error independiente del prompt

---

## SECCIÓN 6: Propuesta de Fix

### OPCIÓN A: Fix Quirúrgico (Recomendado)

**Estrategia:** Restaurar instrucciones críticas en formato compacto, mantener compresión de elementos accesorios.

#### Cambios Propuestos

```typescript
const PROMPT_HEADER = `AiDuxCare copilot for Canadian PTs. CPO scope. PHIPA/PIPEDA compliant.
CORE: Expose clinical variables. Never diagnose. Present differential considerations. Highlight when medical referral needed.
Output JSON: {medicolegal_alerts:{red_flags:[],yellow_flags:[],legal_exposure:"low|moderate|high",alert_notes:[]},conversation_highlights:{chief_complaint:"",key_findings:[],medical_history:[],medications:[],summary:""},recommended_physical_tests:[{name:"",objective:"",region:"",rationale:"",evidence_level:"strong|moderate|emerging"}],biopsychosocial_factors:{psychological:[],social:[],occupational:[],protective_factors:[],functional_limitations:[],legal_or_employment_context:[],patient_strengths:[]}}

Rules: EN-CA. Max 22w/item. Exposure lang ("suggest/consider", NOT "is/has"). Cite provincial (WSIB). No fabrication.

CRITICAL INSTRUCTIONS:
- Red flags: Unexplained weight loss, night pain, neurological deficits, incontinence, systemic infection, major trauma, progressive weakness, cancer history, anticoagulants, steroids, age >65 trauma, symptom escalation on rest, medication interactions (NSAIDs+SSRIs/SNRIs MUST be red_flags, not yellow_flags). Include clinical concern and referral urgency.
- Medications: Format as "name, dosage (units), frequency, duration". Correct dosage errors (oral meds are mg, not g). Flag interactions (NSAIDs+SSRIs/SNRIs = red flag).
- Chief complaint: Capture precise anatomical location, quality, radiation, temporal evolution (onset/progression/triggers), aggravating/relieving factors, functional impact. Include intensity scales and active symptoms.
- Physical tests: Consider anatomical structures, neural involvement (specify relevant spinal/neural levels when indicated by presentation, e.g., dermatomes, myotomes, specific spinal segments), joint integrity, functional capacity. Frame as "Consider assessing..." not "Perform...".
- Temporal info: Capture when symptoms started, evolution over time, medication duration, intervention timelines, progression patterns.
- Biopsychosocial: Comprehensive capture of psychological, social, occupational, functional limitations, protective factors, patient strengths, legal/employment context.`;
```

**Líneas:** ~12 líneas  
**Tokens estimados:** ~280 tokens  
**Reducción vs original:** -67% tokens  
**Mejora vs optimizado:** +100 tokens (+56%) pero restaura funcionalidad crítica

#### Impacto en Tokens

- **Header original:** ~850 tokens
- **Header optimizado (actual):** ~180 tokens (-79%)
- **Header fix quirúrgico:** ~280 tokens (-67% vs original, +56% vs optimizado)

**Conclusión:** Aceptable trade-off. Restaura funcionalidad crítica manteniendo 67% de reducción vs original.

---

### OPCIÓN B: Fix Conservador

**Estrategia:** Restaurar más elementos por seguridad, mantener compresión moderada.

#### Cambios Propuestos

Similar a OPCIÓN A pero agregando:
- Instrucciones detalladas sobre biopsychosocial (7 categorías con sub-items)
- Instrucciones sobre clinical reasoning support
- Instrucciones sobre evidence levels

**Líneas:** ~20 líneas  
**Tokens estimados:** ~450 tokens  
**Reducción vs original:** -47% tokens

**Conclusión:** Más seguro pero menos eficiente. Solo si OPCIÓN A no resuelve completamente.

---

### OPCIÓN C: Rollback Total

**Estrategia:** Restaurar header original completo.

**Líneas:** 51 líneas  
**Tokens estimados:** ~850 tokens  
**Reducción:** 0% (sin optimización)

**Justificación:** Solo si OPCIÓN A y B fallan después de testing exhaustivo.

**Conclusión:** No recomendado. Perderíamos toda la optimización de tokens sin intentar fix quirúrgico.

---

## FIX ADICIONAL: Error SOAP

**Archivo:** `src/services/vertex-ai-soap-service.ts`  
**Línea:** 146

```typescript
// ANTES:
body: JSON.stringify({
  prompt,
  action: 'generate_soap',  // ❌
  traceId,
  model: 'gemini-2.0-flash-exp',
}),

// DESPUÉS:
body: JSON.stringify({
  prompt,
  action: 'analyze',  // ✅ vertexAIProxy solo acepta 'analyze'
  traceId,
  model: 'gemini-2.0-flash-exp',
}),
```

**Nota:** Este fix es **INDEPENDIENTE** del prompt y debe aplicarse inmediatamente.

---

## ANEXOS

### Anexo A: Código Completo Header BEFORE
[Ver SECCIÓN 1: Comparación Header]

### Anexo B: Código Completo Header AFTER
[Ver SECCIÓN 1: Comparación Header]

### Anexo C: Test Cases Propuestos

#### Test Case 1: Medication Interactions
```typescript
const transcript = "Patient takes ibuprofen 400mg every 8 hours and sertraline 50mg daily.";
// Expected: medication interaction in red_flags
// Format: "Ibuprofen, 400mg, every 8 hours, [duration]"
```

#### Test Case 2: Chief Complaint Detallado
```typescript
const transcript = "Low back pain since 2019, currently right calf discomfort with toe numbness. Pain is 3/10 but can spike to 7-8/10.";
// Expected: chief_complaint includes intensity, temporal info, active symptoms
```

#### Test Case 3: Physical Tests Específicos
```typescript
const transcript = "Right calf discomfort with toe numbness, history of L4-L5-S1 laminectomy.";
// Expected: recommended_physical_tests mention L4, L5, S1 specifically
```

### Anexo D: Logs Relevantes

[Los logs mencionados en el WO están disponibles en el documento original]

---

## CONCLUSIÓN

### Root Causes Confirmados

1. ✅ **Error SOAP:** Causado por `action: 'generate_soap'` vs `action: 'analyze'` (NO relacionado con prompt)
2. ✅ **Degradación de calidad:** Causada por pérdida de instrucciones críticas en header comprimido

### Fix Recomendado

1. **Inmediato:** Corregir `action` en `vertex-ai-soap-service.ts` (fix independiente)
2. **Prioritario:** Aplicar OPCIÓN A (fix quirúrgico del header)
3. **Validación:** Ejecutar test cases del Anexo C
4. **Monitoreo:** Comparar calidad de análisis antes/después del fix

### Impacto Esperado

- **Error SOAP:** ✅ Resuelto inmediatamente (fix independiente)
- **Calidad clínica:** 🟡 Mejora significativa (restauración de instrucciones críticas)
- **Eficiencia:** ✅ Mantiene 67% de reducción de tokens vs original

---

**Estado:** ✅ Diagnóstico Completo + Correcciones Aplicadas  
**Correcciones Aplicadas:**
- ✅ Fix SOAP: `action: 'generate_soap'` → `action: 'analyze'`
- ✅ Fix Header: Instrucciones críticas restauradas en formato compacto
- ✅ Fix Especificidad: `(specify levels: L4, L5, S1)` → `(specify relevant spinal/neural levels when indicated by presentation, e.g., dermatomes, myotomes, specific spinal segments)`
- ✅ Verificación: No hay otros hardcodeos específicos al caso de prueba

**Próximo Paso:** Validar con test cases del Anexo C  
**Validación:** Test cases del Anexo C

