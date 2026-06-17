# AiduxCare — Propuesta de Captura Fiable de Uso
**Fecha:** 17 Jun 2026  
**Estado:** Propuesta para revisión CTO  
**Objetivo:** Medir uso real del aplicativo de forma auditable, útil para soporte, producto e inversores, sin capturar PHI.

---

## 1. Problema

Hoy podemos reconstruir uso combinando `users.lastLoginAt`, `sessions`,
`audit_logs`, `analytics_events`, `encounters`, `consultations` y feedback.
Funciona para investigación manual, pero no es un sistema fiable de reporting.

Ejemplo: en la auditoría de Joana, `Firebase Auth.lastSignInTime` quedó antiguo,
pero Firestore `users.lastLoginAt` y `audit_logs` sí mostraron uso reciente.
Esto demuestra que necesitamos un modelo canónico de uso, no inferencias por
colecciones sueltas.

---

## 2. Principio de diseño

La telemetría de uso debe medir **eventos de producto**, no contenido clínico.

Reglas:
- No transcript.
- No SOAP text.
- No nombres de pacientes.
- No diagnóstico, medicación ni tratamiento.
- Identificadores pseudonimizados para reporting agregado.
- IDs reales solo en capas operacionales de soporte con acceso restringido.
- Cada sesión clínica debe tener un ciclo de vida auditable.

---

## 3. Modelo canónico propuesto

Crear una colección derivada o materializada:

`usage_session_facts/{usageSessionId}`

Un documento por intento de uso clínico real.

Campos propuestos:

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `userId` | string | Soporte operacional restringido |
| `hashedUserId` | string | Reporting agregado |
| `sessionId` | string | Link con `sessions` |
| `patientIdHash` | string | Cohortes sin PHI |
| `visitType` | `initial/followup/ongoing/unknown` | Segmentación |
| `startedAt` | timestamp | Inicio de flujo |
| `lastActivityAt` | timestamp | Última actividad real |
| `completedAt` | timestamp/null | Cierre exitoso |
| `outcome` | enum | Resultado final |
| `failureStage` | enum/null | Punto de abandono o error |
| `transcriptPresent` | boolean | No contenido |
| `transcriptLengthBucket` | enum | `none/short/medium/long` |
| `soapGenerated` | boolean | Valor clínico producido |
| `soapFinalized` | boolean | Valor cerrado |
| `encounterCreated` | boolean | Persistencia clínica |
| `feedbackSubmitted` | boolean | Señal cualitativa |
| `appVersion` | string | Correlación con deploys |
| `environment` | string | pilot/prod/dev |

Enums:

`outcome`
- `completed_finalized`
- `completed_draft`
- `interrupted_no_transcript`
- `interrupted_with_transcript`
- `failed_generation`
- `failed_persistence`
- `abandoned_unknown`

`failureStage`
- `login`
- `patient_selection`
- `consent`
- `recording`
- `transcription`
- `soap_generation`
- `soap_review`
- `finalization`
- `persistence`
- `unknown`

---

## 4. Fuentes actuales que alimentan el modelo

| Fuente actual | Uso |
|---------------|-----|
| `users.lastLoginAt` | Señal de entrada real |
| `audit_logs.workflow_session_start` | Inicio de workflow |
| `analytics_events.workflow_session_started` | Inicio producto |
| `sessions.status` | Estado de sesión |
| `sessions.soapStatus` | Draft/finalized |
| `sessions.writeState` | Persistencia completa |
| `sessions.transcript.length` | Bucket de transcripción |
| `encounters` | Confirmación de historial clínico |
| `consultations` / `clinical_notes` | Confirmación documental legacy |
| `user_feedback` | Fricción reportada por usuario |

---

## 5. Métricas que debe exponer el CTO/dashboard

### Activación
- Usuarios invitados.
- Usuarios con login real.
- Usuarios con primera sesión iniciada.
- Usuarios con primer SOAP finalizado.
- Días desde invitación hasta primer SOAP finalizado.

### Conversión clínica
- Sesiones iniciadas.
- Sesiones con transcript.
- Sesiones con SOAP generado.
- Sesiones finalizadas.
- Sesiones persistidas completamente.

### Fricción
- Interrumpidas sin transcript.
- Interrumpidas con transcript.
- Fallos por etapa.
- Reintentos por usuario.
- Tiempo entre start y abandono.

### Valor
- Tiempo hasta SOAP finalizado.
- % sesiones finalizadas en menos de 5 minutos desde fin de transcripción.
- Uso por visit type.
- Uso de follow-up con baseline válido.
- Feedback por sesión finalizada.

---

## 6. Lectura ejecutiva por usuario piloto

Cada usuario piloto debe poder resumirse en una ficha:

```
Usuario: Joana Carrasquinho
Estado: activada, uso real confirmado
Último uso: 2026-06-15 17:44
Sesiones: 4
SOAP finalizados: 1
Último outcome: interrupted_with_transcript
Principal fricción: abandona después de grabar/transcribir, antes de generar/finalizar SOAP
Siguiente acción de soporte: contactar con pregunta concreta sobre cierre de sesión/finalización
```

Esto evita reportes vagos como "se conectó" y permite conversación accionable.

---

## 7. Implementación sugerida

### Fase 1 — Sin cambios de producto

Crear un job/script de rollup que lea colecciones existentes y genere
`usage_session_facts`. Puede correr manualmente al inicio.

Entregables:
- `scripts/qa/export-usage-facts.cjs`
- `docs/strategy/USAGE_ANALYTICS_PROPOSAL.md`
- CSV/JSON export para revisión CTO.

### Fase 2 — Dashboard operativo

Extender `PilotMetricsDashboard` para leer `usage_session_facts`.

Vistas:
- Usuarios piloto.
- Funnel de conversión.
- Sesiones interrumpidas.
- Feedback reciente.

### Fase 3 — Instrumentación canónica

Unificar `AnalyticsService.trackEvent`, `PHIPAAnalytics.trackWorkflowEvent`
y `workflowMetricsService` bajo un contrato único de eventos.

Eventos mínimos:
- `app_login_success`
- `workflow_started`
- `consent_resolved`
- `recording_started`
- `recording_stopped`
- `transcription_completed`
- `soap_generation_started`
- `soap_generation_completed`
- `soap_finalized`
- `session_persisted`
- `workflow_interrupted`

---

## 8. Criterios de aceptación

La propuesta se considera lista cuando para cualquier usuario piloto podamos responder:

1. ¿Entró realmente a la app?
2. ¿Inició una sesión clínica?
3. ¿Grabó o escribió contenido?
4. ¿Generó SOAP?
5. ¿Finalizó SOAP?
6. ¿La nota quedó persistida en historial?
7. ¿Dónde abandonó si no finalizó?
8. ¿Hay feedback asociado a esa sesión?

Sin leer contenido clínico.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Capturar PHI accidentalmente | Solo buckets, booleanos y hashes |
| Doble conteo por eventos duplicados | `usageSessionId` derivado de `sessionId` |
| Auth y Firestore desalineados | Firestore/audit como fuente primaria de uso |
| Reporting lento | Rollup materializado |
| Métrica cosmética sin soporte clínico | Outcome basado en SOAP finalizado + writeState |

---

## 10. Recomendación

Implementar primero Fase 1. Es de bajo riesgo, no cambia producto clínico,
aprovecha datos existentes y entrega evidencia útil inmediata para CTO,
soporte de pilotos e inversores.

La prioridad no es medir más eventos. Es convertir eventos dispersos en
hechos de uso confiables.
