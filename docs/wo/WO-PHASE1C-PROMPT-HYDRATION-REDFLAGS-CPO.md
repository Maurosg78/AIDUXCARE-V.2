# WO-PHASE1C: Hidratación de Prompts — Red Flags + CPO en Follow-up

**Work Order ID:** WO-PHASE1C-001  
**Priority:** P0 (Critical) + P1 (High)  
**Estimated Effort:** 2 días (Opción A) / 1 semana (Opción B)  
**Assignee:** Cursor AI Team  
**CTO Approval:** Required before implementation  
**Created:** 2026-02-14  
**Target Completion:** 2026-02-21 (Opción A) / 2026-02-28 (Opción B)  
**Referencia:** INFORME_AUDITORIA_PROMPTS_3_CAPAS_2026-02-14.md

---

## EXECUTIVE SUMMARY

Cerrar los gaps críticos identificados en la auditoría de prompts contra la promesa iBooks. El follow-up actual **no** incluye screening de banderas rojas/amarillas ni contexto CPO, exponiendo al fisio a riesgo legal y profesional cuando el clinical update contiene nuevos síntomas de derivación.

**Problema actual:**
- Follow-up prompt NO instruye al modelo a detectar red flags en el clinical update
- Follow-up prompt NO menciona CPO, Ontario, ni scope regulado
- Escenario peligroso: "Nuevo dolor nocturno, pérdida de peso 5kg" → SOAP podría decir "Continue treatment plan" sin recomendar derivación

**Resultado deseado:**
- P0: Instrucciones explícitas de screening de banderas en buildFollowUpPromptV3
- P1: Contexto CPO/Ontario en follow-up (consistencia con Initial)
- P2 (opcional): Captura e inyección de tipo de establecimiento (hospital vs clínica)

---

## BUSINESS CONTEXT

### Promesa iBooks vs Realidad

| Promesa | Initial | Follow-up | Gap |
|---------|---------|-----------|-----|
| Banderas rojas que protejan práctica legal | ✅ | ❌ | **P0** |
| Scope del colegio rector (CPO) | ✅ | ❌ | **P1** |
| Contexto hospital vs clínica privada | ❌ | ❌ | P2 |

### Escenario de Riesgo (P0)

```
Patient update: "Nuevo dolor nocturno intenso, pérdida de peso 5kg en 2 semanas"
→ Prompt actual NO instruye detectar bandera roja
→ Vertex podría generar: "Continue current plan, progress exercises"
→ Fisio pierde oportunidad de documentar y derivar al médico
→ Riesgo legal/profesional si no se detecta neoplasia
```

### Consistencia Regulatoria (P1)

- Auditoría CPO esperaría scope consistency en todas las notas
- Follow-up genérico ("licensed clinical assistant") podría sugerir fuera de scope
- Initial ya incluye: "CPO scope", "Ontario, Canada", "CPA/CPO/CAPR standards"

---

## TECHNICAL REQUIREMENTS

### P0 — Red Flags Screening en Follow-up (CRÍTICO)

**Archivo:** `src/core/soap/followUp/buildFollowUpPromptV3.ts`

**Ubicación:** Después de "CONTEXT — TODAY'S CLINICAL UPDATE" y antes de "TASK"

**Texto a añadir:**

```
CRITICAL SAFETY CHECK — RED FLAGS / YELLOW FLAGS

Review today's clinical update for NEW red flags or yellow flags that were NOT present at baseline.
If the patient reports any of the following, you MUST document them clearly and recommend medical review/referral:

Red flags (urgent — document and recommend referral):
- Neurological changes: new weakness, numbness, incontinence, saddle anesthesia
- Night pain (especially if new or worsening)
- Unexplained weight loss
- Symptom escalation despite treatment
- Systemic signs: fever, infection
- Major trauma, progressive weakness
- Cancer history with new symptoms
- Medication interactions (NSAIDs + SSRIs/SNRIs)

Yellow flags (monitor — document for clinical awareness):
- Fear avoidance, catastrophizing
- Work/compensation concerns
- Poor adherence patterns
- Psychosocial barriers to recovery

Wording: Use "Clinical concern: [finding]. Recommend medical review/referral based on red flags."
Do NOT use diagnostic language. Do NOT ignore red flags in the update.
If no new flags: Omit this section. Do NOT invent flags.
```

