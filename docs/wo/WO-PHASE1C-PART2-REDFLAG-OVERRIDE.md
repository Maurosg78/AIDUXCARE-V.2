# WO-PHASE1C-PART2: Red Flag Override con Regeneración de SOAP

**Work Order ID:** WO-PHASE1C-002  
**Priority:** P1 (High)  
**Estimated Effort:** 1 día  
**Assignee:** Cursor AI Team  
**Depends On:** WO-PHASE1C-001 (completado)  
**Created:** 2026-02-14  
**Target Completion:** 2026-02-17

---

## BUSINESS CONTEXT

PHASE1C-001 implementó detección de red flags en follow-up prompts. Sin embargo, el fisio puede determinar clínicamente que ciertos hallazgos NO constituyen red flags verdaderas (ej. debilidad post-quirúrgica esperada, incontinencia temporal post-parto).

**Problema actual:**
- SOAP generado con red flags bloquea el workflow
- Fisio no puede continuar tratamiento si considera que los síntomas son parte de recuperación normal
- No hay mecanismo para override con justificación clínica

**Solución:**
- Checkbox "Override red flag alert"
- Campo obligatorio de justificación clínica
- Botón "Regenerate SOAP" que envía nuevo prompt a Vertex
- SOAP regenerado SIN alerta de derivación pero CON razonamiento del fisio documentado

---

## USER STORY

```
Como fisioterapeuta,
Cuando el AI detecta red flags en el clinical update,
Quiero poder evaluar clínicamente esos hallazgos,
Y si determino que NO requieren derivación urgente,
Poder regenerar el SOAP sin la alerta de red flags,
Documentando mi razonamiento clínico,
Para continuar el tratamiento de forma segura y justificada.
```

---

## TECHNICAL REQUIREMENTS

### 1. buildFollowUpPromptV3 — redFlagOverride param
### 2. ProfessionalWorkflowPage — Override UI + handleRegenerateWithoutRedFlags
### 3. extractRedFlagFindings helper
### 4. FirestoreAuditLogger — type 'red_flag_override'

---

**Created by:** CTO Mauricio Sobarzo  
**Date:** 2026-02-14  
**Status:** IMPLEMENTED
