# Plan como corazón de AiDuxCare y uso del análisis longitudinal

**Objetivo:** Definir cómo el **Plan** es el eje donde confluyen (1) lo que hace hoy el fisioterapeuta y (2) la evolución longitudinal del paciente, y cómo usar las capacidades de análisis longitudinal para que AiDuxCare sea un **asistente clínico pensante** (no solo scribe) cuya propuesta se adapte a esa evolución.

---

## 1. Por qué el Plan es el corazón

- **Una sola fuente de verdad entre sesiones:** El Plan responde a “¿qué habíamos diseñado para este paciente?” y “¿qué hacemos hoy?”. Es el hilo que une evaluación inicial → seguimiento 1 → seguimiento 2 → …
- **Donde confluye la acción actual:** En el Plan se refleja lo realizado en consulta (in-clinic) y lo prescrito para casa (HEP), más el enfoque para la próxima sesión.
- **Donde debe confluir la evolución:** Para que la propuesta sea útil, el Plan de *hoy* debe tener en cuenta no solo el último plan, sino la **trayectoria**: mejora/estabilidad/empeoramiento, adherencia, qué intervenciones se han hecho y con qué resultado.

Por tanto, el análisis longitudinal de AiDuxCare debe **alimentar el Plan**: tanto la generación/actualización del SOAP como cualquier sugerencia explícita de “próximo enfoque” o “plan sugerido”.

---

## 2. Capacidades de análisis longitudinal que ya existen

| Capacidad | Ubicación | Qué aporta |
|-----------|-----------|------------|
| **Baseline SOAP** | `clinicalStateService`, `clinical_baselines` | Condición y plan de la evaluación previa (una “foto” estática). |
| **Plan anterior (último)** | `treatmentPlanService`, `treatment_plans` | Plan más reciente: intervenciones, HEP, nextSessionFocus. Se muestra en “Today’s Plan”. |
| **Prompt follow-up (V3)** | `buildFollowUpPromptV3` | Usa **solo** baseline SOAP + actualización clínica de hoy + ítems in-clinic + HEP. **No** usa múltiples visitas ni evolución. |
| **Comparación de sesiones** | `sessionComparisonService` | Compara sesión anterior vs actual: deltas de dolor, ROM, tests funcionales, `overallProgress` (improved/stable/regressed), `RegressionAlert[]`. |
| **Evolución longitudinal (dolor)** | `LongitudinalEvolution.ts` | Serie de dolor entre visitas, dirección (improved/worsened/stable/mixed), magnitud del cambio, narrativa. Usado en informes/referral. |
| **Historial de notas** | `PersistenceService.getNotesByPatient` | Lista de notas/sesiones del paciente (ordenadas por fecha). |
| **Historial de planes** | `treatment_plans` (por paciente) | Múltiples documentos; hoy solo se carga el más reciente para “Today’s Plan”. |

**Lo que hoy no se hace:**  
- Los **deltas** y **alerts** de `sessionComparisonService` no se inyectan en el prompt de follow-up ni en ninguna “sugerencia de plan”.  
- La **evolución longitudinal** (dolor, tendencia) no se pasa a Vertex para el Plan.  
- El prompt de follow-up **no** recibe los últimos N planes (solo el baseline, que es una sola evaluación), por lo que la IA no ve la “trayectoria del plan”.

---

## 3. Cómo usar el análisis longitudinal para el Plan

### 3.1 Principios

- **Un solo Plan por sesión:** Se sigue guardando un plan por SOAP finalizado (como hoy).  
- **Contexto longitudinal en la generación:** La generación del SOAP de follow-up (y en concreto del Plan) debe poder recibir **contexto de evolución** para que la propuesta sea coherente con la trayectoria.  
- **Opcional y gradual:** Introducir primero “evolución en el prompt” (baseline + última sesión + resumen de evolución/deltas); después, si se desea, un paso explícito de “sugerencia de plan” que use historial de planes + deltas.

### 3.2 Uso concreto de cada capacidad

1. **Baseline SOAP**  
   - **Ya en uso:** Es la base del follow-up (buildFollowUpPromptV3).  
   - **Mantener:** Sigue siendo el ancla “quién es el paciente y cuál es la condición”.

