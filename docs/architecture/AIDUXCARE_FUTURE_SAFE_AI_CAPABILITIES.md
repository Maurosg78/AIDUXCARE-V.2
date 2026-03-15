## AiDuxCare – Future Safe AI Capabilities (Reasoning Workspace)

**Version:** 1.0  
**Scope:** What kinds of AI can be safely added **inside the Reasoning Workspace** without crossing the regulatory boundary defined in:

- `AIDUXCARE_REGULATORY_DESIGN_SOT.md`  
- `AIDUXCARE_REGULATORY_ARCHITECTURE.md`  
- `AIDUXCARE_REGULATORY_BOUNDARY_DIAGRAM.md`

---

### 0. Core Principles

All capabilities listed here assume:

- They live strictly in the **Reasoning Workspace**.  
- They produce **insights**, not medical decisions.  
- They never write directly into the **Clinical Record**.  
- All content reaches the record only through:
  - Documentation Engine (SOAP, reports) **and**
  - Human Approval Boundary (clinician review + edit).

They must respect SoT invariants:

- AI never generates new diagnoses.  
- AI never recommends new treatments.  
- All AI output is editable and requires clinician confirmation.

---

### 1. Descriptive Longitudinal Evolution

**What can be added**

- Richer longitudinal series:
  - Pain (0–10), function, ROM, questionnaire scores (e.g. ODI, NDI).  
- Pattern tags:
  - “oscillating”, “slowly improving”, “initial improvement followed by stabilization”.
  - Detection of plateau: last 2–3 sessions with ≤ 1 point change.

**Safe output examples**

- “Dolor reportado: 7/10 → 4/10 → 3/10 en 3 visitas.”  
- “No se observan cambios relevantes en las últimas 3 sesiones.”

**Explicitly not allowed**

- “El tratamiento es efectivo y debe continuar sin cambios.”  
- “Se recomienda intensificar el plan terapéutico.”

---

### 2. Multi-visit Clinical Summaries

**What can be added**

- Automatic summaries of:
  - episode history,  
  - key events (e.g. previous referrals, imaging tests documented),  
  - important clinical milestones.

**Safe output examples**

- “En los últimos 3 meses se documentan 5 visitas por dolor lumbar mecánico con introducción de programa de ejercicio terapéutico y educación postural.”

**Not allowed**

- “El caso ha sido manejado de forma adecuada / inadecuada.”  
- “Se ha logrado el objetivo terapéutico X; puede darse el alta.”

---

### 3. Biopsychosocial Factor Structuring

**What can be added**

- Clustering and prioritization of:
  - psychological factors,  
  - occupational factors,  
  - social context,  
  - protective factors.
- Descriptive density signals:
  - “pocos”, “varios”, “múltiples factores documentados”.

**Safe output examples**

- “Factores ocupacionales frecuentes documentados: trabajo sedentario prolongado, pausas limitadas.”  
- “Se han registrado múltiples factores psicosociales relacionados con estrés laboral.”

**Not allowed**

- “Se requiere intervención de salud mental obligatoria.”  
- “Estos factores impiden la recuperación si no se tratan.”

---

### 4. Red Flag Intelligence (Descriptive, Not Prescriptive)

**What can be added**

- Better normalization and grouping of red flags:
  - where in the note they were documented,  
  - timeline of appearance,  
  - grouping by system (neurológico, infeccioso, vascular, etc.).

**Safe output examples**

- “Red flags documentadas: adormecimiento en silla de montar (fecha X); dificultad para iniciar la micción (fecha Y).”

**Not allowed**

- “Síndrome de cauda equina probable.”  
- “Derivación neuroquirúrgica obligatoria.”

---

### 5. “Mirror” Comparators (Case vs Case/History)

**What can be added**

- Comparisons of a case with:
  - other episodes of the same patient,  
  - typical durations for similar presentations (internally, aggregated, **never shown como norma**).

**Safe output examples**

- “En comparación con episodios previos de este paciente, la duración actual (8 semanas) es mayor que las previas (3–4 semanas).”

