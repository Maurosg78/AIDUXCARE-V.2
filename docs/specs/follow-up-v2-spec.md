# AiduxCare Clinical Intelligence — Follow-up Workflow v2

**Especificación de diseño · Fase 2 del piloto**  
Basado en feedback clínico real · Marzo 2026

---

## 1. Contexto y origen

Este documento especifica el rediseño del flujo de follow-up de AiduxCare, basado en el feedback clínico recibido al cierre de la Fase 1 del piloto en España. El hallazgo central: la memoria longitudinal reduce significativamente la carga cognitiva entre pacientes, pero el flujo de pantalla no refleja cómo el fisio realmente trabaja en sala.

**Principio rector:** la UI debe seguir el flujo cognitivo clínico real, no la estructura técnica del sistema.

### 1.1 Problema identificado

El workflow actual mezcla en la misma pantalla tres momentos clínicamente distintos:

- **Contexto previo** (pasado, read-only): qué se hizo, qué se mandó a casa
- **Estado actual** (presente, captura activa): cómo llega el paciente hoy
- **Plan de sesión** (decisión clínica): qué se va a hacer ahora

Esta mezcla obliga al fisio a hacer scroll y saltar visualmente entre información de distintos momentos temporales, aumentando la carga cognitiva exactamente donde debería reducirla.

### 1.2 Flujo cognitivo real del fisio

| Momento | Qué necesita el fisio |
|---------|------------------------|
| Antes de que entre el paciente | Contexto: quién es, qué hicimos, foco propuesto para hoy |
| El paciente entra — escucha | Capturar cómo llega: dolor, cumplimiento HEP, cambios desde última sesión |
| Después de escuchar — decide | ¿El plan previsto sigue siendo válido? Ajustar si es necesario |
| Durante la sesión — ejecuta | Plan de hoy (in-clinic) ajustado + grabación principal |
| Al cerrar la sesión | SOAP en **una** llamada a Vertex con todo el contexto acumulado |

---

## 2. Flujo — Especificación

Cada paso corresponde a un momento clínico distinto. La UI debe separarlos visualmente. El fisio nunca debe buscar — la información correcta aparece en el momento correcto.

### Decisión CTO — Marzo 2026: flujo simplificado a 4 momentos clínicos + SOAP

**Eliminados Pasos 3 y 4 del spec original (propuesta intermedia de Vertex).**

*Razón clínica:* el fisio no necesita que la IA proponga ejercicios antes de la sesión. El plan previo ya está cargado y editable en «Today's in-clinic treatment». El fisio ajusta ese plan después de escuchar al paciente (Paso 2) y ejecuta.

*Razón técnica:* elimina una llamada duplicada a Vertex AI (~$0.00143 USD por sesión) y el problema de persistencia de propuestas rechazadas (pregunta abierta resuelta).

**Flujo final confirmado:**

