# WO-METRICS-01 — Clinical Workflow Behavioral Capture

**Work Order ID:** WO-METRICS-01  
**Priority:** P1  
**Status:** ✅ Implementado  
**Depends On:** WO-METRICS-00  
**Scope:** Cliente (event capture + ActiveTimeTracker + heartbeat). Sin agregación (WO-METRICS-02).

---

## Objetivo

Capturar comportamiento clínico real por visita (workflow_session) sin PHI:

- 5 eventos mínimos estructurales
- Active time acumulado
- Heartbeat técnico
- Señal limpia para abandono (calculado server-side en WO-02)

---

## Eventos implementados

| Evento | Disparador | Payload |
|--------|------------|---------|
| `workflow_session_started` | Primera entrada al workflow (post-consent) | visitType, jurisdiction |
| `workflow_tab_viewed` | Cambio de tab (analysis/evaluation/soap) | tab |
| `soap_generate_clicked` | Click en Generate SOAP | visitType |
| `soap_generated_success` | Respuesta exitosa Vertex | latencyMs |
| `workflow_session_completed` | Finalización de visita | activeMs, idleMs, totalDurationMs |
| `workflow_heartbeat` | Cada 45s si hay actividad | activeSinceLastBeatMs |

---

## Archivos creados/modificados

### Nuevos

- `src/services/metrics/ActiveTimeTracker.ts` — Tiempo activo (idle 180s, pausa en visibility hidden)
- `src/hooks/useWorkflowMetrics.ts` — Hook que dispara eventos y heartbeat

### Modificados

- `functions/src/metrics/metricsIngest.js` — schemaVersion: 1, workflow_heartbeat, nuevas metrics keys
- `src/pages/ProfessionalWorkflowPage.tsx` — useWorkflowMetrics, fireSoap*, fireWorkflowSessionCompleted, recordActivity

---

## ActiveTimeTracker

- **Idle threshold:** 180s
- **Eventos que cuentan:** keydown, click, paste, soap_generate_clicked, cambio tab
- **visibilityState hidden** → pausa
- **Heartbeat:** cada 45s si actividad reciente

---

## Definition of Done

- [x] workflow_session_started 1 vez por visita
- [x] workflow_tab_viewed solo al cambiar tab
- [x] soap_generate_clicked al click
- [x] soap_generated_success con latencyMs
- [x] workflow_session_completed con activeMs coherente
- [x] workflow_heartbeat cada 45s con actividad
- [x] Sin PHI en eventos
- [x] Build exitoso

---

## Próximo paso

WO-METRICS-02: Agregación incremental + metrics_sessions.
