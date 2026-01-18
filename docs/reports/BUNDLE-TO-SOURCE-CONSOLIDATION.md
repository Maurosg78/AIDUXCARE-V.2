# Consolidación: Bundle → Código Fuente (Piloto AiDuxCare)

**Fecha:** 2025-01-18  
**Objetivo:** Alinear prioridades del piloto basándose en análisis del bundle compilado vs. código fuente

---

## 1. Hallazgos consolidados (Bundle → Fuente)

### A) Guardrails clínicos (Prompt CORE)

**Bundle encontrado:**
- "Expose clinical variables. Never diagnose."
- "Red flags: NSAIDs+SSRIs/SNRIs MUST be red_flags"
- "Include clinical concern and referral urgency"

**Fuente localizado:**
- `src/core/ai/PromptFactory-Canada.ts` (líneas 22-23, 46, 88)
- `src/utils/cleanVertexResponse.ts` (líneas 14, 237, 275)
- `src/services/VertexAIServiceViaFirebase.ts` (línea 125)

**Riesgo identificado:**
- Frases tipo "Medication overdose risk... Urgent referral" pueden sonar a diagnóstico definitivo.
- Texto debe ser "risk/concern + recommend medical review", no sentencia.

**Acción requerida (ToDo 4):**
- Ajustar wording en `PromptFactory-Canada.ts` línea 88:
  - Cambiar frases diagnósticas por: "Clinical concern: ..."
  - Mantener "recommend medical review / referral based on red flags"
  - Enfatizar "never diagnose" como regla dominante

---

### B) SOAP Builder / Plan serialization

**Bundle encontrado:**
- "Treatment plan is object, will serialize"
- "Plan length after formatting"

**Fuente localizado:**
- `src/services/vertex-ai-soap-service.ts` (líneas 566, 577, 582)

**Riesgo identificado:**
- Si `plan` viene como objeto (Gemini/Vertex a veces devuelve estructuras), el serializador puede:
  - "Aplastar" contenido (perder fields)
  - Generar strings gigantes
  - Colar texto raw sin formato clínico

**Acción requerida (ToDo 3):**
- En `vertex-ai-soap-service.ts` línea 577-582:
  - Validar objeto antes de serializar (esquema estable, orden fijo)
  - Limitar tamaño máximo (ej: 2000 chars, cortar con "...")
  - Fallback a "Not documented" si inválido
  - Asegurar que serialización es consistente (mismo orden de fields)

---

### C) Workflow detection & routing (initial vs follow-up)

**Bundle encontrado:**
- `AUTO_FOLLOW_UP: 80`, `SUGGEST_FOLLOW_UP: 60`
- `skipTabs`, `directToTab`, `analysisLevel`
- Señales: visitas recientes, keywords, consultationType

**Fuente localizado:**
- `src/services/followUpDetectionService.ts` (líneas 88-89, 408-417)
- `src/services/workflowRouterService.ts` (líneas 28-30, 65-67, 81-83)

**Riesgo identificado:**
- Falsa detección → manda a SOAP sin análisis cuando sí lo necesitabas, o viceversa
- Confidence en zona gris (60-79) → saltos automáticos pueden ser incorrectos

**Acción requerida (ToDo 2):**
- En `followUpDetectionService.ts` línea 408-417:
  - Exponer `confidence`, `rationale[]`, `recommendedWorkflow`, `directToTab` (aunque sea en consola)
  - Si `confidence` está en zona gris (60-79), NO saltar tabs automáticamente; solo sugerir
  - Agregar logging explicativo: `console.log('[Workflow] Detection result:', { confidence, rationale, recommendedWorkflow })`

---

### D) Auto-save / restore / cleanup (posible fuente #1 de bugs raros)

**Bundle encontrado:**
- Guardado cada 30s + beforeunload
- Limpieza "ONCE" para initial evaluation si no hay data
- Protección: si hay transcript/analysis/tests/attachments, NO limpia

**Fuente localizado:**
- `src/services/session-storage.ts` (líneas 4-32)
- `src/hooks/useSessionPersistence.ts` (líneas 10-44)
- `src/pages/ProfessionalWorkflowPage.tsx` (líneas 212, 802, 861, 889, 979, 993-1004)

**Riesgo identificado:**
- Keys de session storage solo usan `patientId`: `aidux_${patientId}`
- No incluye `userId`, `visitType`, ni `sessionId` real
- Puede colisionar entre:
  - Diferentes usuarios viendo mismo paciente
  - Initial vs follow-up del mismo paciente
  - Sesiones distintas del mismo paciente

**Acción requerida (ToDo 1):**
- En `session-storage.ts` línea 4-32:
  - Cambiar key de `aidux_${patientId}` a `aidux_${userId}_${patientId}_${visitType}_${sessionId}`
  - Asegurar que `clearSession()` solo borre sesiones del `visitType` específico
  - Validar que `saveSession()` y `getSession()` usan la misma key structure

---

### E) Feedback modal con contexto enriquecido

