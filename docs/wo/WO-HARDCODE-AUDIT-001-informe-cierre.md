# WO-HARDCODE-AUDIT-001 — Informe de cierre: Auditoría de lógica médica hardcodeada

**Fecha:** 2025-02-28  
**Estado:** Cerrado con fixes aplicados

---

## Resumen ejecutivo

Se ejecutó la auditoría completa (Paso 1 greps + Paso 3 verificación de `buildFollowUpPrompt`). Se encontraron **dos instancias** en `SOAPPromptFactory.ts` que anclaban salidas de Vertex AI; se aplicaron los fixes en el mismo commit/sesión. El resto de matches son **fuera de alcance** (tests, UI, biblioteca de tests MSK, lógica de filtrado por región).

---

## Paso 1 — Resultados de búsqueda automatizada

### Búsqueda 1: Ejemplos clínicos / dosificación en prompts

| Archivo | Línea | Hallazgo | Acción |
|--------|-------|----------|--------|
| **SOAPPromptFactory.ts** | 309 | `CLINICAL EXAMPLE (Follow-up SOAP Format):` + S/O/A/P ficticio (UCL, grip 8kg, TENS 2x/week, ROM exercises) | ✅ **Eliminado** — bloque completo removido |
| **SOAPPromptFactory.ts** | 529 | Ejemplos en STRUCTURED PLAN: "Quad sets 3x10 daily", "ROM 2x/day", "Ice 15min 3x/day", "Manual therapy to lumbar spine", "quadriceps", "Pain reduction to 3/10", "Return to running" | ✅ **Suavizado** — reemplazado por placeholders "from context" sin valores fijos |
| TranscriptArea.tsx | 246 | "15 minutes" (tip de grabación) | ⚪ UI, no prompt — sin acción |
| FollowUpWorkflowPage.tsx | 665 | Placeholder input "3x/day" | ⚪ UI, no prompt — sin acción |
| useTranscript.ts, useCommandCenter.tsx, ProcessingStatus.tsx | varias | "10-15 minutes" (mensajes UX) | ⚪ Fuera de alcance |
| buildFollowUpPromptV3.test.ts | 69, 72 | "3x/day" en datos de test | ⚪ Tests — permitido |
| **mskTestLibrary.ts** | 339-1041 | Lachman, ACL, meniscal, knee — **definiciones de tests** (nombre, descripción, uso típico) | ⚪ Biblioteca de dominio; no es prompt. Sin acción |
| rails.spec.ts | 143 | "ACL" en input de test de asistente | ⚪ Test — permitido |

### Búsqueda 2: Lógica médica condicional

| Archivo | Hallazgo | Valoración |
|--------|----------|------------|
| **SOAPPromptFactory.ts** | "e.g., lumbar, cervical, shoulder, wrist" (L182, 380) | Instrucción abstracta de qué significa "región"; no condicional. Sin cambio. |
| **SOAPPromptFactory.ts** | "Manual therapy to lumbar spine", "quadriceps" (L527) | ✅ Corregido en Búsqueda 1 (placeholders "from context") |
| ProfessionalWorkflowPage.tsx | `if (combined.includes('lumbar')...)` etc. | Lógica de **filtrado de tests por región** (UI), no generación de texto. Fuera de alcance. |
| testProtocolSelector.ts, mvaTemplateService, KnowledgeBaseService, fuzzyMatch, mskTestLibrary, soapObjectiveRegionValidation.test, testRegionFiltering.test, extractEntities | Detección de región para filtrado/ruteo/tests | No son prompts. Sin acción. |

### Búsqueda 3: Dosificación / ROM / kg en core y services

- **SOAPPromptFactory.ts**: ROM, kg, degrees en **instrucciones de estilo** ("ROM degrees", "strength grades") → **Permitido**. Valores concretos (8kg, 75°, 3x10, 2x/day) formaban parte del ejemplo de follow-up y del STRUCTURED PLAN FORMAT → **Corregidos** (ejemplo eliminado, plan suavizado).
- **mskTestLibrary.ts**, **PhysicalExamResultBuilder.ts**: Unidades (deg, kg) en definiciones de tests y en formateo → Dominio/UI, no prompt.
- **vertex-ai-soap-service.ts**: Regex con `rom|degrees|kg` para detectar contenido clínico → Lógica de decisión, no texto de prompt.
- **sessionComparisonService.ts**, tests en services: Parsing de ROM en notas y datos de prueba → Sin acción.

---

## Paso 3 — buildFollowUpPrompt

- **Antes:** Contenía bloque `CLINICAL EXAMPLE (Follow-up SOAP Format):` con S/O/A/P ficticio (mejora dolor 6/10→3/10, grip 8kg, UCL, TENS 2x/week, ROM exercises, etc.).
- **Después:** Bloque eliminado. Solo quedan reglas de formato, OUTPUT FORMAT (JSON), CONTEXT DATA y restricciones. Sin ejemplos clínicos.

---

## Cambios aplicados (código)

1. **SOAPPromptFactory.ts — buildFollowUpPrompt**  
   - Eliminado el bloque completo desde `CLINICAL EXAMPLE (Follow-up SOAP Format):` hasta el final del ejemplo (P: IN-CLINIC / HEP con ítems concretos), dejando directamente `OUTPUT FORMAT (JSON):`.

2. **SOAPPromptFactory.ts — STRUCTURED PLAN FORMAT (otro flujo/prompt)**  
   - Sustituidos los ejemplos concretos por placeholders genéricos:
     - "Manual therapy to lumbar spine", "Strengthening exercises for quadriceps", "Gait training" → "List specific interventions from context - or None"
     - "Quad sets 3x10 daily", "ROM exercises 2x/day", "Ice 15min 3x/day" → "List specific home exercises and frequency from context - or None"
     - "Pain reduction to 3/10", "Return to running", "Full ROM restoration" → "List measurable treatment goals from context - or To be determined"
     - Y análogo para Modalities, Patient Education, Follow-up, Next Session Focus.

---

## Criterio de cierre — Verificación

| Criterio | Estado |
|----------|--------|
| Greps Paso 1: cero matches en prompts activos (o solo en comentarios/tests) | ✅ Tras fixes, los únicos matches restantes están en UI, tests o biblioteca MSK |
| buildFollowUpPrompt confirmado limpio | ✅ Ejemplo clínico eliminado |
| Instancias adicionales → sub-tickets | ✅ No abiertos; fixes aplicados en el mismo WO |

---

## Recomendación para próximos WO

- Al añadir nuevos prompts (Vertex u otros), **no** incluir ejemplos clínicos con pacientes ficticios ni dosificación/regiones concretas; usar solo instrucciones de estilo y placeholders "from context".
- La biblioteca **mskTestLibrary.ts** es dominio (definiciones de tests): ACL, Lachman, meniscal, etc. son nombres y descripciones de tests reales; no constituyen violación de esta auditoría.

---

**WO-HARDCODE-AUDIT-001** — Cerrado. Estimación real: ~25 min (auditoría + fixes en un solo paso).
