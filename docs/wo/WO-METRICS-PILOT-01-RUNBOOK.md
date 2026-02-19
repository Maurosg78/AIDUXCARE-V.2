# WO-METRICS-PILOT-01 — Runbook CTO (Verificación backend + Rollout seguro)

**Work Order:** WO-METRICS-PILOT-01  
**Status:** Implementado · Pendiente verificación backend  
**Última actualización:** 2026-02

---

## A) Pre-deploy checklist (1 sola vez)

1. **Crear `config/telemetry` en Firestore**
   - **CLI (recomendado):** `pnpm telemetry:setup` (crea con `enabled: true`, `sampleRate: 1` en UAT)
   - **Manual:** Path `config/telemetry`, campos:
     - `enabled`: `false` (prod) o `true` (UAT)
     - `sampleRate`: `1.0` (opcional)
     - `enabledUserHashes`: `[]` (opcional, modo allowlist)

2. **Confirmar reglas Firestore**
   - `config/telemetry`: `read` si auth, `write: false`
   - `telemetry_sessions`: `read, write` si auth
   - *Nota operativa:* En piloto, `read` puede mantenerse restringido (admin-only) para minimizar superficie. Los usuarios no necesitan leer `telemetry_sessions` (no hay dashboard aún).

**DoD A:** Documento existe y la app carga sin telemetría (flag OFF).

**Scripts CLI (verificación y setup):**
- `pnpm telemetry:check` — Verifica `config/telemetry` y lista `telemetry_sessions`
- `pnpm telemetry:setup` — Crea/actualiza `config/telemetry` (requiere `gcloud auth application-default login`)
- `pnpm telemetry:disable-legacy` — Desactiva metricsIngest (legacy); usa solo telemetry_sessions

**Interpretación de `enabledUserHashes` (crítico):**
- `enabledUserHashes: []` = **nadie** (SAFE) ✅
- `enabledUserHashes` ausente/undefined = usa `sampleRate` (puede incluir a todos si sampleRate=1)

---

## B) Deploy con flag OFF (kill switch listo)

1. Deploy normal a prod/pilot con `enabled=false`.
2. **Smoke test (obligatorio):**
   - Command Center abre
   - Initial workflow abre
   - Follow-up workflow abre
   - Generate SOAP funciona (al menos 1 vez)
   - Finalize funciona

**DoD B:** Nada cambia para usuarios y no hay errores nuevos.

---

## C) Activación controlada (solo CTO, 10 sesiones)

1. Actualizar `config/telemetry`:
   - `enabled`: `true`
   - `enabledUserHashes`: `["<tu_userIdHash>"]`

2. **10 sesiones de prueba (mezcla):**
   - 5 initial
   - 5 follow-up
   - 2 sesiones: regenerate 2–3 veces
   - 2 sesiones: forzar 1 validation error
   - 1 sesión: generar SOAP 2 veces
   - 1 sesión: abandonar sin finalizar (unload)

**DoD C:** Ver query-plan abajo para campos mínimos.

---

## D) Checks de no duplicación (crítico)

En 2 sesiones initial:
- Navegar entre tabs varias veces antes de finalizar.
- **renderedCount NO debe multiplicarse** por re-renders.

**DoD D:** `renderedCount = 1` por bloque por sesión.

---

## E) Rollout gradual

Si C y D pasan:
1. 1 fisio (24h)
2. 5 fisios (24–48h)
3. 10 fisios
4. Todos

**Kill switch:** `enabled=false` → NO-OP inmediato.

---

## Métricas manuales (sin dashboard)

| Métrica | Fórmula |
|---------|---------|
| **Generate success rate** | `sum(success) / sum(clicked)` por semana |
| **Average latency max** | Promedio de `soapGenerateLatencyMsMax` por usuario |
| **Admin acceptance proxy** | `(acceptAsIsCount + acceptAfterEditCount) / renderedCount` por sesión (initial) |
| **Friction index** | `regenerateCount + validationErrorCount` por sesión |

---

## Nota MaRS/OCI

> "Block acceptance está instrumentado en **Initial** en esta iteración; Follow-up se habilita en el siguiente release, una vez confirmada estabilidad en piloto."
