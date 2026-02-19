# WO-SOAP-UX-02: Narrative Integrity + Invisible Validation Layer

**Status:** Implemented  
**Principle:** El clínico escribe en narrativa. El sistema valida en silencio.

---

## Implementación

### 1. Backend – Validación invisible

**Archivo:** `src/services/soap/soapInvisibleValidation.ts`

- `runInvisibleValidation(soap, context)` — post-generate, nunca visible al usuario
- Coherencia región-evaluación (tested vs mentioned)
- Desviación de longitud por sección (soft, no bloquea)
- Detección de redundancia semántica
- Señalización interna si SOAP rompe guidelines
- Integrado en `vertex-ai-soap-service.ts` — resultado en `metadata.invisibleValidation`

### 2. Prompt – Concisión disciplinada

**Archivo:** `src/core/soap/SOAPPromptFactory.ts`

Reglas añadidas a Initial y Follow-up prompts:

- "Use concise clinical language."
- "Avoid repetition."
- "Avoid verbose narrative."
- "Limit each section to clinically necessary content."
- "Do not restate lab values unless clinically relevant."

### 3. Métricas – NCR + Section Length Deviation

**Archivo:** `src/services/telemetry/telemetrySession.ts`

- `recordNarrativeMetrics(metrics)` — NCR y sectionLengthDeviation
- NCR = `finalSoapChars / originalTranscriptChars`
- Llamado desde `handleFinalizeSOAP` en ProfessionalWorkflowPage
- Campos en `telemetry_sessions`: `narrativeCompressionRatio`, `sectionLengthDeviation`, `originalTranscriptChars`, `finalSoapChars`

### 4. UX – Cero checklist

**Auditoría (confirmada):**

- ✅ No se introducen nuevos checklists
- ✅ No se introducen contadores visibles de palabras
- ✅ No se introducen validaciones intrusivas
- ✅ SOAPEditor mantiene indicadores S/O/A/P (completitud) — existentes pre-WO; son cues de completitud, no validación. Documentado en SOAPEditor.tsx

---

## DoD

| Criterio | Estado |
|---------|--------|
| Coherencia región-evaluación ≥95% (medida internamente) | ✅ |
| No exceder 30% guideline length (soft, no bloquea) | ✅ |
| Sin duplicación semántica evidente (detección interna) | ✅ |
| Estructura clásica S/O/A/P | ✅ |
| Sin checklist UI nuevo | ✅ |
| Fisio: generar → leer → editar → finalizar sin fricción | ✅ |

---

## Archivos modificados

- `src/services/soap/soapInvisibleValidation.ts` (nuevo)
- `src/services/vertex-ai-soap-service.ts`
- `src/core/soap/SOAPPromptFactory.ts`
- `src/services/telemetry/telemetrySession.ts`
- `src/pages/ProfessionalWorkflowPage.tsx`
