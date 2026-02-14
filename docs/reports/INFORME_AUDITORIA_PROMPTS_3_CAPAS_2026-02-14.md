# INFORME DE AUDITORÍA: PROMPTS vs 3 CAPAS FUNDAMENTALES

**Fecha:** 14 de febrero de 2026  
**Objetivo:** Contrastar documentación teórica (.md) con código real; verificar cumplimiento de la promesa iBooks (prompts específicos al caso, no genéricos)  
**Alcance:** Initial, Ongoing, Follow-up — cada uno produce sus propios prompts  
**Criterio:** 3 capas — Profesional, Contexto (scope CPO), Seguridad (banderas rojas/amarillas)

---

## 1. RESUMEN EJECUTIVO

| Área | Prompt principal | Capa Profesional | Capa Contexto (CPO) | Capa Seguridad (RF/YF) | Estado |
|------|------------------|------------------|---------------------|------------------------|--------|
| **Initial** | PromptFactory-Canada + SOAPPromptFactory | ✅ Sí | ✅ Parcial | ✅ Sí | Implementado |
| **Follow-up** | buildFollowUpPromptV3 | ✅ Sí (WO-PHASE1B) | ✅ Sí (WO-PHASE1C P1) | ✅ Sí (WO-PHASE1C P0) | Implementado |
| **Ongoing** | ongoingFormToBaselineSOAP | ❌ N/A (parser) | ❌ N/A | ❌ N/A | No usa Vertex |

---

## 2. FLUJOS QUE USAN VERTEX AI

### 2.1 Initial Assessment

**Flujo:** Transcript → Niagara (PromptFactory-Canada) → Physical Exam → SOAP (SOAPPromptFactory.buildInitialAssessmentPrompt)

| Componente | Archivo | ¿Usa Vertex? |
|------------|---------|---------------|
| Análisis clínico (Niagara) | `PromptFactory-Canada.ts` → `buildCanadianPrompt` | ✅ Sí |
| Generación SOAP | `SOAPPromptFactory.ts` → `buildInitialAssessmentPrompt` | ✅ Sí |

**Capa Profesional (skills, experiencia):**
- `buildCapabilityContext`: seniority, domainFocus, languageTone
- `buildProfessionalContext`: profession, practiceAreas, techniques, experienceYears, clinic, licenseNumber
- `buildPracticePreferencesContext`: noteVerbosity, tone, preferredTreatments, doNotSuggest
- **Consent:** `dataUseConsent.personalizationFromClinicianInputs` — si false, no inyecta preferencias

**Capa Contexto (hospital, clínica, scope CPO):**
- PROMPT_HEADER: "CPO scope", "PHIPA/PIPEDA-aware"
- "Canadian physiotherapist", "Ontario, Canada"
- "CPA, CPO, CAPR documentation standards"
- **Gap:** No hay campo explícito para "hospitalario vs clínica privada vs inpatient vs outpatient" — el scope es genérico CPO

**Capa Seguridad (banderas rojas/amarillas):**
- PROMPT_HEADER: `medicolegal_alerts:{red_flags:[],yellow_flags[],legal_exposure,alert_notes}`
- Lista explícita: "Unexplained weight loss, night pain, neurological deficits, incontinence, systemic infection, major trauma, progressive weakness, cancer history, anticoagulants, steroids, age >65 trauma, symptom escalation on rest, medication interactions (NSAIDs+SSRIs/SNRIs MUST be red_flags)"
- Wording: "Clinical concern: [finding]. Recommend medical review/referral based on red flags" (no lenguaje diagnóstico)
- SOAPPromptFactory: sección RED FLAGS / YELLOW FLAGS en contexto
- **Documentación:** `CONOCIMIENTO_BASE_BANDERAS_ROJAS_FISIOTERAPIA_EVIDENCIA.md` — base teórica por grupos etarios (neonatos, pediátricos, adultos, ancianos)

---

### 2.2 Follow-up

**Flujo:** Baseline + transcript + in-clinic + HEP → buildFollowUpPromptV3 → generateFollowUpSOAPV2Raw → Vertex

| Componente | Archivo | ¿Usa Vertex? |
|------------|---------|---------------|
| SOAP Follow-up | `buildFollowUpPromptV3.ts` | ✅ Sí |

**Capa Profesional:**
- `buildCapabilityContext`, `buildProfessionalContext`, `buildPracticePreferencesContext` (reutilizados de PromptFactory-Canada)
- Condición: `canUsePersonalization(professionalProfile)` — respeta consentimiento

**Capa Contexto (CPO):**
- **✅ WO-PHASE1C P1:** "clinical documentation assistant for a registered physiotherapist in Ontario, Canada"
- "Scope: CPO (College of Physiotherapists of Ontario) regulated practice"
- "Ensure all suggestions and documentation are within physiotherapy scope per CPO standards"