2. **Último plan (Today’s Plan)**  
   - **Ya en uso:** Se carga y muestra en la UI.  
   - **Ampliar:** Incluir en el prompt de follow-up, de forma explícita, el “plan de la sesión anterior” (no solo el plan embebido en baseline). Así la IA ve qué se había planeado hacer hoy y puede actualizarlo con la actualización clínica.

3. **Comparación de sesiones (deltas + alerts)**  
   - **Uso propuesto:**  
     - Construir un **resumen corto** para el prompt: “Comparado con la sesión anterior: dolor X→Y, ROM/otros cambios; progreso global: improved/stable/regressed; alertas si las hay.”  
     - Inyectar ese resumen en `buildFollowUpPromptV3` (o en un bloque “LONGITUDINAL CONTEXT”) para que el Plan generado tenga en cuenta mejora/estabilidad/empeoramiento.  
   - **Dónde:** Opcional en follow-up cuando exista `previousSession` (SessionComparisonService ya expone previous/current y deltas).

4. **Evolución longitudinal (dolor / tendencia)**  
   - **Uso propuesto:**  
     - Si existe serie de visitas (p. ej. desde `LongitudinalEvolution` o desde notas/SOAPs), añadir al prompt una línea tipo: “Evolución del dolor en las últimas visitas: [narrativa o serie].”  
     - La IA puede usar esto para proponer progresiones, mantener o intensificar tratamiento, o sugerir revaloración.

5. **Últimos N planes**  
   - **Uso propuesto (fase posterior):**  
     - Leer últimos 2–3 planes desde `treatment_plans` (por paciente + autor).  
     - Incluir en el prompt un bloque “PLAN TRAJECTORY” (resumen: qué se planeó en cada una y, si se extrae, nextSessionFocus).  
     - Así la propuesta de Plan de hoy se alinea con la secuencia real de decisiones (no solo con el baseline).

6. **SessionPatternAnalysisService (futuro)**  
   - **Documentado en DATA_FLOW.md** como “Session History → Pattern Analysis → Future Suggestions”.  
   - **Uso propuesto:** Cuando exista, que su salida (qué tratamientos han ido bien, patrones de respuesta, progreso) se integre como **input opcional** para:  
     - el prompt de follow-up (Plan), y/o  
     - un paso explícito de “sugerencia de próximo enfoque” que el fisio pueda confirmar o ajustar.

---

## 4. Propuesta de implementación por fases

### Fase A — Contexto longitudinal mínimo en follow-up (rápida)

- **Objetivo:** Que el Plan generado en follow-up tenga en cuenta “qué pasó desde la última vez”.
- **Cambios:**  
  1. En follow-up, si hay datos de **SessionComparisonService** (previous + current + deltas):  
     - Construir un párrafo corto: progreso global, cambio de dolor si existe, alertas relevantes.  
  2. Añadir a `FollowUpPromptV3Input` un campo opcional `longitudinalSummary?: string`.  
  3. Incluir en `buildFollowUpPromptV3` un bloque “LONGITUDINAL CONTEXT (since last visit): …” cuando venga informado.  
  4. En `ProfessionalWorkflowPage` (y donde se llame `buildFollowUpPromptV3`): si hay comparación disponible, generar el resumen y pasarlo.
- **Resultado:** El Plan del SOAP de follow-up empieza a “ver” evolución reciente (una sesión atrás).

### Fase B — Plan anterior explícito (contexto solo)

- **Objetivo:** Que la IA vea el “plan que teníamos para hoy” para continuidad narrativa, **sin** que genere cambios de plan por sí misma.
- **Guardrail regulatorio:** El prompt debe decir explícitamente: *“Use the previous plan ONLY as context. Do not introduce new interventions unless explicitly documented in today's session input.”* El modelo puede estructurar y resumir; **no** generar recomendaciones terapéuticas automáticas (eso sería clinical decision support).
- **Cambios (implementados):**  
  1. `FollowUpPromptV3Input.previousPlansSummary` con resumen del último plan (focus, intervenciones, texto).  
  2. Bloque “PREVIOUS TREATMENT PLAN(S) — CONTEXT ONLY” en el prompt con el guardrail anterior.  
  3. Tarea explícita: *“Your role is to rewrite the SOAP note reflecting today's encounter. You must NOT decide next treatment strategy.”*  
