# AI Risk Management File — Sócrates

**Versión:** 0.1
**Fecha:** 2026-05-24
**Autor:** Mauricio Sobarzo, Nº colegiado 9657 COFCV
**Estado:** Estructura base creada. Requiere completar secciones 2-4 antes de Modo 1.5.
**Marco:** EU AI Act 2024 · ISO 14971:2019 (lite) · Health Canada MLMD 2025
**Revisión programada:** antes del primer commit de Sócrates Modo 1.5 en `stable`

---

> Este documento gestiona activamente los riesgos del sistema de IA de Sócrates.
> No es un ejercicio académico — cada control debe ser verificable en el código
> o en un proceso documentado. Un control que solo existe en este documento no es un control.

---

## 1. Descripción del sistema de IA

**Nombre del sistema:** Sócrates — capa de inteligencia clínica de AiduxCare

**Modelos utilizados:**
- Vertex AI Gemini 2.5 Flash (análisis clínico, generación SOAP, observaciones IA)
- OpenAI Whisper / gpt-4o-mini-transcribe (transcripción de audio)
- LLM socrática: [PENDIENTE — definir modelo específico para Modo 1.5/2]

**Versión de modelos:** registrada en cada commit de prompt clínico per ENGINEERING.md §1.7

**Inputs del sistema:**
- Audio de sesión clínica (MP3/WAV, duración típica 15-60 min)
- Transcripción generada por Whisper
- SOAP aprobado por el fisioterapeuta (texto estructurado)
- Decisiones clínicas documentadas (red flags, medicación, plan)
- Evidence library aprobada en git (src/core/clinical-evidence/)
- Perfil del fisioterapeuta (especialidad, mercado, número de colegiado)
- Historial longitudinal del paciente (encounters, sesiones previas)

**Outputs del sistema por modo:**
- Modo 0: ClinicalContextLedger estructurado (no visible al fisio directamente)
- Modo 1.5: evidence cards priorizadas por contexto [PENDIENTE]
- Modo 2: respuestas a consultas del fisio con base en ledger + evidencia [PENDIENTE]

**Usuario previsto:** fisioterapeuta colegiado en España (CGCFE) u Ontario (CPO)

**Entorno de uso previsto:** consulta clínica de fisioterapia MSK, durante o después
de la sesión con el paciente. El fisio invoca a Sócrates explícitamente — nunca es automático.

**Población de pacientes:** adultos con condiciones musculoesqueléticas (MSK).
Exclusiones actuales: menores de edad, patología neurológica grave, oncología,
condiciones sistémicas agudas.

---

## 2. Identificación de riesgos clínicos

*Estado: estructura base. Completar con análisis de probabilidad y severidad
reales basados en el piloto antes de Modo 1.5.*

| ID | Riesgo | Descripción | Probabilidad | Severidad | Nivel |
|---|---|---|---|---|---|
| R-001 | Primacy bias | El fisio ancla su decisión en el primer resultado presentado sin revisar los demás | Media | Media | **Medio** |
| R-002 | Evidencia obsoleta | Evidencia aprobada en la library ha sido supersedida por nueva evidencia no detectada | Baja | Alta | **Medio-alto** |
| R-003 | Señal psicosocial mal inferida | IA detecta señal psicosocial incorrectamente — influye en sesión si el fisio la acepta sin cuestionarla | Baja | Media | **Bajo** |
| R-004 | Ordering opaco como recomendación | El orden de presentación se interpreta como ranking de recomendación sin que el fisio entienda el criterio | Media | Media | **Medio** |
| R-005 | Diagnóstico incorrecto en evidence matching | Evidencia de diagnóstico A se presenta para diagnóstico B por error en matching | Muy baja | Alta | **Bajo** |
| R-006 | Confidencia excesiva en evidence card | El fisio implementa intervención basada solo en el resumen de Sócrates sin leer la fuente original | Media | Media | **Medio** |
| R-007 | Fatiga de alertas | Sócrates genera preguntas socráticas frecuentes — el fisio las ignora sistemáticamente incluyendo señales relevantes | Media | Media | **Medio** |
| R-008 | Fallo silencioso del ledger | El ClinicalContextLedger no se construye correctamente pero Sócrates responde de todas formas | Baja | Alta | **Medio-alto** |

---

## 3. Controles por riesgo

### R-001 — Primacy bias

**Control técnico:**
- La UI muestra el criterio de ordenamiento explícitamente para cada ítem
- El fisio puede re-ordenar por criterio alternativo (fecha, PEDro score, tipo de estudio)
- Ver `SOCRATES_UI_CONSTRAINTS.md` — prohibición de ranking opaco
**Control de proceso:**
- Training en onboarding: Sócrates ordena por criterio explicado, no recomienda
**Evidencia del control:** `SOCRATES_UI_CONSTRAINTS.md` §2 + implementación UI [PENDIENTE]
**Riesgo residual:** Bajo — el criterio visible permite al fisio calibrar el sesgo

### R-002 — Evidencia obsoleta

**Control técnico:**
- Cada entrada de evidence library tiene campo `reviewByDate` [PENDIENTE implementar]
- Script de monitoreo PubMed/PEDro por diagnóstico alerta cuando hay nueva evidencia
**Control de proceso:**
- `EVIDENCE_REVIEW_PROTOCOL.md` §7: revisión semestral mínima o ante nueva evidencia
  contradictoria
- Fecha de caducidad de revisión documentada en cada commit de evidencia
**Evidencia del control:** `EVIDENCE_REVIEW_PROTOCOL.md` + commits de evidence library
**Riesgo residual:** Bajo-medio — depende de que el script de monitoreo esté activo

### R-003 — Señal psicosocial mal inferida

