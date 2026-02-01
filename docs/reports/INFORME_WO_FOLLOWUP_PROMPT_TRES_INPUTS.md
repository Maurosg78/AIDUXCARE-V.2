# Informe: Follow-up — Tres inputs a Vertex, physio a cargo

**Fecha:** 2026-01-31  
**Alcance:** Solo follow-up. Initial assessment no fue tocado.  
**Objetivo:** Alimentar a Vertex con tres cosas editables por el physio; la P del SOAP generado es la base del siguiente follow-up.

---

## 1. Resumen ejecutivo

- **Build:** OK (Vite build en verde).
- **Evidencia de flujo:** OK (`node scripts/evidence-followup-prompt-flow.mjs` en verde).
- **Tests unitarios:** Añadidos en `src/core/soap/followUp/__tests__/buildFollowUpPromptV3.test.ts`. La suite Vitest en este entorno presenta error conocido (tinypool / Maximum call stack); ejecutar tests en CI o local cuando corresponda.

---

## 2. Tres inputs que configuran el prompt a Vertex

| # | Input | Origen en UI | Editable por physio |
|---|--------|----------------|----------------------|
| 1 | **Qué se hizo en sesión hoy (in-clinic)** | Checklist "Today's in-clinic treatment" (ítems con check "realizado hoy" y notas) | Sí: editar ítem, notas, marcar/desmarcar |
| 2 | **HEP prescrito (Home Exercise Program)** | Bloque "Home Exercise Program (HEP)" (lista derivada del plan anterior) | Sí: editar o eliminar cada ítem |
| 3 | **Feedback de la sesión** | Área de transcripción / nota clínica ("Follow-up clinical update") | Sí: texto libre dictado o escrito |

Todo lo que se envía a Vertex proviene de datos que el physio puede editar o ampliar; no hay caja negra.

---

## 3. Cambios realizados (solo follow-up)

### 3.1 Builder del prompt follow-up v3

- **Archivo:** `src/core/soap/followUp/buildFollowUpPromptV3.ts` (creado).
- **Entrada:** `baseline`, `clinicalUpdate`, `inClinicToday` (opcional), `homeProgramPrescribed` (opcional).
- **Salida:** Prompt con secciones:
  - CLINICAL BASELINE (Previous Session)
  - WHAT WAS DONE IN SESSION TODAY (In-Clinic) — si hay `inClinicToday`
  - HOME PROGRAM PRESCRIBED (HEP) — si hay `homeProgramPrescribed`
  - TODAY'S CLINICAL UPDATE (transcript/feedback)
  - TASK INSTRUCTIONS (Clinical)

### 3.2 FollowUpWorkflowPage

- Llama a `buildFollowUpPromptV3` con:
  - `baseline` desde `clinicalState.baselineSOAP`
  - `clinicalUpdate` = transcript
  - `inClinicToday` = `inClinicItems` (label, completed, notes)
  - `homeProgramPrescribed` = `homeProgramItems` (si hay ítems)

### 3.3 ProfessionalWorkflowPage (solo cuando `visitType === 'follow-up'`)

- Inyecta en el contexto de SOAP (para el prompt genérico de follow-up):
  - `todayFocus` = `inClinicItems` (ya existía).
  - `homeProgramPrescribed` = `homeProgramItems` (nuevo).
- **Initial assessment:** No se toca; `focusToInject` y `homeProgramPrescribed` solo se asignan cuando `visitType === 'follow-up'`.

### 3.4 SOAPContext y SOAPPromptFactory

- **SOAPContext:** Campo opcional `homeProgramPrescribed?: string[]` (solo usado en follow-up).
- **buildFollowUpPrompt (SOAPPromptFactory):** Si `context.homeProgramPrescribed` tiene ítems, se añade la sección "HOME PROGRAM PRESCRIBED (HEP)" al prompt.

---

## 4. Continuidad: P del SOAP → base del siguiente follow-up

- El SOAP generado en esta visita incluye una sección **Plan (P)**.
- Esa P es la que se persiste como baseline (o plan de tratamiento) para la siguiente visita.
- En la siguiente visita, el sistema muestra de nuevo: qué se hizo en sesión (derivado de esa P), HEP (derivado de esa P) y el área de feedback.
- Así se mantiene la secuencia: initial → primer SOAP → follow-up 1 → SOAP 1 → follow-up 2 → … hasta el alta.

---

## 5. Principio: physio a cargo

- Cada ítem que se devuelve o entrega a Vertex puede ser editado o tener espacio para información extra.
- El physio puede no considerar, eliminar o añadir contenido en in-clinic, HEP y feedback antes de generar el SOAP.

---

## 6. Verificación

| Verificación | Resultado |
|--------------|-----------|
| `npm run build` | OK |
| `node scripts/evidence-followup-prompt-flow.mjs` | OK (flujo mínimo y flujo completo con tres inputs) |
| Tests unitarios `buildFollowUpPromptV3` | Añadidos; suite Vitest con error conocido en este entorno (tinypool) |
| Initial assessment | No modificado (gates `visitType === 'follow-up'`) |

---

## 7. Archivos tocados

| Archivo | Alcance |
|---------|---------|
| `src/core/soap/followUp/buildFollowUpPromptV3.ts` | Nuevo; solo follow-up |
| `src/core/soap/followUp/__tests__/buildFollowUpPromptV3.test.ts` | Nuevo; tests del builder |
| `src/core/soap/followUp/__tests__/__snapshots__/buildFollowUpPromptV3.test.ts.snap` | Actualizado (nueva línea TASK) |
| `src/pages/FollowUpWorkflowPage.tsx` | Pasa inClinicToday y homeProgramPrescribed a buildFollowUpPromptV3 |
| `src/pages/ProfessionalWorkflowPage.tsx` | Solo follow-up: inyecta homeProgramPrescribed en context |
| `src/core/soap/SOAPContextBuilder.ts` | Campo opcional homeProgramPrescribed |
| `src/core/soap/SOAPPromptFactory.ts` | Sección HEP en buildFollowUpPrompt cuando homeProgramPrescribed existe |
| `scripts/evidence-followup-prompt-flow.mjs` | Nuevo; evidencia de flujo sin Vitest |

Initial assessment: sin cambios en flujo ni en prompts específicos de initial.
