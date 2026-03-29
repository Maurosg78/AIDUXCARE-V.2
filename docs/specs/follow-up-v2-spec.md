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
| Durante la sesión — ejecuta | Ideas de tratamiento propias + propuesta asistida por Vertex |
| Al cerrar la sesión | SOAP generado con todo el contexto acumulado |

---

## 2. Flujo de 6 pasos — Especificación

Cada paso corresponde a un momento clínico distinto. La UI debe separarlos visualmente. El fisio nunca debe buscar — la información correcta aparece en el momento correcto.

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

### PASO 3 — Ideas de tratamiento del fisio

- **Modo:** Decisión clínica — opcional pero de alto valor
- **Propósito:** El fisio ya tiene en mente qué quiere trabajar antes de que Vertex proponga nada. Capturar esa intención mejora la calidad de la propuesta de Vertex y preserva el criterio clínico.
- **Implementación:** Campo de texto libre + opción de dictado. Ejemplos: 'movilización glenohumeral + trabajo de cicatriz', 'revisar marcha + propiocepción'. No es obligatorio.
- **Por qué importa:** Vertex recibe la intención del fisio como input explícito → propuesta más personalizada. El fisio mantiene el control clínico visible.
- **Output:** `therapistTreatmentIdeas: string` — se inyecta al prompt del Paso 4
- **Firestore:** `therapistTreatmentIdeas: string` — campo nuevo en `sessions/{id}`

### PASO 4 — Propuesta de tratamiento (Vertex)

- **Modo:** Asistencia clínica — borrador que requiere aprobación
- **Inputs al prompt:** Estado actual del paciente (Paso 2) · HEP cumplido (Paso 1) · Ideas del fisio (Paso 3) · Assessment de última sesión · Red flags del baseline · Perfil profesional del fisio · **`baselineId` de referencia** en la petición (trazabilidad de auditoría)
- **Perfil profesional:** Desde `users/{uid}`: `specialty`, `practiceAreas`, `techniques` (normalizados), `experienceYears`. Si están vacíos → Vertex degrada a propuesta genérica sin bloquear el flujo.
- **Red flags:** Bloque visible antes de la propuesta: contraindicaciones y alertas del baseline. Derivado de red flag detection ya existente.
- **Output de Vertex:** Lista de intervenciones propuestas con justificación clínica breve. Formato: 'Técnica — Justificación (1 línea)'
- **UX crítico:** Etiqueta explícita: 'Propuesta borrador — requiere aprobación del fisioterapeuta'. El fisio aprueba, modifica ítem por ítem, o descarta. Nunca se ejecuta sin revisión.
- **Persistencia (política CTO):** Solo la versión **aprobada** se guarda en `sessions/{id}.proposedTreatmentPlan: { items: [{technique, rationale, approved}] }`. Borradores y rechazados en memoria únicamente — no inflar documentos ni persistir propuestas descartadas.
- **Costo estimado:** ~$0.00143 USD por llamada — mismo orden que la llamada de SOAP generation actual (recalcular delta total vs. v1 en documentación de costes; evitar doble conteo si Paso 6 solo añade inputs al SOAP existente).

### PASO 5 — Sesión en curso

- **Modo:** Ejecución — grabación principal de la sesión
- **Contenido:** Grabación de audio principal de la sesión (comportamiento actual sin cambios). El plan aprobado en Paso 4 está visible como referencia lateral.
- **Cambios respecto a v1:** Ninguno en esta iteración. El comportamiento actual de grabación, transcripción y análisis se mantiene igual.
- **Referencia lateral:** El plan aprobado (Paso 4) aparece como sidebar colapsable durante la grabación — el fisio puede verificar qué iba a hacer mientras ejecuta.

### PASO 6 — SOAP generado

- **Modo:** Documentación legal — nota clínica finalizada
- **Subjetivo:** Transcripción del Paso 2 (cómo llegó el paciente) + transcripción del Paso 5 (sesión completa). Gemini los integra en una narrativa coherente.
- **Objetivo:** Hallazgos del examen físico + tratamiento ejecutado (del plan aprobado en Paso 4).
- **Valoración:** Análisis clínico generado por Gemini con todos los inputs del flujo.
- **Plan:** Plan para próxima sesión: `nextSessionFocus` generado por Gemini basado en el progreso de esta sesión.
- **Qué entra en el SOAP:** Solo lo ejecutado + lo capturado. Las ideas del fisio (Paso 3) y la propuesta de Vertex (Paso 4) son inputs al proceso, no parte del registro legal (salvo decisión explícita sobre HEP en Plan — ver preguntas abiertas).
- **Cumplimiento PHIPA/CPO:** El fisio revisa y aprueba antes de finalizar — comportamiento actual sin cambios.

---

## 3. Decisiones de arquitectura