**Bundle encontrado:**
- Captura: URL, workflowStep, patientType, isPilotUser, experiencia, workflowState

**Fuente localizado:**
- `src/services/feedbackService.ts` (líneas 447-495)
- `src/components/workflow/WorkflowFeedback.tsx` (líneas 36-81)

**Riesgo identificado:**
- `getEnrichedContext()` puede incluir transcript literal si está en `workflowState`
- PII/PHI accidental en feedback si metes transcript o texto clínico en descripción

**Acción requerida (ToDo 5):**
- Revisar `feedbackService.ts` método `getEnrichedContext()`:
  - Confirmar que NO incluye transcript literal
  - Si `workflowState` tiene transcript, solo incluir métricas (hasTranscript: true/false)
  - Sanitizar cualquier dato que pueda contener PHI antes de enviar

---

### F) Hospital Portal: secure note + rate limit + retention

**Bundle encontrado:**
- `AES-256-GCM`, `noteCode`, password policy fuerte, 24/48h, sesión 5 min, rate limit 5 intentos

**Fuente localizado:**
- `src/services/hospitalPortalService.ts` (líneas 100-106, 178, 219, 319, 490, 826, 887-942)
- `src/services/hospitalPortalEncryption.ts` (líneas 4, 10, 67)

**Estado:**
- ✅ Implementación robusta
- ⚠️ Revisar `btoa(unescape(encodeURIComponent()))` para token: ok-ish pero frágil
- ⚠️ "Clipboard auto-clear" best-effort; no garantizado (nota para UX)

---

### G) Encounters/Episodes (índices Firestore / precondition)

**Bundle encontrado:**
- `failed-precondition`, "index is currently building"

**Fuente localizado:**
- `src/repositories/encountersRepo.ts` (línea 122)
- `src/repositories/episodesRepo.ts` (línea 105)
- `src/features/command-center/hooks/useTodayAppointmentsCount.ts` (línea 53)
- `src/features/patient-dashboard/hooks/usePatientVisitCount.ts` (línea 44)
- `src/services/followUpDetectionService.ts` (línea 196)
- `src/services/sessionComparisonService.ts` (línea 228)

**Estado:**
- ✅ Manejo de errores de índice presente
- ⚠️ Algunos servicios pueden fallar silenciosamente si el índice no está listo

---

## 2. Prioridades consolidadas (orden por impacto)

1. **Auto-save/restore keys (ToDo 1)** — Riesgo ALTO: pérdida de datos
2. **Workflow routing logging (ToDo 2)** — Riesgo MEDIO: experiencia de usuario
3. **SOAP plan validation (ToDo 3)** — Riesgo MEDIO: calidad de output
4. **Compliance wording (ToDo 4)** — Riesgo BAJO-MEDIO: cumplimiento legal
5. **Feedback sanitization (ToDo 5)** — Riesgo BAJO-MEDIO: privacidad

---

## 3. Mapa de archivos (quick reference)

### Archivos a modificar:

1. **`src/services/session-storage.ts`** (ToDo 1)
   - Líneas: 4-32
   - Cambio: keys de session storage

2. **`src/services/followUpDetectionService.ts`** (ToDo 2)
   - Líneas: 408-417
   - Cambio: logging de confidence/rationale

3. **`src/services/vertex-ai-soap-service.ts`** (ToDo 3)
   - Líneas: 577-582
   - Cambio: validación y límite de tamaño de plan

4. **`src/core/ai/PromptFactory-Canada.ts`** (ToDo 4)
   - Líneas: 22-23, 88
   - Cambio: wording de prompts

5. **`src/services/feedbackService.ts`** (ToDo 5)
   - Líneas: ~200-300 (getEnrichedContext)
   - Cambio: sanitización de PHI

---

## 4. Comandos de verificación post-fix

```bash
# Verificar que session keys incluyen userId + visitType
rg -n "aidux_\${" src/services/session-storage.ts

# Verificar que workflow logging expone confidence
rg -n "console\.log.*confidence|console\.log.*rationale" src/services/followUpDetectionService.ts

# Verificar que SOAP plan tiene límite de tamaño
rg -n "plan.*length|plan.*substring|plan.*slice" src/services/vertex-ai-soap-service.ts

# Verificar que prompts no usan frases diagnósticas
rg -n "diagnose|is\\.has\\.|sentencia" src/core/ai/PromptFactory-Canada.ts -i

# Verificar que feedback no incluye transcript literal
rg -n "transcript|PHI|PII" src/services/feedbackService.ts -i
```

---

## 5. Próximos pasos

1. ✅ Consolidación completada
2. ⏳ Implementar ToDos 1-5 (en orden de prioridad)
3. ⏳ Verificar con comandos de validación
4. ⏳ Deploy y monitoreo en piloto

---

**Nota CTO:** Este documento consolida hallazgos del bundle compilado con el código fuente real. Todas las acciones son **estabilización**, no "feature work". Objetivo: **no perder datos + no bloquear flujo + cumplimiento clínico**.