1. **Contexto previo** (tarjeta compacta) — implementado · Sprint A / B (UI)
2. **¿Cómo llega hoy?** (audio corto — subjetivo) — Sprint B (spec) / preparación
3. **Plan de hoy** («Today's in-clinic treatment» editable) — implementado · WO-FU-PLAN-SPLIT-01
4. **Grabación de sesión** — implementado · mismo comportamiento que v1
5. **Generar SOAP** (**una** llamada a Vertex con todo el contexto) — implementado

**Inputs a Vertex en la llamada única de SOAP:**

- HEP cumplimiento (`hepCompliance` del contexto inicial)
- Subjetivo del paciente (`subjectiveAudioTranscript` del Paso 2, cuando exista)
- Plan ejecutado hoy (`inClinicItems` aprobados en «Today's in-clinic treatment»)
- Grabación completa de la sesión (transcripción principal)
- Baseline clínico del paciente
- Perfil del fisio (`specialty`, `practiceAreas`, `techniques`, etc.)

### PASO 1 — Presentación del paciente

- **Modo:** Read-only — contexto antes de que entre el paciente
- **Contenido:** Nombre del paciente · Foco propuesto para hoy (`nextSessionFocus`) · Assessment de última sesión (2-3 líneas) · HEP enviado a casa (lista clickeable)
- **HEP clickeable:** Cada ítem del HEP tiene checkbox: ¿Lo hizo? El fisio marca antes de empezar la sesión. Se persiste como evento de cumplimiento (`hepCompliance`) — no como nota narrativa.
- **Fuente de datos:** `previousTreatmentPlan.nextSessionFocus` · `followUpClinicalState.baselineSOAP.assessment` · `homeProgramItems` (derivados del plan)
- **Firestore:** `hepCompliance: { itemId, done, date }` — **canon:** documento `sessions/{id}` (fuente de verdad única)
- **Estado UI:** Tarjeta única, siempre visible, sin colapsables. Tres secciones separadas por `border-t`.

### PASO 2 — ¿Cómo llega hoy?

- **Tipo:** Subjetivo — captura de audio corta antes del examen
- **Propósito clínico:** Capturar el estado actual del paciente en sus propias palabras: nivel de dolor, cumplimiento del HEP, cambios desde la última sesión, preocupaciones nuevas.
- **Implementación:** Clip de audio independiente (no la grabación principal de la sesión). Duración típica: 1-3 minutos. Un solo botón: Iniciar / Detener.
- **Por qué independiente:** Trazabilidad clara (este audio = Subjetivo). Consentimiento más limpio. STT rápido y barato. Puede retenerse o borrarse por separado según política. STT anclado al pipeline ya aprobado para piloto (p. ej. Whisper existente), sin nueva infra ad hoc.
- **Output:** Transcripción etiquetada como `subjectiveAudio` — se inyecta al prompt de Gemini como Subjetivo inicial antes de la transcripción principal.
- **Firestore:** `subjectiveAudioTranscript: string` — campo nuevo en `sessions/{id}`
- **Evolución futura:** Si el campo reporta fricción en campo, evolucionar a stream único con marcadores de tiempo. No en esta iteración.

### PASO 3 — Plan de hoy (in-clinic)

- **Modo:** Decisión clínica editable — mismo bloque **Today's in-clinic treatment** (checklist derivado del plan previo).
- **Propósito:** Tras escuchar al paciente (Paso 2), el fisio confirma o ajusta qué se realiza en sala hoy. No hay llamada intermedia a Vertex para generar propuestas.
- **Output hacia SOAP:** Ítems marcados / editados en `inClinicItems` entran como contexto en la **única** llamada de generación de SOAP.

### PASO 4 — Sesión en curso

- **Modo:** Ejecución — grabación principal de la sesión
- **Contenido:** Grabación de audio principal (comportamiento actual sin cambios). El plan de hoy (Paso 3) permanece en la página como referencia; no se asume sidebar colapsable ni plan generado por Vertex.
- **Cambios respecto a v1:** Ninguno en esta iteración. El comportamiento actual de grabación, transcripción y análisis se mantiene igual.

### PASO 5 — SOAP generado (una llamada a Vertex)

- **Modo:** Documentación legal — nota clínica finalizada
- **Subjetivo:** Transcripción del Paso 2 (cómo llegó el paciente) + transcripción del Paso 4 (sesión completa). Gemini los integra en una narrativa coherente.
- **Objetivo:** Hallazgos del examen físico + tratamiento ejecutado (según `inClinicItems` y sesión).
- **Valoración:** Análisis clínico generado por Gemini con todos los inputs del flujo (ver lista en *Decisión CTO* arriba).
- **Plan:** Plan para próxima sesión: `nextSessionFocus` generado por Gemini según progreso.
- **Qué entra en el SOAP:** Solo lo ejecutado + lo capturado. No existe propuesta intermedia persistida de Vertex en este flujo.
- **Cumplimiento PHIPA/CPO:** El fisio revisa y aprueba antes de finalizar — comportamiento actual sin cambios.

---

## 3. Decisiones de arquitectura

### 3.1 Nuevos campos en Firestore (`sessions/{id}`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `hepCompliance` | `Array<{itemId, done, date}>` | Cumplimiento de HEP por ítem |
| `subjectiveAudioTranscript` | `string` | Transcripción del clip de audio del Paso 2 |

### 3.2 Nuevas llamadas a Vertex AI

| Llamada | Cuándo | Inputs | Output | Costo estimado |
|---------|--------|--------|--------|----------------|
| Paso 5 — SOAP generation | Al finalizar documentación (comportamiento producto actual) | `hepCompliance` · `subjectiveAudioTranscript` (si existe) · `inClinicItems` / plan ejecutado · transcripción completa sesión · baseline · perfil fisio (`specialty`, `practiceAreas`, `techniques`, etc.) · `baselineId` de referencia cuando aplique | SOAP completo | Revisar delta real vs. v1 (una sola llamada intermedia eliminada) |

### 3.3 Perfil profesional en prompts

Campos de `users/{uid}` inyectados al **prompt de generación de SOAP** (Paso 5): `specialty`, `practiceAreas`, `techniques`, `experienceYears`. Si `practiceAreas` y `techniques` están vacíos, Vertex recibe solo `specialty` y degrada sin bloquear el flujo. Se recomienda completar el perfil en el onboarding.

### 3.4 Reglas de Firestore

Los nuevos campos son parte del documento `sessions/{id}` existente. Verificar en datos de piloto que las sesiones follow-up tienen campos de ownership coherentes con `isOwner()` **antes** de Sprints con nuevas escrituras. Tras auditoría/backfill si hiciera falta, las reglas actuales de sesiones deberían cubrir updates del propietario.

### 3.5 Orquestación vs. PersistenceService

**Sin cambios de API pública de PersistenceService.** Los cambios de ensamblado de prompts, contexto y orden de inputs viven en el **orquestador de workflow** (p. ej. `ProfessionalWorkflowPage` y servicios colindantes), no en una firma nueva obligatoria de PersistenceService.

---

## 4. Lo que NO cambia en esta iteración

- Flujo de grabación principal (Paso 4) — sin cambios
- SOAP generation (Paso 5) — una llamada Vertex; sin cambios de lógica base del producto salvo consolidación de inputs vía orquestador
- `handleFinalizeSOAP` — intocable (contrato)
- Consent gate — intocable
- Pipeline ES/CA — intocable
- Estructura de tabs del Initial Assessment — intocable (este rediseño es solo follow-up)
- **PersistenceService** — sin cambios de firma / API pública

---

## 5. Orden de implementación

Implementar en este orden. Cada paso es validable independientemente antes de continuar.

### Sprint A — Presentación del paciente (Paso 1)

- Objetivo: ClinicalBriefingPanel v2 — una tarjeta, tres secciones, HEP clickeable.
- Rediseñar ClinicalBriefingPanel: una tarjeta con secciones separadas por `border-t` (sin colapsables).
- Añadir checkboxes de cumplimiento al HEP — persistir `hepCompliance` en `sessions/{id}`.
- Validar con paciente real en piloto antes de continuar.

### Sprint B — ¿Cómo llega hoy? (Paso 2)

- Nuevo componente SubjectiveAudioCapture: Iniciar/Detener, STT vía pipeline piloto aprobado.
- Persistir `subjectiveAudioTranscript` en la sesión.
- Inyectar al prompt de SOAP generation como Subjetivo inicial (orquestador).
- Validar mejora de calidad del campo Subjetivo.

### ~~Sprint C — Ideas fisio + propuesta Vertex (antigua spec)~~

**Eliminado (marzo 2026, ver §2).** No existe segunda llamada Vertex previa al SOAP. El plan de hoy sigue el bloque **Today's in-clinic treatment** ya integrado en el workflow.

### Sprint D — Integración completa y validación clínica

- Sesión completa Pasos 1–5 con fisio real.
- Validar SOAP v2 vs. v1.
- Medir tiempo de flujo vs. v1.
- NPS del flujo nuevo.

---

## 6. Preguntas abiertas antes de implementar

| Pregunta | Impacto | Estado |
|----------|---------|--------|
| ¿El clip del Paso 2 requiere nuevo aviso de consentimiento? | Legal — PHIPA/RGPD | Consultar asesor antes de Sprint B |
| ¿HEP clickeable reemplaza o complementa HEP narrativo en el SOAP? | Diseño de datos — Plan | Decidir en Sprint A |
| ¿La propuesta de Vertex (antiguo Paso 4) se guarda siempre o solo si el fisio la aprueba? | Persistencia | **RESUELTA:** Paso 4 eliminado del flujo. No hay propuesta intermedia. |
| ¿Onboarding captura `practiceAreas`/`techniques` suficientemente? | Calidad prompt | Auditar antes de cerrar calidad de SOAP |
| ¿El flujo de 5 pasos clínicos + SOAP aplica a ongoing además de follow-up? | Alcance | Solo follow-up en v2; ongoing fuera de spec |

---

## 7. Deuda técnica conocida (fuera de este spec)

- **soap_versions** — versionado append-only para Editar en Familia A (Historial). Pendiente.
- **Onboarding perfil clínico** — completar `practiceAreas`/`techniques` si vacíos.
- **i18n ClinicalBriefingPanel** — texto fijo ES → `t()` si se requiere paridad EN/ES.
- **Stream único con marcadores** — evolución post–Sprint D si fricción en campo.
- **HITRUST / ISO 27001** — post-inversión; arquitectura certification-ready.

---

*AiduxCare Clinical Intelligence Inc. · pilot.aiduxcare.com · CONFIDENCIAL*  
*Follow-up Workflow v2 Spec · Marzo 2026 · Basado en feedback clínico real Fase 1*

*Enriquecido con decisiones CTO (marzo 2026): `sessions` canónico para HEP, auditoría owner fields, **una sola llamada Vertex al SOAP** (sin propuesta intermedia), STT pipeline existente, `baselineId` en trazabilidad de SOAP, PersistenceService API pública intacta.*
