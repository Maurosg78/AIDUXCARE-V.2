# WO-PHASE1C-003: Extender Override a INITIAL Assessment

**Work Order ID:** WO-PHASE1C-003  
**Priority:** P1 (High - UX Consistency)  
**Estimated Effort:** 4-6 horas  
**Assignee:** Cursor AI Team  
**Depends On:** WO-PHASE1C-002 (completado)  
**Created:** 2026-02-14  
**Target Completion:** 2026-02-15

---

## BUSINESS CONTEXT

**Problema identificado por CTO:**
> "El prompt de initial assessment recibe respuesta de vertex que incluyen 
> banderas rojas, pero no bloquea, podemos aunar criterios?"

**Situación actual (inconsistente):**
- INITIAL detecta red flags PERO no tiene override UI
- FOLLOW-UP detecta red flags Y tiene override UI completo
- UX confusa: fisio ve alerta en INITIAL sin forma de resolverla

**Solución:**
Extender el override mechanism de FOLLOW-UP a INITIAL assessment, manteniendo 
arquitectura unificada y experiencia consistente.

---

## USER STORY

```
Como fisioterapeuta,
Cuando realizo un INITIAL assessment,
Y el AI detecta red flags en la evaluación,
Quiero poder evaluar clínicamente esos hallazgos,
Y si determino que NO requieren derivación urgente,
Poder regenerar el SOAP sin la alerta,
Documentando mi razonamiento clínico,
IGUAL que en follow-up visits,
Para tener experiencia consistente en todos los flujos.
```

---

## TECHNICAL REQUIREMENTS

### 1. Identificar flujo INITIAL actual

**Archivos clave:**
- `src/pages/ProfessionalWorkflowPage.tsx` - Handler principal
- `src/services/vertex-ai-soap-service.ts` - Generación SOAP inicial
- `src/core/prompts/buildPromptV3.ts` - Builder de prompts (si existe)

**Investigar:**
```bash
# ¿Dónde se genera SOAP en INITIAL?
grep -r "generateSOAPNoteFromService\|organizeSOAPData" src/pages/ProfessionalWorkflowPage.tsx

# ¿Qué prompts usa INITIAL?
grep -r "buildPromptV3\|PromptFactory" src/services/vertex-ai-soap-service.ts
```

---

### 2. Agregar redFlagOverride a flujo INITIAL

**Opción A: Modificar vertex-ai-soap-service.ts**

Si INITIAL usa `generateSOAPNoteFromService`:

```typescript
// src/services/vertex-ai-soap-service.ts

export async function generateSOAPNoteFromService(
  context: SOAPContext,
  redFlagOverride?: { findings: string[]; clinicianReasoning: string } // NEW
): Promise<SOAPNote> {
  
  // Build prompt con override si se proporciona
  const promptWithOverride = redFlagOverride 
    ? addRedFlagOverrideToPrompt(basePrompt, redFlagOverride)
    : basePrompt;
  
  // ... rest of implementation
}

function addRedFlagOverrideToPrompt(
  prompt: string, 
  override: { findings: string[]; clinicianReasoning: string }
): string {
  return `${prompt}

OVERRIDE INSTRUCTION — CLINICIAN EVALUATION:

The clinician has evaluated the following findings and determined they do NOT 
constitute red flags requiring urgent medical referral at this time:

${override.findings.map(f => `- ${f}`).join('\n')}

Clinician's clinical reasoning:
${override.clinicianReasoning}

IMPORTANT:
- Do NOT recommend urgent medical review/referral for these findings
- Treat these symptoms as monitored findings within expected clinical pattern
- Include the clinician's reasoning in the Assessment section
- Suggest appropriate monitoring and follow-up timeline
- Document that clinician has assumed clinical responsibility for this determination
`;
}
```

**Opción B: Usar buildFollowUpPromptV3 también para INITIAL**

Unificar arquitectura usando el mismo builder:

```typescript
// Adaptar buildFollowUpPromptV3 para que funcione en INITIAL también
export function buildClinicalPromptV3(params: {
  visitType: 'initial' | 'follow-up';
  // ... params específicos por tipo
  redFlagOverride?: { findings: string[]; clinicianReasoning: string };
}): string {
  
  if (params.visitType === 'follow-up') {
    // Lógica actual de buildFollowUpPromptV3
  } else {
    // Lógica para INITIAL (similar estructura)
  }
  
  // Override común a ambos
  if (params.redFlagOverride) {
    // ... misma sección OVERRIDE INSTRUCTION
  }
}
```

---

### 3. Extender handleRegenerateWithoutRedFlags para INITIAL

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Current limitation:**
```typescript
// Línea actual que bloquea INITIAL
if (!followUpClinicalState?.baselineSOAP) return;
```

**Nueva implementación:**