- **Resultado:** La propuesta de Plan es coherente con la secuencia de decisiones recientes y se mantiene en **documentation support**.

### Fase C — Sugerencia de próximo enfoque (fuera del registro clínico)

- **Objetivo:** Que el sistema pueda sugerir “consideraciones clínicas” (próximo enfoque, progresiones posibles) **sin** que eso entre automáticamente en el SOAP. La decisión y lo documentado son siempre del fisio.
- **Frontera regulatoria:** Si la IA escribe directamente un nuevo plan en el SOAP → cruza a clinical decision support. La forma correcta: **AI considerations** (Reasoning Workspace) → **decisión humana** → **documentación** (registro clínico).
- **Separación conceptual:**  
  - **Documented plan:** lo que entra al SOAP (decidido y redactado/confirmado por el profesional).  
  - **AI considerations:** lo que se muestra en UI como “Consideraciones clínicas (no forman parte del registro)” — el fisio decide y solo entonces el plan entra al SOAP.
- **Cambios propuestos:**  
  1. Flujo opcional que produce `{ documentation, considerations }`: el SOAP solo documenta; las “consideraciones” (ej. “Posible progresión de ejercicios de estabilización lumbar”, “Valorar revalorar tensión neural si persisten síntomas”) se muestran aparte.  
  2. UI: “Consideraciones clínicas sugeridas (no parte del registro)” → el fisio acepta, edita o ignora; solo lo que confirme pasa al Plan documentado.  
- **Resultado:** Asistente pensante que mantiene la frontera: documentación vs decisión clínica.

**Contrato de servicio (Fase C — para implementación futura):**

- **Función:** `generateFollowUpAnalysis(...)` (mismos inputs que el follow-up actual: baseline, clinicalUpdate, longitudinalSummary, previousPlansSummary, inClinicItems, homeProgram).
- **Salida:**
```json
{
  "documentation": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "considerations": [
    "Possible progression of lumbar stabilization exercises",
    "Consider reassessment of neural tension if symptoms persist"
  ]
}
```
- **Uso:** `documentation` → va al editor SOAP (registro clínico). `considerations` → solo UI, bajo el título “AI Clinical Considerations (not part of the medical record)”; el fisio decide si incorpora algo al plan. No se insertan automáticamente en el SOAP.

### Motor de trajectory patterns (implementado)

- **Objetivo:** Clasificar la evolución del dolor (o de una métrica) en patrones **descriptivos** (improved / regressed / plateau / fluctuating) sin inferir estrategia terapéutica. El clasificador vive en **backend**, no en el LLM; el modelo solo recibe la etiqueta como contexto para escribir narrativas coherentes.
- **Arquitectura:** Clinical sessions → SessionComparisonService → **TrajectoryClassifier** → longitudinal summary + trajectory pattern → Prompt.
- **Implementación:** `src/core/longitudinal/trajectoryClassifier.ts`. Algoritmo determinista (sin ML): umbrales de delta (ej. Δ ≤ -2 → improved, Δ ≥ 2 → regressed), varianza para fluctuating cuando hay 3+ puntos. Salida: `{ pattern, confidence, label }`. `classifyTrajectoryFromTwoPoints(previous, current)` para el caso típico (última vs actual sesión).
- **Integración en prompt V3:** Campos opcionales `trajectoryPattern`, `trajectoryConfidence` y **`painSeriesSummary`** (serie corta de dolor, ej. “6 → 5 → 4”). La serie ayuda al modelo a generar narrativas más naturales. Para mantener el prompt compacto se usa una **ventana corta: últimas 3 sesiones** (`SessionComparisonService.getLastNPainSeries(patientId, 3)`); no se envían series largas. Con 2+ puntos se formatea “v1 → v2” o “v1 → v2 → v3”. Bloque “TRAJECTORY PATTERN (context only)” con instrucción: *“Use this information only to describe patient evolution. Do not infer treatment decisions.”*
- **Dónde se usa:** (1) **Narrativa SOAP** — el modelo describe la evolución (“mejoría progresiva”, “síntomas estables”) sin recomendar; (2) **Informe de derivación** — texto de evolución clínica; (3) **Fase C (considerations)** — puede ayudar a reflexión (“The patient trajectory appears plateauing”) pero **no** entra al registro.
- **Trajectory confidence:** Cuando la trayectoria no es clara (pocos puntos, delta pequeño), el clasificador devuelve `confidence: low | medium | high`. Pensado para futura mejora de la narrativa (ej. “evolución en mejora con confianza media”) sin cruzar la frontera regulatoria.