**Capa Seguridad (banderas rojas/amarillas):**
- **✅ WO-PHASE1C P0:** Sección "CRITICAL SAFETY CHECK — RED FLAGS / YELLOW FLAGS"
- Lista explícita de red flags (neurológicos, dolor nocturno, pérdida de peso, etc.) y yellow flags
- Wording: "Clinical concern: [finding]. Recommend medical review/referral based on red flags."
- Instrucción: "If no new flags: Omit. Do NOT invent flags."

---

### 2.3 Ongoing

**Flujo:** OngoingPatientIntakeModal → formulario estructurado → `ongoingFormToBaselineSOAP` → `createBaselineFromMinimalSOAP` → Firestore

| Componente | Archivo | ¿Usa Vertex? |
|------------|---------|---------------|
| Form → SOAP | `ongoingFormToBaselineSOAP.ts` | ❌ No — es un parser |

**Conclusión:** Ongoing **no produce prompts para Vertex**. Es un parser que convierte datos del formulario en strings SOAP. El baseline resultante se usa luego como input para follow-up (buildFollowUpPromptV3).

**Documentación:** `ONGOING_FORM_CTO_ALIGNMENT.md` — define campos (redFlags en clinical context) pero no hay prompt IA; el usuario escribe manualmente.

---

## 3. DOCUMENTACIÓN TEÓRICA vs CÓDIGO

### 3.1 Documentos .md relevantes

| Documento | Contenido | ¿Reflejado en código? |
|-----------|-----------|------------------------|
| `CONOCIMIENTO_BASE_BANDERAS_ROJAS_FISIOTERAPIA_EVIDENCIA.md` | Base científica por grupos etarios (neonatos a ancianos) | Parcial — PromptFactory-Canada tiene lista fija; no hay diferenciación por edad en el prompt |
| `INFORME_UNIFICADO_MEJORA_BANDERAS_ROJAS_FISIOTERAPIA.md` | Gaps por grupo etario, propuesta 3 fases | No implementado — no hay prompts específicos neonatos/pediátricos/ancianos |
| `PROPUESTA_FLUJO_FOLLOWUP_Y_PROMPT_VERTEX_2026-02-14.md` | Hidratación perfil, in-clinic notes, HEP notes | ✅ Implementado en WO-PHASE1B |
| `PROFESSIONAL_PROFILE_INTEGRATION.md` | Inyección perfil en prompts | ✅ Implementado en Initial y Follow-up |
| `PROMPT_OPTIMIZATION_ANALYSIS.md` | Optimización para Ollama/timeouts | Obsoleto — se usa Vertex, no Ollama |
| `PromptBrainCA.ts` | Stub con red_flags, yellow_flags, CPO | Stub — no es el flujo principal; vertex-ai-soap-service usa buildPromptV3 en path alternativo |

### 3.2 SOAPPromptFactory vs buildFollowUpPromptV3

- **SOAPPromptFactory.buildFollowUpPrompt** y **buildOptimizedFollowUpPrompt**: usados por `vertex-ai-soap-service.generateSOAPNote` cuando `visitType === 'follow-up'` y `useOptimizedPrompt` — pero **ProfessionalWorkflowPage y FollowUpWorkflowPage usan buildFollowUpPromptV3 directamente** y llaman a `generateFollowUpSOAPV2Raw(fullPrompt)`.
- Por tanto, el flujo real de follow-up **no pasa por SOAPPromptFactory**; usa solo buildFollowUpPromptV3.
- SOAPPromptFactory.buildFollowUpPrompt **sí incluye** RED FLAGS y YELLOW FLAGS en el contexto, pero ese path no se usa en el flujo actual de follow-up.

---

## 4. ANÁLISIS POR CAPA

### 4.1 Capa Profesional (skills del fisio)

| Área | Implementación | Detalle |
|------|----------------|--------|
| Initial | ✅ | buildCapabilityContext, buildProfessionalContext, buildPracticePreferencesContext |
| Follow-up | ✅ | Mismos builders inyectados en buildFollowUpPromptV3 |
| Ongoing | N/A | No hay prompt IA |

**Retroalimentación:** Las capas no se "retroalimentan" dinámicamente. El perfil se lee una vez y se inyecta; no hay loop de ajuste según respuesta previa.

---

### 4.2 Capa Contexto (hospital, clínica, scope CPO)

| Área | Implementación | Gap |
|------|----------------|-----|
| Initial | CPO scope, Ontario, en-CA | No hay campo "hospitalario vs clínica privada vs inpatient vs outpatient" |
| Follow-up | "licensed clinical documentation assistant" | No menciona CPO, Ontario, ni tipo de contexto |
| Ongoing | N/A | — |

