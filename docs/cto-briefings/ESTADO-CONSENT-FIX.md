# Estado oficial: Consent verbal (FIX A)

**Última actualización:** según commit del repo.

---

## Repo y branch

| Campo   | Valor |
|--------|--------|
| **Repositorio** | `AIDUXCARE-V.2-clean` (este repo) |
| **Branch**      | `feature/consent-gate-fix` |
| **Commit (al merge)** | Ver abajo; **actualizar al cerrar el PR** con el hash del merge commit o del último commit del branch. |

**Al cerrar el PR en GitHub:** ejecutar `git rev-parse --short HEAD` en el branch antes del merge (o usar el SHA del merge commit) y actualizar la línea siguiente:

```
Commit: _____________  ← reemplazar con el commit final (ej.: a1b2c3d)
```

---

## Estado del fix

| Fix | Estado | Descripción |
|-----|--------|-------------|
| **FIX A** | **Activo** | Consentimiento verbal normalizado: se escribe en `patients/{patientId}/consent_status/latest` con `channel: 'none'`, `granted: true`. El dominio reconoce consent válido y el ConsentGate se desmonta. Única fuente de verdad para el gate. |
| **FIX B** | **No usado** | Por diseño. No se acepta `verbal` como canal en el dominio; se usa `channel: 'none'` para evitar lógica legacy y duplicada. |

---

## Integración real

- **Página:** `src/pages/ProfessionalWorkflowPage.tsx`
- **Contenedor:** Todo el flujo clínico (header + tabs + main) está envuelto en `<ConsentGateWrapper>` con `patientId`, `patientName`, `patientPhone` del paciente actual (por defecto `selectedPatient.id`; en rutas con `:patientId` se puede pasar `patientIdFromUrl`).
- **Servicio verbal:** `VerbalConsentService.obtainConsent()` escribe en el path anterior.
- **Sin lógica legacy:** No hay checks de canal `verbal` en el dominio; no hay estados locales duplicados ni gates alternativos para este flujo.

---

## Nota operativa para pilotos

> La UI clínica se habilita automáticamente tras el consentimiento verbal registrado.  
> Si no ocurre, revisar en Firestore el documento `patients/{patientId}/consent_status/latest`: debe existir y contener `channel: 'none'` y `granted: true`. Comprobar también la consola del navegador para los logs `[CONSENT]` y `[WORKFLOW] Gate UNMOUNTED`.

---

## Referencias

- **Cerrar PR en GitHub:** `PR-CONSENT-GATE-CLOSE.md` (pasos, descripción, etiquetas, commit final).
- Runbook: `RUNBOOK-CONSENT-ENTERPRISE.md`
- Activación técnica: `WO-CONSENT-VERBAL-FIX-ACTIVATION.md`
- QA: `QA-CONSENT-WORKFLOW-CHECKLIST.md`