**Acceptance Criteria:**
- [ ] Sección CRITICAL SAFETY CHECK añadida al prompt
- [ ] Instrucciones claras de wording ("Clinical concern", no diagnóstico)
- [ ] Lista alineada con PromptFactory-Canada (consistencia)
- [ ] Test unitario: prompt contiene "CRITICAL SAFETY CHECK" y "red flags"
- [ ] No regresión en SOAP generado cuando no hay banderas

---

### P1 — Contexto CPO en Follow-up (ALTO)

**Archivo:** `src/core/soap/followUp/buildFollowUpPromptV3.ts`

**Ubicación:** En "SYSTEM / INSTRUCTION", reemplazar o ampliar la primera línea

**Texto actual:**
```
You are a licensed clinical documentation assistant supporting a follow-up visit.
```

**Texto objetivo:**
```
You are a clinical documentation assistant for a registered physiotherapist in Ontario, Canada.
Scope: CPO (College of Physiotherapists of Ontario) regulated practice.
Ensure all suggestions and documentation are within physiotherapy scope per CPO standards.
This is a follow-up visit — focus on changes and progress, not re-evaluation.
```

**Acceptance Criteria:**
- [ ] Prompt menciona "Ontario, Canada"
- [ ] Prompt menciona "CPO" y "physiotherapy scope"
- [ ] Consistencia con buildInitialAssessmentPrompt (SOAPPromptFactory)
- [ ] Test unitario: prompt contiene "CPO" y "Ontario"

---

### P2 — Tipo de Establecimiento (OPCIONAL — Opción B)

**Alcance:** Captura en onboarding + inyección en prompts

**Campos propuestos (ProfessionalProfile o ClinicProfile):**
```typescript
clinicType?: 'hospital' | 'private_clinic' | 'home_health' | 'sports_facility' | 'rehab_centre';
patientType?: 'inpatient' | 'outpatient' | 'mixed';
```

**Inyección en prompt:**
```
Setting: {clinicType} — {patientType}
Adapt language and coordination expectations accordingly.
- Hospital/inpatient: multi-disciplinary coordination, acuity awareness
- Private clinic/outpatient: continuity, one-on-one care focus
```

**Acceptance Criteria (si se implementa):**
- [ ] Campo clinicType en onboarding (opcional)
- [ ] Campo patientType en onboarding (opcional)
- [ ] buildProfessionalContext o nueva función incluye setting
- [ ] Initial y Follow-up reciben setting en prompt

**Nota:** P2 queda como parking lot si se elige Opción A.

---

## IMPLEMENTATION PLAN

### Opción A: Quick Win (2 días) — RECOMENDADA

| Día | Tarea | Archivos |
|-----|-------|----------|
| 1 | P0: Añadir CRITICAL SAFETY CHECK a buildFollowUpPromptV3 | buildFollowUpPromptV3.ts |
| 1 | Tests unitarios para P0 | buildFollowUpPromptV3.test.ts |
| 2 | P1: Añadir contexto CPO a SYSTEM/INSTRUCTION | buildFollowUpPromptV3.ts |
| 2 | Tests unitarios para P1 | buildFollowUpPromptV3.test.ts |
| 2 | Build + lint + smoke test | — |

**Deploy:** Inmediato tras aprobación CTO

---

### Opción B: Complete (1 semana)

| Día | Tarea |
|-----|-------|
| 1-2 | Todo de Opción A |
| 3 | P2: Diseño de campos clinicType, patientType en ProfessionalProfile |
| 4 | P2: UI onboarding para captura (opcional) |
| 5 | P2: Inyección en buildProfessionalContext / buildFollowUpPromptV3 |
| 6 | P2: Inyección en PromptFactory-Canada (Initial) |
| 7 | Tests, documentación, deploy |

