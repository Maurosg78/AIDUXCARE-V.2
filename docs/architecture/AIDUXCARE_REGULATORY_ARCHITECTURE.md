## AiDuxCare – Regulatory Architecture Diagram (SoT-Aligned)

**Version:** 1.0  
**Scope:** High-level regulatory view of AiDuxCare architecture  
**Source of Truth:** `AIDUXCARE_REGULATORY_DESIGN_SOT.md`

---

### 1. Purpose

This document maps the **regulatory surface** of AiDuxCare:

- Which parts of the system are **pure documentation tooling** (safe zone – SoT Category A).  
- Which parts are **near the regulatory boundary** (pattern detection, clinical language, prompts).  
- How the system is architected to keep **Layer 3 (reasoning)** from leaking into the **official medical record**.

It is not a full technical diagram; it is a **regulatory lens** over the existing architecture.

---

### 2. Core Layer Model (from SoT)

AiDux is conceptually split into three layers:

1. **Layer 1 – Clinical Data Capture**
   - Audio recording, transcripts, manual inputs.
2. **Layer 2 – Clinical Documentation Engine**
   - SOAP drafting, EMR export, referral report ES-ES.
3. **Layer 3 – Clinical Reasoning Workspace**
   - Pattern detection, red flags, narrative synthesis, longitudinal analysis.

**Regulatory Principle:**  
Only **Layer 2** may output content that is stored as part of the medical record.  
Layer 3 is a **workspace for the clinician**, not a decision engine.

---

### 3. System Regulatory Surface Map

#### 3.1 AI Prompts (Highest Sensitivity)

**Modules:**

- `src/core/ai/PromptFactory-Canada.ts`
- `src/core/soap/SOAPPromptFactory.ts`
- `src/core/soap/followUp/buildFollowUpPromptV3.ts`
- Future prompt builders under `src/core/prompts/`

**Regulatory Role:**

- Expose clinical variables, patterns and red flags.  
- Provide **structured reasoning support** (differential considerations, recommended tests).  

**Risk level (surface):**  
Medium–High (PROMPTS-BOUNDARY – see `TECH_DEBT_REGULATORY_SOT_GAPS.md`).

**Guardrails from SoT:**

- Must **not**:
  - generate diagnoses,  
  - prescribe treatments,  
  - claim “clinical decisions by system”.  
- Must phrase outputs as:
  - “documentation assistant”,  
  - “considerations”,  
  - “structured documentation”.

---

#### 3.2 SOAP Generation Engine

**Modules:**

- `src/core/soap/SOAPPromptFactory.ts`
- `src/services/vertex-ai-soap-service.ts`
- `src/components/SOAPEditor.tsx`

**Layer:**  
Primarily **Layer 2 – Documentation**, with prompts influenced by Layer 3 inputs.

**Regulatory Role:**

- Transform transcript + structured analysis into **draft SOAP notes**.  
- Provide editable drafts that **require clinician review and finalization**.

**Current design (regulatory):**

- Prompts explicitly say:
  - “You assist with documentation, you do NOT diagnose.”  
- `SOAPEditor`:
  - displays all generated text before saving,  
  - allows editing of every section,  
  - requires explicit **Finalize** action,  
  - enforces minimal content checks before finalization.

**Risk level (surface):**  
Medium (SOAP-BOUNDARY), especially around:

- Assessment wording (“clinical reasoning and diagnosis”).  
- Plan wording when it might sound like system-recommended treatment.

---

#### 3.3 Clinical Narrative Modules

**Modules:**

- `src/core/synthesis/NarrativeSummary.ts`
- `src/core/synthesis/synthesizeClinicalNarrative.ts`
- `src/core/clinical/clinicalReportService.ts`
- `src/core/reports/referralReportEs/*`

**Layer:**  
Primarily **Layer 2 (documentation)**, derived from structured facts.  
Internally uses **Layer 3 reasoning patterns** (e.g. evolution classification).

**Regulatory Role:**

- Produce **human-readable summaries and reports** based on already documented facts.

**Recent regulatory hardening (ES-ES):**

- `clinicalReportService` para ES-ES:
  - mapea únicamente campos desde `ClinicalFactSetLike.facts` (`chiefComplaint`, `diagnosis`, `pain.cursoTextoLibre`, `plan.textoLibre`…),  
  - evita usar juicios del motor narrativo para rellenar diagnóstico/plan.  
- `buildReferralReportEsSections`:
  - diagnóstico → “Impresión clínica documentada por el fisioterapeuta: …”  
  - plan → “Plan documentado en la sesión: …”  
  - se han eliminado frases de recomendación automatizada (“Se recomienda revisión con…” → “Revisión documentada…”).

**Risk level (surface):**  
Medium (PATTERN-MODULES), por:

- lenguaje de “mejoría / empeoramiento / red flag”,  
- y, en longitudinal, el uso previo de “reducción clínicamente significativa” (ya identificado como deuda técnica).

---

#### 3.4 Clinical Pattern Detection

