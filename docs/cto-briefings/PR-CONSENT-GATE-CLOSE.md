# Cómo cerrar el PR de Consent Gate en GitHub

Este doc describe **la forma adecuada** de abrir/cerrar el PR para que pase revisión y quede listo para piloto. Sigue los pasos en orden.

---

## 1. Antes de abrir el PR

- [ ] `npm run build` pasa sin errores.
- [ ] Branch actual: `feature/consent-gate-fix` (o el que corresponda).
- [ ] Cambios commiteados y pusheados al remoto.

---

## 2. Crear el PR

- **Base:** `main` (o la rama de integración que use el repo).
- **Compare:** `feature/consent-gate-fix`.
- **Título sugerido:**  
  `feat(consent): ConsentGate integration — FIX A active, pilot-ready`

---

## 3. Descripción del PR (copiar y pegar)

Usa el siguiente bloque como descripción del PR. Ajusta los enlaces si tu repo tiene otra estructura.

```markdown
## Summary

Integración enterprise del Consent Gate con consentimiento verbal normalizado (FIX A). El flujo clínico queda envuelto en `ConsentGateWrapper`; la fuente de verdad es `patients/{patientId}/consent_status/latest` con `channel: 'none'` y `granted: true`. Gate se desmonta de forma determinista y la UI clínica se habilita sin refresh.

- **Parte 1 — Integración:** `ConsentGateWrapper` envuelve todo el flujo en `ProfessionalWorkflowPage`; `VerbalConsentService.obtainConsent()` escribe en el path único; logs permiten verificar desmontaje en caliente; sin lógica legacy.
- **Parte 2 — QA:** Checklist en `docs/cto-briefings/QA-CONSENT-WORKFLOW-CHECKLIST.md` con orden de logs esperado y diagnóstico rápido.
- **Parte 3 — Cierre:** Estado oficial en `ESTADO-CONSENT-FIX.md` (FIX A activo, FIX B no usado); runbook y nota operativa para pilotos actualizados.

## Criterio de aceptación (CTO — DONE)

- [x] `npm run build` ✅
- [x] Flujo de logs en consola: `[VerbalConsent] ✅` → `[CONSENT] consent_status_retrieved` → `[CONSENT] gate_unmounted_after_verbal` → `[WORKFLOW] Consent resolution from domain` → `[WORKFLOW] Gate UNMOUNTED, rendering clinical workflow`
- [x] UI clínica visible sin refresh tras consentimiento verbal
- [x] Base lista para audio/adjuntos en workflow completo

## Checklist

- [x] Leo el Handbook y enlazo las secciones relevantes.
- [x] Los cambios siguen `CONTRIBUTING.md` (commits convencionales, branching).
- [x] Docs añadidos/actualizados: `ESTADO-CONSENT-FIX.md`, `RUNBOOK-CONSENT-ENTERPRISE.md`, `QA-CONSENT-WORKFLOW-CHECKLIST.md`, `PR-CONSENT-GATE-CLOSE.md`.
- [x] CI pasa o el PR es solo docs.

## Links a SSoT

- Estado y repo/branch: [docs/cto-briefings/ESTADO-CONSENT-FIX.md](docs/cto-briefings/ESTADO-CONSENT-FIX.md)
- Runbook: [docs/cto-briefings/RUNBOOK-CONSENT-ENTERPRISE.md](docs/cto-briefings/RUNBOOK-CONSENT-ENTERPRISE.md)
- QA: [docs/cto-briefings/QA-CONSENT-WORKFLOW-CHECKLIST.md](docs/cto-briefings/QA-CONSENT-WORKFLOW-CHECKLIST.md)
- Activación técnica: [docs/cto-briefings/WO-CONSENT-VERBAL-FIX-ACTIVATION.md](docs/cto-briefings/WO-CONSENT-VERBAL-FIX-ACTIVATION.md)

## Screenshots / Notas

(Opcional) Captura de consola mostrando el orden de logs tras conceder consentimiento verbal.
```

---

## 4. Etiquetas del PR

Añadir en GitHub (en el panel derecho del PR):

| Etiqueta | Uso |
|----------|-----|
| **Compliance-safe** | Si existe en el repo; indica que el cambio cumple criterios de compliance (consent, PHI, dominio). |
| **Pilot-ready** | Indica que está listo para piloto clínico según estado y runbook. |

Si el repo no tiene estas etiquetas, crearlas en *Settings → Labels* o usar las que más se acerquen (ej. `ready for pilot`, `compliance`).

---

## 5. Al mergear / cerrar el PR

1. **Actualizar el commit final en estado oficial**
   - Tras el merge, en local (en `main`): `git pull` y anotar el merge commit, o usar el último commit del branch antes del merge.
   - Editar `docs/cto-briefings/ESTADO-CONSENT-FIX.md` y reemplazar la línea:
     ```text
     Commit: _____________  ← reemplazar con el commit final (ej.: a1b2c3d)
     ```
     por el hash real (ej. `a1b2c3d`).
   - Hacer commit de esa actualización en `main` y push (o un mini-PR de “chore(docs): pin consent fix merge commit”).

2. **(Opcional) Captura de consola**
   - Si no se añadió al abrir el PR: subir una captura de la consola del navegador mostrando el orden de logs tras obtener consentimiento verbal y añadirla al PR como comentario o en la descripción.

---

## 6. Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | Build OK, branch pusheado |
| 2 | Crear PR base → `feature/consent-gate-fix` |
| 3 | Pegar descripción de este doc |
| 4 | Etiquetar: **Compliance-safe** / **Pilot-ready** |
| 5 | Tras merge: actualizar `ESTADO-CONSENT-FIX.md` con commit final |
| 6 | (Opcional) Añadir captura de consola con orden de logs |

Con esto el PR queda cerrado de forma adecuada y documentada a nivel enterprise.