### Fase D — SessionPatternAnalysis + integración en Plan (futuro)

- **Objetivo:** Usar patrones agregados (qué intervenciones se asociaron a mejora, adherencia, etc.) para refinar sugerencias.
- **Cambios:**  
  1. Implementar (o integrar) un servicio que, a partir de sesiones/notas del paciente, produzca un resumen de patrones (tratamientos, respuesta, progreso).  
  2. Usar ese resumen como input opcional en el prompt de follow-up y/o en el paso de “sugerencia de plan” (Fase C).  
- **Resultado:** La propuesta de Plan se alinea con “lo que ha funcionado” en ese paciente.

---

## 5. Guardrails regulatorios y frontera documentación vs decisión

- **Fase A (longitudinal):** Segura. El resumen longitudinal (dolor, progreso, alertas) es **contexto factual**; no introduce decisiones clínicas. Encaja con: Capture → Reasoning workspace → **Documentation**. En el prompt: *“The longitudinal context is provided for documentation continuity. Do not infer new diagnoses or treatment decisions from it.”* Además, para evitar que el modelo transforme tendencia en estrategia (p. ej. “dolor mejoró → progresar ejercicios”): *“If longitudinal context is provided, use it only to describe evolution of symptoms or response to care. Do not transform the longitudinal information into treatment strategy.”*
- **Fase B (plan anterior):** El plan anterior se usa **solo como contexto**. El prompt prohíbe explícitamente introducir nuevas intervenciones no documentadas en la sesión de hoy. Tarea del modelo: *“Rewrite the SOAP note reflecting today's encounter”*, no *“Decide next treatment strategy”*.
- **Fase C (sugerencias):** Cualquier “sugerencia de próximo enfoque” debe quedar **fuera del registro clínico** hasta que el profesional la acepte. Arquitectura: `AI Output → { documentation, considerations }`; las considerations se muestran en UI y no se insertan automáticamente en el SOAP.
- **Comprobación de lenguaje regulatorio:** El mismo guard que se usa para el informe de derivación (`logRegulatoryLanguageWarnings` en `regulatoryLanguageGuard`) se ejecuta sobre la **salida del prompt V3** (SOAP de follow-up) en `generateFollowUpSOAPV2Raw` antes de devolverla al fisio (`soap_note_followup_v3`). Así se detectan frases de riesgo (recomendaciones, diagnóstico generado, etc.) aunque el modelo no sea 100 % predecible en producción.

---

## 6. Resumen

- **Plan = corazón:** Es el hilo entre sesiones y el lugar donde debe reflejarse tanto la acción actual como la evolución del paciente.  
- **Análisis longitudinal:** Fase A (resumen desde última sesión) y Fase B (plan anterior como contexto) ya alimentan el prompt V3 con guardrails explícitos; la salida del follow-up SOAP pasa por `logRegulatoryLanguageWarnings` antes de mostrarse al fisio.  
- **Frontera clara:** Documented plan = lo que va al SOAP. AI considerations = sugerencias mostradas en UI que **no** forman parte del registro hasta decisión humana (Fase C).  
- **Futuro:** Fase C (consideraciones fuera del registro) y Fase D (SessionPatternAnalysis) mantienen la misma frontera: el sistema da contexto y consideraciones; el profesional decide y documenta.

Con esto, las capacidades de análisis longitudinal de AiDuxCare se usan para **continuidad narrativa** entre sesiones sin cruzar la frontera regulatoria de documentación vs decisión clínica.