**Promesa iBooks:** "El colegio rector organizará la respuesta en función de lo que espera ese colegio del fisio si un día le toca auditar."  
**Estado:** El scope CPO está mencionado en Initial; en Follow-up es genérico. No hay diferenciación por tipo de establecimiento.

---

### 4.3 Capa Seguridad (banderas rojas/amarillas)

| Área | Implementación | Gap |
|------|----------------|-----|
| Initial | ✅ Lista explícita, wording "Clinical concern", medicolegal_alerts en JSON | Cobertura por edad no diferenciada |
| Follow-up | ❌ No hay | El clinical update puede contener nuevos síntomas de bandera roja sin detección |
| Ongoing | Form tiene campo redFlags (manual) | No hay IA; usuario documenta manualmente |

**Promesa iBooks:** "Consideración de potenciales bandera roja o amarilla que pongan en peligro la práctica profesional y legal."  
**Estado:** Initial cumple; Follow-up no incluye screening de banderas en el prompt.

---

## 5. UNIFICACIÓN DE CRITERIOS

### 5.1 Inconsistencias actuales

1. ~~**Follow-up sin banderas:**~~ **✅ CERRADO WO-PHASE1C P0** — buildFollowUpPromptV3 incluye CRITICAL SAFETY CHECK.
2. ~~**Contexto CPO en Follow-up:**~~ **✅ CERRADO WO-PHASE1C P1** — buildFollowUpPromptV3 incluye Ontario, CPO, scope.
3. **Tipo de establecimiento:** En ningún prompt hay campo para hospital vs clínica privada vs inpatient vs outpatient. (P2 — parking lot)
4. **Ongoing vs Follow-up:** Ongoing crea baseline sin IA; Follow-up consume ese baseline. No hay prompt unificado para "primera vez en AiDuxCare" con IA.

### 5.2 Criterios unificados (estado post WO-PHASE1C)

| Criterio | Initial | Follow-up | Estado |
|----------|---------|-----------|--------|
| Perfil profesional | ✅ | ✅ | Mantener |
| Scope CPO/Ontario | ✅ | ✅ | WO-PHASE1C P1 |
| Red/Yellow flags | ✅ | ✅ | WO-PHASE1C P0 |
| Tipo establecimiento | ❌ | ❌ | P2 — parking lot |

---

## 6. CONCLUSIONES

1. **Capa Profesional:** Implementada en Initial y Follow-up. Cumple la promesa de personalización por skills del fisio.
2. **Capa Contexto:** **✅ Actualizado WO-PHASE1C P1** — CPO/Ontario ahora en Initial y Follow-up. No hay diferenciación por tipo de establecimiento (P2 parking lot).
3. **Capa Seguridad:** **✅ Actualizado WO-PHASE1C P0** — Follow-up incluye CRITICAL SAFETY CHECK para red/yellow flags en el clinical update.
4. **Ongoing:** No produce prompts; es parser. La promesa iBooks no aplica directamente.
5. **Documentación vs código:** La base de conocimiento de banderas (`CONOCIMIENTO_BASE_BANDERAS_ROJAS`) no está integrada en el código; el prompt usa una lista fija. La propuesta de mejora por grupos etarios no está implementada.

**Última actualización:** 2026-02-14 — WO-PHASE1C P0+P1 implementado.

---

## 7. ARCHIVOS AUDITADOS

| Archivo | Propósito |
|---------|-----------|
| `src/core/ai/PromptFactory-Canada.ts` | Análisis Niagara (Initial/Follow-up analysis) |
| `src/core/soap/followUp/buildFollowUpPromptV3.ts` | Prompt SOAP Follow-up |
| `src/core/soap/SOAPPromptFactory.ts` | Prompts SOAP Initial y Follow-up (path legacy) |
| `src/core/ai/promptBrain/ca/PromptBrainCA.ts` | Stub con estructura red/yellow flags |
| `src/features/command-center/utils/ongoingFormToBaselineSOAP.ts` | Parser Ongoing → SOAP |
| `docs/architecture/CONOCIMIENTO_BASE_BANDERAS_ROJAS_FISIOTERAPIA_EVIDENCIA.md` | Base teórica banderas |
| `docs/proposals/PROPUESTA_FLUJO_FOLLOWUP_Y_PROMPT_VERTEX_2026-02-14.md` | Propuesta hidratación follow-up |
| `docs/workflow-optimization/PROFESSIONAL_PROFILE_INTEGRATION.md` | Integración perfil |

---

**Elaborado por:** Auditoría técnica (solo búsqueda teórica, sin implementación)