**Modules:**

- `src/core/synthesis/LongitudinalEvolution.ts`
- Red flag patterns dentro de `synthesizeClinicalNarrative.ts`
- `src/core/clinical/clinicalReportService.ts` (uso de `summary.evolution` para `clinicalStatus`)

**Layer:**  
Claramente **Layer 3 – Clinical Reasoning Workspace**.

**Regulatory Role:**

- Detectar patrones de:
  - evolución de dolor,  
  - aparición de irradiación,  
  - red flags neurológicas.  
- Generar **metadatos e indicadores** que ayuden al clínico a entender la evolución.

**Guardrail SoT §10:**

- Estos módulos pueden **describir patrones**, pero **no deben emitir recomendaciones** (“debe continuar tratamiento”, “debe derivarse”).  
- El texto clínico final debe ser:
  - descriptivo (“dolor de 7/10 → 2/10”),  
  - no prescriptivo.

**Risk level (surface):**  
Medium (PATTERN-MODULES).

---

#### 3.5 UX Language (UI Copy)

**Modules:**

- `src/components/SOAPEditor.tsx` (labels, modales, banners)  
- `src/components/ReferralReportModal.tsx` (si aplica)  
- Landing:
  - `src/landing/components/SolutionSection.tsx`
  - `src/landing/components/ProblemSection.tsx`

**Layer:**  
Cross-cutting; shapes **user perception** of whether AiDux is:

- documentation assistant (safe), o  
- decision system (riesgo SaMD).

**Current regulatory hardening:**

- Landing:
  - “structured clinical note”, “ready for review and insurance-grade records” (no se vende como sistema que decide).  
- `SOAPEditor`:
  - texto de preview enfatiza “Review before accepting”.  
- Modal informe ES-ES:

  ```1091:1117:src/components/SOAPEditor.tsx
  Borrador generado por AiDux.
  Revísalo y edítalo antes de usarlo o compartirlo. El contenido no se guarda automáticamente en la historia clínica.
  ```

**Risk level (surface):**  
Low–Medium (UX-DISCLOSURE), dependiendo de si:

- se introducen en el futuro labels tipo “AI decision” o “recommended treatment”.

---

#### 3.6 Clinical Analysis Layer (Prompt Brain & Structured Analysis)

**Modules:**

- `src/core/ai/PromptFactory-Canada.ts`
- `src/services/vertex-ai-service-firebase.ts` (análisis previos a SOAP)
- `src/core/soap/SOAPContextBuilder.ts`
- `src/core/soap/SOAPDataOrganizer.ts`

**Layer:**  
Puro **Layer 3 – Clinical Reasoning Workspace**.

**Regulatory Role:**

- Exponer variables, patrones, factores biopsicosociales y red flags a nivel de **análisis**, no de decisión.  
- Producir estructuras JSON que luego se usan como **contexto** para documentación.

**Guardrails clave (SoT §§3, 5, 8):**

- Estos outputs **no deben** entrar directamente en:
  - diagnósticos en Assessment,  
  - planes terapéuticos,  
  - recomendaciones “de sistema”.  
- Deben alimentar:
  - prompts de documentación, pero con lenguaje suavizado y **sin usarse como única fuente** de diagnósticos/planes.

**Risk level (surface):**  
High (clinical reasoning), pero actualmente mantenido como **workspace** si se respeta la separación con Layer 2.

---

### 4. How Layers Interact (Regulatory View)

**Flow (conceptual):**

1. **Layer 1 – Capture:**  
   Transcript + inputs del clínico →  
2. **Layer 3 – Analysis (Prompt Brain, pattern modules):**  
   - produce JSON estructurado, flags, series, etc.  
   - se mantiene como *insight workspace*.  
3. **Layer 2 – Documentation:**  
   - SOAP + informes (ES-ES) se generan:
     - solo a partir de transcript + SOAP + clinical facts,  
     - con prompts/configuración que siguen el SoT.  
   - UI (`SOAPEditor`, modales) obliga a:
     - revisión humana,  
     - edición posible,  
     - confirmación explícita antes de final.

**Regulatory invariant deseado:**

> Ningún texto que parezca **decisión clínica** debe saltar directamente de Layer 3 al registro oficial sin pasar por una capa de **documentación asistida + revisión humana**.

---

### 5. Regulatory Data Flow Rules

**Allowed flows**

- Capture Layer → Documentation Engine  
- Capture Layer → Reasoning Workspace  
- Documentation Engine → User-reviewed Clinical Record (solo tras confirmación explícita del clínico)

**Forbidden flows**

- Reasoning Workspace → Clinical Record (directo, sin revisión humana)  
- AI Analysis → SOAP Assessment (automático, sin que el contenido esté ya documentado por el clínico)  
- Pattern Detection → Treatment Plan (no se permite que módulos de patrones introduzcan intervenciones nuevas)

---

### 6. Boundary Modules (Regulatory Risk Levels)

Algunos módulos viven cerca de la frontera regulatoria y requieren **atención especial** al modificarlos:

- **HIGH – PromptFactory-Canada**
  - Mapea transcript → análisis clínico estructurado, red flags, recomendaciones de pruebas y derivación médica como “consideraciones”.
  - Cualquier cambio en su wording puede empujar el sistema hacia Clinical Decision Support.

- **MEDIUM – Clinical Narrative Engine (NarrativeSummary + referralReportEs + clinicalReportService)**
  - Convierte hechos clínicos en texto narrativo.
  - Riesgo de introducir lenguaje de juicio (“mejoría clínicamente significativa”, “empeoramiento importante”) si no se controla.

- **LOW–MEDIUM – SOAP Structuring Engine (SOAPPromptFactory + vertex-ai-soap-service)**
  - Organiza información en formato SOAP.
  - Aunque se presenta como documentación, el Assessment y el Plan pueden volverse problemáticos si empiezan a incluir diagnóstico/generación de tratamiento autónomo.

Estos módulos deben ser siempre revisados contra:

- `AIDUXCARE_REGULATORY_DESIGN_SOT.md`  
- `TECH_DEBT_REGULATORY_SOT_GAPS.md`

antes de introducir cambios significativos.

---

### 7. Regulatory Safety Invariants

Estas son reglas de seguridad regulatoria que **no deben romperse**:

1. **Invariant 1**  
   La IA nunca debe generar un diagnóstico que no esté **explícitamente escrito por el clínico** en los datos de entrada.

2. **Invariant 2**  
   La IA nunca debe recomendar intervenciones de tratamiento (ejercicios, modalidades, frecuencia) que no hayan sido documentadas por el clínico.

3. **Invariant 3**  
   Toda documentación generada por IA debe ser siempre **editable** por el clínico antes de ser considerada parte del registro.

4. **Invariant 4**  
   Ningún output de IA puede entrar en el registro clínico (EMR/historia) sin **confirmación humana explícita** (finalización o acción equivalente).

5. **Invariant 5**  
   Los módulos de patrones (red flags, longitudinal, narrativa) solo pueden **describir** cambios/patrones; no pueden producir recomendaciones (“debe continuar tratamiento”, “debe derivarse”).

Estas invariantes deben utilizarse como checklist mental y de revisión de código para cualquier nueva feature o refactor relacionado con prompts, narrativa, SOAP o reporting clínico.

---

### 8. Regulatory Debt Mapping (Architecture ↔ Tech Debt)

Para conectar esta arquitectura con el tracker de deuda regulatoria:

- **PromptFactory-Canada**
  - Risk: Clinical decision support language (red flags, imaging/physician follow-up suggestions).
  - Tracked in: `TECH_DEBT_REGULATORY_SOT_GAPS.md` (PROMPTS-BOUNDARY).
  - Example WO: `WO-REG-03 Prompt language hardening (Canada Prompt Brain)`.

- **Clinical Narrative Engine (ES-ES)**
  - Risk: Lenguaje de juicio clínico en narrativa e informes (ej. “reducción clínicamente significativa”).
  - Tracked in: `TECH_DEBT_REGULATORY_SOT_GAPS.md` (PATTERN-MODULES).
  - Example WO: `WO-REG-05 Neutralizar wording narrativo en módulos ES-ES`.

- **SOAP Structuring Engine**
  - Risk: Uso de “working diagnosis” y posibles frases que parezcan decisiones del sistema en Assessment/Plan.
  - Tracked in: `TECH_DEBT_REGULATORY_SOT_GAPS.md` (SOAP-BOUNDARY).
  - Example WO: `WO-REG-04 Sustituir “working diagnosis” por “clinical impression documented by physiotherapist” en prompts SOAP`.

---

### 9. Relationship to Tech Debt Tracker

`docs/strategy/TECH_DEBT_REGULATORY_SOT_GAPS.md` utiliza este mapa como:

- Lista de **zonas de búsqueda** (PROMPTS-BOUNDARY, SOAP-BOUNDARY, PATTERN-MODULES, UX-DISCLOSURE, AUDIT-TRAIL-GAPS).  
- Fuente para crear WOs pequeños (`WO-REG-XX`, `WO-ES-MVP-XX`) que:
  - ajusten wording,  
  - fortalezcan separación de capas,  
  - reduzcan riesgo de SaMD.

Cada vez que se introduce un módulo nuevo en:

- prompts,  
- narrativa,  
- pattern detection,  
- UX clínica,

debería añadirse aquí como parte del **Regulatory Surface Map** y, si corresponde, registrar potencial deuda en el tracker.

---

### 10. Living Document

Este diagrama es un documento vivo:

- Debe actualizarse cuando:
  - se agregan nuevos prompts,  
  - se añaden nuevos informes (ej. progress reports para Canadá),  
  - se cambia el flujo de finalización de notas.  
- Debe ser el primer lugar que se revisa cuando:
  - se planifica una nueva feature con impacto clínico,  
  - se revisa el sistema desde un ángulo regulatorio/MDR.

