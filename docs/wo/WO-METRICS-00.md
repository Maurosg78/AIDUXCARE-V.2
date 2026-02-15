# WO-METRICS-00 — Metrics Foundation (Ontario Pilot)

**Work Order ID:** WO-METRICS-00  
**Priority:** P1  
**Status:** ✅ Implementado  
**Created:** 2026-02  
**Depends On:** —

---

## Objetivo

Infraestructura base para métricas sin PHI: `appVersion`, `env`, `browserSessionId`, `workflowSessionId` (= visitId), y `userIdHash` calculado server-side (HMAC + pepper).

**Resultado:** Se puede registrar 1 evento de prueba en `metrics_events` vía Cloud Function sin persistir UID/email.

---

## Scope

| IN | OUT (NO TOCAR) |
|----|----------------|
| Utilidades nuevas + callable metricsIngest + reglas Firestore para metrics_* + smoke event temporal | Prompts, consent, flujos clínicos, patients/sessions/soapNotes, UI clínica (salvo hook smoke) |

---

## Implementación

### A) Cliente — utilidades base

| Archivo | Descripción |
|---------|-------------|
| `src/utils/buildInfo.ts` | `APP_VERSION` (VITE_BUILD_SHA / __BUILD_SHA__ / dev), `APP_ENV` (pilot/local/uat) |
| `src/services/metrics/sessionIds.ts` | `getOrCreateBrowserSessionId()` — sessionStorage, UUID v4 |
| `src/services/metrics/workflowSession.ts` | `getWorkflowSessionIdFromVisitId(visitId)` — devuelve visitId tal cual |
| `src/services/metrics/metricsClient.ts` | `track(payload)` — httpsCallable a metricsIngest, auto-adjunta appVersion, env, browserSessionId |

### B) Servidor — Cloud Function

| Archivo | Descripción |
|---------|-------------|
| `functions/src/metrics/metricsIngest.js` | Callable, HMAC userIdHash, whitelist eventos/metrics, METRICS_PEPPER (env/config) |
| `functions/index.js` | Exporta `metricsIngest` |

### C) Firestore

- Colección `metrics_events` — append-only
- Rules: `allow read, write: if false` (solo CF vía admin SDK)

### D) Smoke event

- Ubicación: `CommandCenterPageSprint3.tsx`
- Evento: `metrics_smoke_test`, `workflowSessionId: 'smoke'`, `metrics: { ok: true }`
- Frecuencia: 1 vez por browser session (sessionStorage `aidux_metrics_smoke_sent`)

---

## Definition of Done

- [x] 1 doc en `metrics_events` con: eventName, ts, userIdHash, appVersion, env, workflowSessionId, browserSessionId, metrics.ok
- [x] Sin uid, email, prompt, transcript, soap, strings largas

---

## Configuración

Ver `docs/wo/WO-METRICS-00-SETUP.md` para METRICS_PEPPER y deploy.

---

## Próximo paso

WO-METRICS-01: 5 eventos mínimos + ActiveTimeTracker + heartbeat.