**Control técnico:**
- Señales del Estrato 2 se presentan como candidatos para aceptación del fisio —
  nunca como hechos documentados
- La arquitectura de tipos distingue AiObservation (hipótesis) de DocumentedFact
  (hecho trazable)
**Control de proceso:**
- Fisio puede rechazar, ignorar o corregir cualquier señal inferida
- SocraticInteractionLog registra rechazos para análisis de calidad
**Evidencia del control:** `src/core/socratic/types.ts` — distinción AiObservation / DocumentedFact
**Riesgo residual:** Bajo — el control está en los tipos y en la UI de aceptación explícita

### R-004 — Ordering opaco como recomendación

**Control técnico:**
- Botón "¿Por qué aparece aquí?" en cada evidence card con criterio explícito
- El criterio de ordenamiento está documentado en `SOCRATES_UI_CONSTRAINTS.md`
**Control de proceso:**
- Prohibición de lenguaje de ranking: ver `SOCRATES_UI_CONSTRAINTS.md` §1
**Evidencia del control:** `SOCRATES_UI_CONSTRAINTS.md` + implementación UI [PENDIENTE]
**Riesgo residual:** Bajo si la UI implementa el criterio visible correctamente

### R-005 — Diagnóstico incorrecto en evidence matching

**Control técnico:**
- El matching de evidencia usa el diagnosisId del SOAP aprobado — no inferencia libre
- Solo evidencia aprobada para ese diagnosisId específico aparece en la sesión
**Control de proceso:**
- Evidence library organizada por diagnóstico con `diagnosisId` tipado
**Evidencia del control:** `src/core/clinical-evidence/types.ts` + EVIDENCE_REGISTRY.ts
**Riesgo residual:** Muy bajo — el matching es determinístico por diagnosisId

### R-006 — Confidencia excesiva en evidence card

**Control técnico:**
- Cada evidence card muestra: título, año, diseño, PEDro score, GRADE, limitaciones
- El resumen generado por Sócrates no puede aparecer sin la referencia completa visible
- Botón de acceso al abstract o DOI en cada card
**Control de proceso:**
- `SOCRATES_UI_CONSTRAINTS.md`: prohibición de presentar resúmenes sin fuente verificable
**Evidencia del control:** `SOCRATES_UI_CONSTRAINTS.md` §2 + implementación UI [PENDIENTE]
**Riesgo residual:** Bajo-medio — depende de que el fisio use el acceso a la fuente

### R-007 — Fatiga de alertas

**Control técnico:**
- SocraticThresholdEvaluator: reglas explícitas de threshold — no genera pregunta sin
  criterio documentado (3+ sesiones sin decisión, señal no resuelta, etc.)
- Máximo 1 pregunta socrática por sesión en Modo 0 (ver spec del ledger)
- SocraticInteractionLog: si el fisio ignora 3 veces una señal del mismo tipo,
  el threshold se eleva automáticamente [PENDIENTE implementar]
**Control de proceso:**
- Revisión de logs de interacción cada 4 semanas en piloto
**Evidencia del control:** `docs/specs/socrates-clinical-context-ledger.md` §SocraticThresholdEvaluator
**Riesgo residual:** Bajo — el threshold determinístico previene la saturación

### R-008 — Fallo silencioso del ledger

**Control técnico:**
- El ClinicalContextLedger debe fallar explícitamente si no puede construirse con
  fuentes mínimas — nunca presentar respuesta de Sócrates con ledger incompleto [PENDIENTE]
- Log de error técnico cuando getActiveFacts() devuelve array vacío inesperadamente
**Control de proceso:**
- Cualquier respuesta de Sócrates debe incluir metadata del ledger usado (sessionId,
  timestamp, número de hechos activos) — verificable en audit log
**Evidencia del control:** implementación pendiente + audit log de Firestore
**Riesgo residual:** Medio hasta que el fallo explícito esté implementado

---

## 4. Monitoreo post-deploy

*Para ser completado antes del primer deploy de Sócrates Modo 1.5 a producción.*

| Signal de degradación | Quién monitorea | Frecuencia | Umbral de acción |
|---|---|---|---|
| Tasa de rechazo de evidence cards | CTO | Semanal (piloto) | >60% en un diagnóstico específico |
| Tasa de aceptación sin leer fuente | CTO | Semanal (piloto) | >40% en cualquier sesión |
| Preguntas socráticas sin respuesta | CTO | Semanal (piloto) | >70% en un fisio específico |
| Near-miss clínico reportado | CTO | Inmediato | Cualquier incidente |
| Evidencia contradictoria detectada | Script PubMed | Mensual | Cualquier resultado |
| Fallo de construcción del ledger | Log técnico | Continuo | Cualquier error |

**Canal de reporte de incidentes:** [PENDIENTE — definir proceso interno antes de Modo 1.5]

---

## 5. Revisión de este documento

**Frecuencia de revisión programada:** semestral o ante cualquiera de estos eventos:
- Cambio de modelo (Vertex AI, Whisper, LLM socrática)
- Cambio de evidence library (nuevo diagnóstico o actualización de evidencia existente)
- Near-miss clínico documentado
- Nuevo modo de Sócrates activado
- Cambio regulatorio relevante (EU AI Act updates, Health Canada guidance)

**Condición de revisión inmediata:** cualquier incidente que sugiera que un control
no funcionó como se describió en este documento.

---

## 6. Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 2026-05-24 | Estructura base. 8 riesgos identificados. Controles técnicos mapeados. Secciones de monitoreo pendientes para Modo 1.5. |

---

*Documento interno de gobernanza de IA. No contiene datos de pacientes.*
*Marco: EU AI Act 2024 · ISO 14971:2019 · Health Canada MLMD Guidance 2025*