```typescript
const handleRegenerateWithoutRedFlags = useCallback(async () => {
  if (!overrideRedFlags || overrideReasoning.trim().length < 20) {
    return;
  }

  setIsRegeneratingSOAP(true);

  try {
    const redFlagFindings = extractRedFlagFindings(localSoapNote!);

    // BRANCH: INITIAL vs FOLLOW-UP
    if (visitType === 'initial') {
      // INITIAL: usar vertex-ai-soap-service con override
      const organizedData = organizeSOAPData({
        niagaraResults,
        evaluationTests: selectedTests,
        transcript,
        // ... otros params
      });

      const regeneratedSOAP = await generateSOAPNoteFromService(
        organizedData.context,
        { findings: redFlagFindings, clinicianReasoning: overrideReasoning.trim() }
      );

      setLocalSoapNote(regeneratedSOAP);
      setRedFlagOverrideApplied(true);

      // Audit log
      await FirestoreAuditLogger.logEvent({
        userId: user!.uid,
        patientId: patientIdFromUrl!,
        eventType: 'red_flag_override',
        eventData: {
          visitType: 'initial',
          redFlagFindings,
          clinicianReasoning: overrideReasoning.trim(),
          originalSOAPPreview: localSoapNote!.assessment?.substring(0, 500),
        },
      });

    } else {
      // FOLLOW-UP: lógica actual (ya implementada en PHASE1C-002)
      const overridePrompt = buildFollowUpPromptV3({
        // ... params actuales
        redFlagOverride: {
          findings: redFlagFindings,
          clinicianReasoning: overrideReasoning.trim(),
        },
      });

      const response = await generateFollowUpSOAPV2Raw(overridePrompt);
      // ... rest of current implementation
    }

  } catch (error) {
    console.error('[REDFLAG-OVERRIDE] Error regenerating SOAP:', error);
    alert('Error regenerating SOAP. Please try again.');
  } finally {
    setIsRegeneratingSOAP(false);
  }
}, [visitType, overrideRedFlags, overrideReasoning, /* ... dependencies */]);
```

---

### 4. Actualizar condición de UI rendering

**Current (solo follow-up):**
```tsx
{visitType === 'follow-up' && soapContainsRedFlags && !redFlagOverrideApplied && localSoapNote && (
```

**New (ambos contextos):**
```tsx
{(visitType === 'initial' || visitType === 'follow-up') && 
 soapContainsRedFlags && 
 !redFlagOverrideApplied && 
 localSoapNote && (
```

---

## TESTING SCENARIOS

### Scenario 1: INITIAL con Red Flags → Override
```
Given: Paciente nuevo, INITIAL assessment
When: Transcripción incluye "severe headache, vision changes, nausea"
And: AI genera SOAP con "Recommend urgent medical referral based on red flags"
Then: 
  - Override UI aparece
  - Fisio marca checkbox
  - Escribe reasoning: "Post-concussion symptoms expected 2 weeks after MVA. 
    Neurology already consulted. Symptoms improving per patient report."
  - Click "Regenerate"
  - SOAP regenerado sin alerta de derivación
  - Assessment incluye reasoning del fisio
  - Audit log creado con visitType: 'initial'
```

### Scenario 2: INITIAL sin Red Flags → No Override UI
```
Given: Paciente nuevo, INITIAL assessment  
When: Transcripción incluye "mild knee pain after running"
And: AI genera SOAP sin red flags
Then: Override UI no aparece (comportamiento normal)
```

### Scenario 3: Regeneración Error en INITIAL
```
Given: Override UI visible en INITIAL
When: Click "Regenerate" pero vertex-ai-soap-service timeout
Then: 
  - Alert con mensaje de error
  - SOAP original intacto
  - Puede intentar de nuevo
```

---

## ACCEPTANCE CRITERIA

**Funcionalidad:**
- [ ] Override UI aparece en INITIAL cuando SOAP contiene red flags
- [ ] Override UI aparece en FOLLOW-UP cuando SOAP contiene red flags (no regresión)
- [ ] Click "Regenerate" en INITIAL llama a flujo correcto (vertex-ai-soap-service)
- [ ] Click "Regenerate" en FOLLOW-UP mantiene flujo actual (buildFollowUpPromptV3)
- [ ] SOAP regenerado en INITIAL no contiene alerta de red flags
- [ ] SOAP regenerado en INITIAL SÍ contiene reasoning del fisio en Assessment
- [ ] Audit log en INITIAL incluye visitType: 'initial'
- [ ] Audit log en FOLLOW-UP incluye visitType: 'follow-up'

**UX Consistency:**
- [ ] UI idéntica en INITIAL y FOLLOW-UP (checkbox + textarea + botón)
- [ ] Validaciones idénticas (min 20 chars)
- [ ] Mensajes de error consistentes
- [ ] Loading states consistentes

**No Regresión:**
- [ ] FOLLOW-UP override sigue funcionando (tests existentes passing)
- [ ] INITIAL sin override sigue generando SOAP normalmente
- [ ] Otros workflows no afectados

---

## DELIVERABLES

1. **Código:**
   - Modificar `vertex-ai-soap-service.ts` (agregar redFlagOverride param)
   - Modificar `handleRegenerateWithoutRedFlags` (branch INITIAL vs FOLLOW-UP)
   - Actualizar condición UI rendering (quitar `visitType === 'follow-up'`)

2. **Tests:**
   - Test: INITIAL con override genera SOAP sin red flags
   - Test: INITIAL sin override genera SOAP normal
   - Test: FOLLOW-UP override sigue funcionando (no regresión)

3. **Documentation:**
   - Actualizar `PHASE1C_CLOSURE_2026-02-14.md` (eliminar "Known Limitation")
   - Actualizar score AiDux: 93/100 → 98/100

---

## DEFINITION OF DONE

- [ ] Código implementado según spec
- [ ] Override funciona en INITIAL (manual test)
- [ ] Override funciona en FOLLOW-UP (no regresión)
- [ ] Audit trail verificado en Firestore (ambos visitTypes)
- [ ] Tests unitarios passing
- [ ] Build exitoso
- [ ] Deploy a pilot.aiduxcare.com
- [ ] UAT validation con caso INITIAL real
- [ ] Documentation actualizada
- [ ] CTO approval

---

**Created by:** CTO Mauricio Sobarzo  
**Date:** 2026-02-14  
**Status:** COMPLETED (2026-02-14)  
**Closure:** PHASE1C_CLOSURE_2026-02-14.md actualizado; score 98/100