---

## RISK ASSESSMENT

| Riesgo | Mitigación |
|--------|------------|
| Prompt demasiado largo | Sección red flags es ~400 tokens; total prompt sigue <4K tokens |
| Falsos positivos (inventar banderas) | Instrucción explícita: "If no new flags: Omit. Do NOT invent." |
| Regresión en SOAP sin banderas | Test con clinical update neutro; comparar output antes/después |
| CPO wording demasiado restrictivo | Usar mismo tono que Initial (ya aprobado) |

---

## DEPENDENCIES

- Ninguna. buildFollowUpPromptV3 es autónomo.
- No requiere cambios en Vertex proxy ni en ProfessionalWorkflowPage (solo en el string del prompt).

---

## DEFINITION OF DONE

**P0 + P1 (Opción A):**
- [ ] buildFollowUpPromptV3 incluye sección CRITICAL SAFETY CHECK
- [ ] buildFollowUpPromptV3 incluye contexto CPO/Ontario en SYSTEM
- [ ] Tests unitarios pasan (incl. escenario B abajo)
- [ ] Build exitoso
- [ ] Documentación actualizada (INFORME_AUDITORIA — marcar gaps cerrados)
- [ ] CTO approval para deploy

**A. Línea exacta de inserción (P0):**
- Después de: `${(clinicalUpdate ?? '').trim() || 'No additional clinical update provided.'}`
- Antes de: `${inClinicSection}${adjustmentsSection}${hepSection}TASK`
- Ubicación: entre CONTEXT — TODAY'S CLINICAL UPDATE y TASK

**B. Test scenario específico (DoD):**
- Clinical update con bandera roja simulada: "Patient reports new night pain and 5kg weight loss in 2 weeks"
- Verificar que el prompt generado incluye la sección CRITICAL SAFETY CHECK
- Verificar que el SOAP resultante (manual o con Vertex) documentaría o recomendaría derivación

**C. Logging para validación:**
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('[buildFollowUpPromptV3] Prompt includes CRITICAL SAFETY CHECK:', 
    prompt.includes('CRITICAL SAFETY CHECK'));
}
```

---

## CTO APPROVAL (2026-02-14)

**Decisión:** ☑ APROBADO — Opción A (2 días)  
**Incluye:** P0 (Red Flags) + P1 (CPO Context)  
**Razón para NO elegir Opción B:** P2 no es crítico ahora

**Condiciones de aprobación:**
1. ✅ Agregar al DoD el test scenario específico (punto B arriba)
2. ✅ Especificar línea exacta de inserción (punto A arriba)
3. ✅ Agregar logging para validación (punto C arriba)

**Durante implementación:**
- Branch: `feature/phase1c-redflags-cpo-followup`
- Commit: `feat(prompts): P0+P1 - Add red flags + CPO context to follow-up`
- Test manual con caso real (ej. Matthew Procotor con síntoma de bandera roja simulado)

**Post-deploy:**
- Actualizar `INFORME_AUDITORIA_PROMPTS_3_CAPAS_2026-02-14.md` marcando gaps cerrados
- Tag: `v0.2.1-phase1c-redflags-cpo`

**Target Deploy:** 2026-02-16 (2 días)  
**Firma:** CEO Mauricio Sobarzo | CTO Claude

---

## REFERENCIAS

- `docs/reports/INFORME_AUDITORIA_PROMPTS_3_CAPAS_2026-02-14.md`
- `src/core/ai/PromptFactory-Canada.ts` (lista red flags líneas 89-92)
- `docs/architecture/CONOCIMIENTO_BASE_BANDERAS_ROJAS_FISIOTERAPIA_EVIDENCIA.md`
- `src/core/soap/SOAPPromptFactory.ts` (buildInitialAssessmentPrompt — rol y scope)

---

## CTO DECISION (HISTÓRICO)

**Estado:** APROBADO — Opción A (ver sección CTO APPROVAL arriba)
