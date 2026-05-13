# CTO Backlog Plan — 2026-05-13

**Estado:** Propuesta para aprobación CTO
**Fuente:** `scripts/exports/pending_aiduxcare-v2-uat-dev_2026-05-13T11-56-06.json`
**Pendientes activos:** 7
**SoT:** `ENGINEERING.md` v1.4

## Principio de Priorización

El backlog se ordena por continuidad clínica, confianza operativa y alineación con el Principio Sócrates:

```text
primero restaurar confianza básica,
luego estructurar contexto clínico,
luego mejorar UX,
luego pulir documentos.
```

No se debe construir más IA sobre datos mal clasificados. Cualquier mejora de razonamiento debe respetar:

```text
hecho documentado != inferencia IA != decisión del fisioterapeuta
```

## Workstream A — Confianza Operativa del Piloto

### A1. Email HEP perdido

**Feedback:** `tZ7UZevoEDWZe71bAyHh`
**Prioridad:** P0
**Objetivo:** Restaurar envío/visibilidad de terapia del día a pacientes desde follow-up.

**Criterio de cierre:**
- El botón de email HEP aparece cuando existe `plan`, `followUp`, `inClinicItems` o `homeProgramItems`.
- El email usa HEP/In-Clinic aceptado por el fisio, no solo texto libre del `plan`.
- Smoke manual con paciente follow-up confirma que el modal abre y muestra contenido.
- No se toca Cloud Function ni Resend salvo evidencia nueva de fallo backend.

**Archivos probables:**
- `src/components/workflow/tabs/SOAPTab.tsx`
- `src/components/workflow/PatientSummaryEmailModal.tsx`
- `src/pages/ProfessionalWorkflowPage.tsx`

**Riesgo:** Medio. Toca comunicación al paciente, pero acotado a UI/payload frontend.

**Aprobación CTO requerida:** Validar diff y smoke antes de marcar feedback resuelto.

---

## Workstream B — Sócrates / Memoria Longitudinal

### B1. Información Vertex valiosa se pierde

**Feedback:** `Q6SoxCsy8q254Gr9aAMF`
**Prioridad:** P1 estratégico
**Objetivo:** Evitar que señales clínicas útiles desaparezcan por limitarse al SOAP final.

**Decisión CTO propuesta:**
No guardar respuesta completa de Vertex como memoria canónica. Primero construir `ClinicalContextLedger` para separar:

- hechos documentados,
- observaciones IA,
- decisiones humanas,
- patrones longitudinales,
- preguntas no resueltas.

**Criterio de cierre inicial:**
- Existe builder MVP de `ClinicalContextLedger` desde datos ya persistidos.
- No hay nueva UI.
- No hay nueva llamada LLM.
- No se convierte una inferencia IA en decisión clínica.

**Archivos probables:**
- `src/core/socratic/types.ts`
- `src/core/socratic/clinicalContextLedger.ts`
- `src/core/socratic/__tests__/clinicalContextLedger.test.ts`
- `src/core/clinical-decisions/clinicalDecisionService.ts`
- `src/services/sessionComparisonService.ts`
- `src/services/followUpClinicalContextService.ts`

**Riesgo:** Bajo si se limita a tipos/builder. Alto si se intenta prompt/LLM antes de ledger.

**Aprobación CTO requerida:** Aprobar modelo de datos antes de persistencia Firestore.

### B2. Recomendaciones de pruebas físicas inadecuadas

**Feedback:** `nzmUXDng3E3wK98WOH52`
**Prioridad:** P1 clínico
**Objetivo:** Evitar sugerencias fuera de contexto, como evaluación cervical para fascitis plantar.

**Decisión CTO propuesta:**
No corregir solo el prompt. Resolver desde contexto:

- diagnóstico/área corporal probable,
- objetivo de evaluación,
- pruebas aceptadas/rechazadas por fisio,
- evidencia curada si existe,
- umbral para mostrar sugerencias.

**Criterio de cierre:**
- Las pruebas sugeridas tienen relación trazable con región, hipótesis o objetivo.
- Si el contexto es insuficiente, se muestra menos o se pide confirmación, no se inventa.
- No se presentan recomendaciones como órdenes clínicas.

**Archivos probables:**
- `src/core/ai/markets/es/buildAnalysisPrompt.es.ts`
- `src/utils/normalizers/normalizeClinicalResponse.shared.ts`
- `src/components/ClinicalAnalysisResults.tsx`
- futuro: `src/core/socratic/socraticThresholdEvaluator.ts`

**Riesgo:** Medio-alto. Impacta confianza clínica.

**Aprobación CTO requerida:** Diagnóstico de fuente antes de prompt fix.

### B3. Acciones clínicas visibles en historial

**Feedback:** `3Igq6r9Ix7kcY5qVcZpo`
**Prioridad:** P1 continuidad
**Objetivo:** Mostrar acciones clínicas relevantes sin obligar a navegar sesión por sesión.