**Not allowed**

- “Por tanto, el pronóstico es desfavorable.”  
- “Se debería cambiar de estrategia terapéutica.”

---

### 6. Documentation Templates & Smart Snippets

**What can be added**

- Suggestion of documentation snippets:
  - standard education blocks,  
  - structured sections for antecedentes, educación, etc.

**Safe output examples**

- “Plantilla de educación postural estándar (editable) sugerida para este tipo de caso.”  
- “Bloque sugerido para documentar antecedentes quirúrgicos (editable).”

**Conditions**

- Always presented as **editable text**, never as plan prescriptivo.  
- Must be clearly separable from clinician-authored content in the UI if needed.

---

### 7. Semantic Labelling for Interoperability (FHIR/HL7-safe)

**What can be added**

- Mapping of **existing clinician text** to:
  - SNOMED/ICD codes (diagnoses already written),  
  - FHIR resources (e.g. Condition, Procedure) **only when text already exists**.

**Safe pattern**

- “Texto clínico: ‘Lumbalgia mecánica subaguda’ → Tag semántico: SNOMED XXXX (low back pain).”

**Not allowed**

- Creating new diagnoses from patterns without textual evidence.  
- Tagging conditions that the clinician nunca escribió explícitamente.

---

### 8. Documentation QA / Clinical “Linting”

**What can be added**

- Quality checks such as:
  - “Objective detallado, Assessment vacío”  
  - “Se documenta irradiación pero no se describen pruebas neurodinámicas en Objective”.

**Safe output examples**

- “La nota actual contiene un Objective detallado pero un Assessment muy breve; considere documentar el razonamiento clínico.”  
- “Se describe irradiación en Subjective; no se encuentran pruebas neurodinámicas documentadas en Objective.”

**Not allowed**

- “Debe realizarse prueba X.” (solo “considere documentar…” o “no hay documentación de X”).

---

### 9. Operational Analytics (Non-clinical)

**What can be added**

- Internal dashboards on:
  - documentation time,  
  - rate of notes revised/edited,  
  - use of templates,  
  - adoption across users.

**Safe output examples**

- “Tiempo medio de generación + revisión de SOAP: 4.2 minutos.”  
- “El 92% de las notas generadas se revisan y editan antes de finalizar.”

**Constraints**

- No “ranking clínico” de profesionales.  
- No métricas de “éxito terapéutico” que puedan interpretarse como juicio clínico automatizado.

---

### 10. General Pattern for Future-safe Features

For any new AI feature, enforce this mental checklist:

1. **Input**  
   - Only from:
     - transcript,  
     - SOAP / clinical notes,  
     - explicit clinician-entered fields,  
     - structured clinical context.

2. **Process**  
   - Analysis, clustering, timelines, semantic tagging, QA, summarization.  
   - No internal “if A and B → decide X” rules that produce treatment/diagnostic decisions.

3. **Output (allowed forms)**  
   - Description of patterns:
     - “X cambió de A a B”,  
     - “se documenta aparición de Y en fecha Z”.  
   - Summaries of existing content:
     - “en los últimos N episodios se documentó…”.  
   - Semantic tags for existing concepts:
     - mapping textual diagnoses to codes.  
   - Documentation QA:
     - “esta sección está vacía/inconsistente”.  
   - Operational/process metrics:
     - tiempos, uso, adopción (no resultados clínicos).

4. **Explicitly avoid** in AI-generated text (unless the clinician wrote it verbatim and it is clearly attributed):

   - “debería”, “se recomienda”, “indicado”, “tratamiento recomendado”,  
   - “diagnóstico: …” generado por el sistema,  
   - “decisión clínica”, “plan terapéutico óptimo”,  
   - “pronóstico favorable / desfavorable” decidido por la IA.

If any proposed feature requires such language or effects, it must be treated as:

- **Out of scope** for Reasoning Workspace safe mode, and/or  
- Candidate for a future **CDS/MDR path** (to be captured in a dedicated regulatory roadmap, not implemented by defecto).

