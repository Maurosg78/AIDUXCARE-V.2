# Qué alimenta cada consulta a Vertex — Initial vs Follow-up

Documento de referencia para el piloto: **cada vía es distinta** y se alimenta de forma distinta. Tener esto claro es clave para estabilizar el piloto.

---

## Resumen en una frase

- **Initial**: análisis estructurado (4 bloques editables) → evaluación física → SOAP.
- **Follow-up**: actualización de condición → **solo SOAP** (con progresiones del plan; el plan *está diseñado para convertirse* en baseline del próximo follow-up — feature post-piloto). Sin bloques intermedios ni mapeo a highlights/evaluaciones físicas.

---

## 1. Consulta Vertex — Initial Assessment

### Qué alimenta la consulta (inputs)

| Input | Origen | Uso |
|------|--------|-----|
| **Transcript** | Grabación/dictado de la sesión (y/o texto) | Contenido clínico a extraer |
| **Professional profile** | Perfil del profesional (especialidad, licencia, etc.) | Contexto para el prompt |
| **Attachments** (opcional) | PDFs, imágenes clínicas | Hallazgos de imagen/lab para integrar |
| **Visit type** | `initial` | Instrucción: evaluación clínica comprehensiva |

### Qué hace Vertex (instrucción)

- Analizar el transcript y **extraer información clínica relevante**.
- Devolver un **JSON estructurado** para **edición en 4 bloques** antes de pasar a evaluación física:
  - `medicolegal_alerts` (red_flags, yellow_flags, legal_exposure)
  - `conversation_highlights` (chief_complaint, key_findings, medications, summary)
  - `recommended_physical_tests`
  - `biopsychosocial_factors`

### Qué pasa después (flujo)

1. La respuesta se **mapea y muestra en 4 bloques editables** (alerts, highlights, tests sugeridos, biopsicosocial).
2. El clínico **edita** esos bloques.
3. Se pasa a **evaluación física** (tests realizados).
4. Con transcript + análisis editado + resultados de evaluación física se construye el **contexto SOAP** y se llama a Vertex para **generar el SOAP** del initial assessment.

### Referencia en código

- **Prompt**: `PromptFactory-Canada` + `visitType: 'initial'`, instrucción tipo *"Analyze the following transcript and extract relevant clinical information"*.
- **Proxy**: `analyzeWithVertexProxy` → `processWithNiagara` (mismo endpoint “analyze” con `visitType`).
- **Normalización**: respuesta JSON → `normalizeVertexResponse` → `ClinicalAnalysis` (niagaraResults).
- **SOAP**: `buildInitialAssessmentPrompt(context)` con contexto = transcript + analysis + physicalExamResults.

---

## 2. Consulta Vertex — Follow-up

### Qué alimenta la consulta (inputs)

La consulta de follow-up **no debe** usar el mismo flujo que initial (no “analyze” que devuelve highlights/tests en 4 bloques). Debe alimentarse de:

| Input | Origen | Uso |
|------|--------|-----|
| **Baseline** | SOAP/plan de la visita anterior (assessment + plan) | Continuidad clínica y progresiones |
| **Actualización clínica de hoy** | Transcript / feedback de esta sesión | Cambios, progreso, tolerancia, HEP en casa |
| **Qué se hizo en sesión (in-clinic)** | Checklist in-clinic (opcional) | Actividades realizadas hoy |
| **HEP prescrito** | Plan previo (opcional) | Lo que el paciente tiene para casa |
| **Cumplimiento HEP** | Lo que el paciente reporta hacer en casa (opcional) | Adherencia |

### Qué hace Vertex (instrucción)

- **Actualizar la condición** del paciente (no re-evaluar desde cero).
- **Progresiones de la pauta de tratamiento** según evidencia clínica.
- Devolver **directamente SOAP** (Subjective, Objective, Assessment, Plan).
- El **Plan** generado *está diseñado para convertirse* en la baseline del siguiente follow-up (objetivo de diseño; feature post-piloto).

### Qué no debe hacer en follow-up

- No devolver respuesta **dividida en 4 bloques** (highlights, tests sugeridos, etc.).
- No **pausar** para editar “highlights” o “evaluaciones físicas”.
- No **mapear** la respuesta al mismo esquema que initial (conversation_highlights, recommended_physical_tests, etc.).

### Flujo deseado

1. Usuario aporta (o el sistema ya tiene): baseline + actualización de hoy (+ in-clinic/HEP/cumplimiento si aplica).
2. Una **sola** llamada a Vertex con ese contexto → **SOAP**.
3. El plan del SOAP *está diseñado para convertirse* en la baseline del próximo follow-up. **Hoy**: el sistema usa el baseline del **Initial** para todos los follow-ups; el baseline encadenado follow-up → follow-up **no está aún implementado** (post-piloto).

### Referencia en código (objetivo)

- **Prompt follow-up**: `buildFollowUpPromptV3` — baseline (previous SOAP), in-clinic today, HEP prescribed, clinical update (transcript).
- **No** reutilizar el flujo “analyze” (Niagara) que pide JSON con highlights/tests para follow-up; ese flujo es solo para initial.
- **SOAP follow-up**: contexto = baseline + clinical update + (opcional) physical findings; salida = SOAP con progresiones en el plan.

---

## 3. Tabla comparativa rápida

| Aspecto | Initial | Follow-up |
|--------|--------|-----------|
| **Entrada principal** | Transcript (+ attachments, profile) | Baseline + actualización clínica de hoy (+ in-clinic, HEP, cumplimiento) |
| **Salida Vertex** | JSON estructurado (4 bloques) | SOAP directo |
| **Edición intermedia** | Sí: 4 bloques editables | No: ir directo a SOAP |
| **Evaluación física** | Sí: tests sugeridos → tests realizados → SOAP | Opcional / distinto rol; no bloques de “tests sugeridos” |
| **Plan generado** | Plan del initial assessment | Plan con progresiones; *objetivo*: baseline del siguiente follow-up (post-piloto; hoy se usa baseline del Initial) |

---

## 4. Estado actual vs objetivo (seguimiento piloto)

- **Initial**: ya se alimenta con transcript + profile + visitType `initial` y se espera JSON en 4 bloques; el flujo posterior (edición → evaluación física → SOAP) está alineado con lo anterior.
- **Follow-up**: en código hoy existe aún uso de “analyze” (Niagara) con `visitType: 'follow-up'`, que devuelve el mismo esquema que initial; el objetivo es que follow-up **no** pase por ese “analyze” y se alimente solo con baseline + actualización de hoy y genere **solo SOAP**. El baseline hoy es el del **Initial** para todos los follow-ups; baseline encadenado follow-up → follow-up es **objetivo post-piloto**.

Con esto queda explícito **qué alimenta la consulta Vertex inicial** y **qué alimenta la consulta Vertex follow-up**, y **qué es comportamiento actual vs objetivo de diseño**, para poder estabilizar el piloto sobre una sola fuente de verdad.