**Decisión CTO propuesta:**
Conectar historial con decisiones clínicas persistidas, no solo con listado cronológico de sesiones.

**Criterio de cierre:**
- En historial del paciente se ven acciones clínicas relevantes: decisiones, red flags revisadas, medicamentos añadidos, puntos pendientes.
- Las acciones tienen fecha, sesión y fuente.
- No se duplican como diagnóstico ni recomendación.

**Archivos probables:**
- `src/pages/PatientHistoryPage.tsx`
- `src/core/clinical-decisions/clinicalDecisionService.ts`
- futuro: `src/core/socratic/types.ts`

**Riesgo:** Medio. Puede mejorar mucho continuidad, pero requiere diseño UI sobrio.

**Aprobación CTO requerida:** Mock/brief UI antes de implementación.

---

## Workstream C — Command Center / Preparación de Trabajo

### C1. Preparar paciente ongoing sin iniciar sesión

**Feedback:** `V8yIlD0gnU0HO5Bi4OQf`
**Prioridad:** P1 operativa
**Objetivo:** Permitir preparar trabajo para paciente ongoing sin abrir sesión clínica activa.

**Criterio de cierre:**
- Desde Command Center se puede añadir/preparar paciente ongoing para una fecha futura o actual.
- No se crea una sesión clínica incompleta innecesaria.
- No contamina `todayLists` entre fechas.
- No cambia SOAP ni flujo clínico.

**Archivos probables:**
- `src/features/command-center/CommandCenterPageSprint3.tsx`
- `src/services/todayListService.ts`
- posiblemente `src/features/command-center/utils/clinicalDayView.ts`

**Riesgo:** Medio. Toca Command Center, pero debe reutilizar `todayLists`.

**Aprobación CTO requerida:** Confirmar comportamiento esperado antes de código.

---

## Workstream D — UX de Documentación

### D1. Botón SOAP flotante

**Feedback:** `M2ZGxfV1dEthDQsjm4qj`
**Prioridad:** P2
**Objetivo:** Hacer visible la acción de generar SOAP sin obligar al usuario nuevo a llegar al final.

**Criterio de cierre:**
- Botón o acción persistente aparece solo cuando corresponde.
- No tapa contenido clínico.
- No duplica acciones ni genera SOAP sin revisión.
- Responsive en laptop y móvil.

**Archivos probables:**
- `src/pages/ProfessionalWorkflowPage.tsx`
- componentes de workflow/evaluación física

**Riesgo:** Bajo-medio. Principalmente UX.

**Aprobación CTO requerida:** Captura o mock antes de merge.

### D2. Certificados mejorados

**Feedback:** `Y9KqNkY0H6Smk3ZtaDnR`
**Prioridad:** P2
**Objetivo:** Mejorar redacción, uso de datos aportados por el fisio y formato imprimible.

**Criterio de cierre:**
- El certificado genera frases gramaticalmente correctas.
- Integra mejor los datos clínicos aportados por el fisio.
- Formato imprimible limpio.
- No inventa información no documentada.

**Archivos probables:**
- servicios/componentes de certificados por identificar en diagnóstico.
- locales si aplica.

**Riesgo:** Medio. Documento externo puede tener valor legal/administrativo.

**Aprobación CTO requerida:** Diagnóstico de flujo y plantilla antes de editar.

---

## Orden Recomendado

### Paso 1 — Cierre operacional

1. Validar y cerrar `tZ7UZevoEDWZe71bAyHh` si el fix HEP pasa smoke.

### Paso 2 — Base Sócrates sin UI

2. Commit de gobernanza y tipos: `ENGINEERING.md`, spec, `src/core/socratic/types.ts`.
3. Implementar `ClinicalContextLedger` builder desde datos existentes.
4. Tests unitarios del ledger.

### Paso 3 — Señales clínicas auditables

5. Diseñar `SocraticThresholdEvaluator`.
6. Atacar `nzmUXDng3E3wK98WOH52` usando reglas de contexto antes de prompt.

### Paso 4 — Continuidad visible

7. Diseñar historial de acciones clínicas (`3Igq6r9Ix7kcY5qVcZpo`).
8. Diseñar preparación ongoing en Command Center (`V8yIlD0gnU0HO5Bi4OQf`).

### Paso 5 — UX secundaria

9. Botón SOAP flotante.
10. Certificados mejorados.

## Decisiones CTO Solicitadas

1. ¿Se aprueba cerrar primero HEP como P0 operativo antes de más Sócrates?
2. ¿Se aprueba que `Q6SoxCsy8q254Gr9aAMF` quede absorbido por épica Sócrates / memoria longitudinal?
3. ¿Se aprueba no tocar prompts de pruebas físicas hasta tener diagnóstico de fuente y contexto?
4. ¿Se aprueba que el primer commit Sócrates sea solo gobernanza + tipos + specs, sin UI ni LLM?
5. ¿Se aprueba que cualquier persistencia nueva de Sócrates requiera revisión específica de privacidad/compliance antes de reglas Firestore?