### 3.1 Nuevos campos en Firestore (`sessions/{id}`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `hepCompliance` | `Array<{itemId, done, date}>` | Cumplimiento de HEP por ítem |
| `subjectiveAudioTranscript` | `string` | Transcripción del clip de audio del Paso 2 |
| `therapistTreatmentIdeas` | `string` | Ideas de tratamiento del fisio (Paso 3) |
| `proposedTreatmentPlan` | `{ items: [{technique, rationale, approved}] }` | Propuesta aprobada (solo versión final aprobada) |

### 3.2 Nuevas llamadas a Vertex AI

| Llamada | Cuándo | Inputs | Output | Costo estimado |
|---------|--------|--------|--------|----------------|
| Paso 4 — Propuesta de tratamiento | Tras Paso 2 y 3 (según flujo UX) | Estado actual + HEP + ideas fisio + perfil + red flags + `baselineId` | Lista de intervenciones | ~$0.00143 USD |
| Paso 6 — SOAP generation | Sin cambios respecto a v1 a nivel de producto | Transcripción completa + baseline + plan aprobado + subjetivo Paso 2 | SOAP completo | Revisar delta real vs. v1 |

### 3.3 Perfil profesional en prompts

Campos de `users/{uid}` inyectados al prompt del Paso 4: `specialty`, `practiceAreas`, `techniques`, `experienceYears`. Si `practiceAreas` y `techniques` están vacíos, Vertex recibe solo `specialty` y genera una propuesta genérica; el flujo no se bloquea. Se recomienda completar el perfil en el onboarding.

### 3.4 Reglas de Firestore

Los nuevos campos son parte del documento `sessions/{id}` existente. Verificar en datos de piloto que las sesiones follow-up tienen campos de ownership coherentes con `isOwner()` **antes** de Sprints con nuevas escrituras. Tras auditoría/backfill si hiciera falta, las reglas actuales de sesiones deberían cubrir updates del propietario.

### 3.5 Orquestación vs. PersistenceService

**Sin cambios de API pública de PersistenceService.** Los cambios de ensamblado de prompts, contexto y orden de inputs viven en el **orquestador de workflow** (p. ej. `ProfessionalWorkflowPage` y servicios colindantes), no en una firma nueva obligatoria de PersistenceService.

---

## 4. Lo que NO cambia en esta iteración

- Flujo de grabación principal (Paso 5) — sin cambios
- SOAP generation (Paso 6) — sin cambios de lógica base del producto; solo inputs adicionales vía orquestador
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
- *(Parcialmente hecho: falta HEP clickeable y rediseño de una sola tarjeta.)*

### Sprint B — ¿Cómo llega hoy? (Paso 2)

- Nuevo componente SubjectiveAudioCapture: Iniciar/Detener, STT vía pipeline piloto aprobado.
- Persistir `subjectiveAudioTranscript` en la sesión.
- Inyectar al prompt de SOAP generation como Subjetivo inicial (orquestador).
- Validar mejora de calidad del campo Subjetivo.

### Sprint C — Ideas del fisio + Propuesta Vertex (Pasos 3 y 4)

- Campo texto/dictado para `therapistTreatmentIdeas`.
- Nueva llamada Vertex: `buildTreatmentProposalPrompt()` con todos los inputs + `baselineId`.
- UI de aprobación por ítem — nunca auto-aprobado; solo aprobado persistido en Firestore.
- Bloque red flags antes de la propuesta.
- Verificar perfil profesional — si vacío, mensaje para completar perfil (no bloqueante).

### Sprint D — Integración completa y validación clínica

- Sesión completa Pasos 1–6 con fisio real.
- Validar SOAP v2 vs. v1.
- Medir tiempo de flujo vs. v1.
- NPS del flujo nuevo.

---

## 6. Preguntas abiertas antes de implementar

| Pregunta | Impacto | Estado |
|----------|---------|--------|
| ¿El clip del Paso 2 requiere nuevo aviso de consentimiento? | Legal — PHIPA/RGPD | Consultar asesor antes de Sprint B |
| ¿HEP clickeable reemplaza o complementa HEP narrativo en el SOAP? | Diseño de datos — Plan | Decidir en Sprint A |
| ¿Propuesta Vertex rechazada se guarda? | Privacidad | **Decidido:** solo aprobada en Firestore; borradores en memoria |
| ¿Onboarding captura `practiceAreas`/`techniques` suficientemente? | Calidad prompt | Auditar antes de Sprint C |
| ¿El flujo de 6 pasos aplica a ongoing además de follow-up? | Alcance | Solo follow-up en v2; ongoing fuera de spec |

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

*Enriquecido con decisiones CTO (marzo 2026): `sessions` canónico para HEP, auditoría owner fields, propuestas solo aprobadas persistidas, STT pipeline existente, `baselineId` en Paso 4, PersistenceService API pública intacta.*
