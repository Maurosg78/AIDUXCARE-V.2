# WO-FEEDBACK-53jMoePB — Símbolo Initial Eval en historia del paciente

**Fecha:** 13 de febrero de 2026  
**Feedback ID:** 53jMoePBudigRHUcnrvM  
**Estado:** ✅ Completado

---

## Problema

Cuando el paciente ya tiene un ongoing (baseline) creado, el símbolo "?" en la columna "Initial Eval" de la historia generaba confusión — el usuario interpretaba que algo estaba bloqueante cuando no lo era.

## Solución implementada

**Archivo:** `src/features/patient-dashboard/PatientDashboardPage.tsx`

**Lógica anterior:**
- ✓ = initial cerrado (SOAP finalized) + hasActiveBaseline
- ⟳ = hay initial pendiente
- ? = resto

**Lógica nueva (Feedback 53jMoePB):**
- ✓ = initial con SOAP finalized (verde)
- **–** = paciente tiene ongoing (hasActiveBaseline) — no bloqueante, verde
- ⟳ = initial pendiente (SOAP no finalized) — amarillo
- ? = sin initial, sin ongoing — amarillo

Cuando el paciente tiene `activeBaselineId`, se muestra "–" en verde en lugar de "?" para indicar que no es bloqueante.

## Rollback

Si hay problemas:
```bash
git reset --hard pre-feedback-53jMoePB-2026-02-13
```

---

**Nota:** El feedback también menciona "diferenciar los distintos initial assessment para paciente que vuelven por otra patología" — eso queda como mejora futura (múltiples episodios/patologías).
