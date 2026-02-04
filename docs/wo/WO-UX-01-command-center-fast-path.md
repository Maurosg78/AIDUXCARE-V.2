# WO-UX-01 — Command Center Fast Path (Pilot)

**Estado:** Aprobado por CTO. Listo para ejecución.  
**Objetivo:** Reducir fricción para empezar una sesión clínica **sin tocar backend crítico**.  
**Criterio de éxito:** Un fisio puede abrir la app y empezar una sesión **sin pensar**.

---

## Scope (muy acotado)

| # | Entregable | Criterios de aceptación |
|---|------------|--------------------------|
| 1 | **Eliminar tokens visibles** | Ningún badge ni copy que mencione "tokens" en Command Center ni en flujos de sesión (tarjetas Start New Patient, Continue Existing, opciones de tipo de sesión). Backend/tracking puede seguir existiendo; no exponer en UI. |
| 2 | **Dos CTAs explícitos** | Command Center muestra claramente "Start Initial Assessment" y "Start Follow-up" (o equivalentes EN) desde la primera pantalla o tras elegir paciente, sin depender de expandir "Start Clinical Session". |
| 3 | **Empty state claro** | Bloque "Today's Patients" (o equivalente): si no hay citas/pacientes recientes, texto "No scheduled patients today" (o similar) + CTA principal **"Start in-clinic session now"**. |
| 4 | **Flujo ≤3 acciones** | Desde carga del Command Center hasta pantalla de workflow lista para grabar: máximo 3 acciones (clics/taps). Consent gate: si no hay consentimiento válido, flujo se interrumpe con mensaje claro ("Before we continue, please confirm consent…"), sin parecer error. |
| 5 | **Sin agenda interna** | No implementar "Add appointment". No nuevas colecciones para citas. "Today's patients" puede alimentarse por recency (últimos pacientes vistos) si se desea. |

---

## Fuera de scope (explícito)

- Wireframes detallados o rediseño visual completo.
- Agenda interna (citas con fecha/hora, colección `appointments`).
- Nuevas features clínicas (WSIB/MVA/Certificate siguen en "More" o secondary path).
- Cambios en backend de consent, sesiones o Firestore schema.

---

## Referencias de código

| Área | Archivos |
|------|----------|
| Command Center principal | `src/features/command-center/CommandCenterPage.tsx` |
| Panel Work with Patients (tarjetas, tokens, CTAs) | `src/features/command-center/components/WorkWithPatientsPanel.tsx` |
| Tokens en UI | Buscar "tokens", "SessionTypeService.getTokenBudget", badges con "tokens" en Command Center y flujos de sesión. |
| Session types / CTAs | `WorkWithPatientsPanel.tsx` — tarjetas "Start New Patient Session", "Continue Existing Patient"; al seleccionar paciente, "Start Clinical Session" expandible con sessionTypes. |
| Today's Patients / empty state | Según implementación actual: puede estar en `CommandCenterPage.tsx`, `DashboardStateDisplay`, o bloque "Today's Patients". |
| Consent gate | Flujo en `ProfessionalWorkflowPage.tsx`, `FollowUpWorkflowPage.tsx`; `ConsentGateScreen`, `patientConsentService`. No cambiar lógica; asegurar que el flujo rápido no "salte" el gate (mensaje claro si no hay consent). |

---

## Pre-dev: correr en local antes de afectar dev

Antes de mergear a dev o desplegar:

- [ ] `npm run build` — sin errores.
- [ ] `npm run dev` (o `npm run preview`) — abrir Command Center en localhost.
- [ ] Smoke: sin tokens visibles; CTAs "Start Initial Assessment" / "Start Follow-up" claros; empty state con CTA "Start in-clinic session now"; flujo hasta workflow en ≤3 acciones.
- [ ] Si hay consent gate: probar sin consent y verificar mensaje claro, sin "Skip".
- [ ] Solo entonces: merge a dev / deploy.

**Referencia:** `docs/clinical-user-guide/PRIORIDAD_USER_GUIDE_Y_EJECUCION_LOCAL.md`

---

## Checklist de implementación (dev)

- [ ] Quitar todos los badges/copy de "X tokens" en `WorkWithPatientsPanel.tsx` (y cualquier otro componente del Command Center que los muestre).
- [ ] Quitar referencias a tokens en copy de tarjetas de tipo de sesión (Initial, Follow-up, etc.) en el mismo panel.
- [ ] Ajustar copy/estructura para que "Start Initial Assessment" y "Start Follow-up" sean visibles sin expandir (p. ej. en las dos tarjetas principales cuando no hay paciente, o como dos botones claros al elegir paciente).
- [ ] Implementar o ajustar empty state de "Today's Patients": texto "No scheduled patients today" + botón "Start in-clinic session now" que lleve al flujo de selección de paciente → tipo → workflow.
- [ ] Verificar que el flujo CC → selección paciente (si aplica) → tipo Initial/Follow-up → workflow sea ≤3 acciones; si hay consent gate, verificar mensaje claro y que no se sienta "saltable".
- [ ] Mover WSIB/MVA/Certificate a "More options" o secondary path si aún están al mismo nivel que Initial/Follow-up en la primera vista.
- [ ] Smoke test: abrir Command Center, seguir flujo "Start in-clinic session now" (o Start Initial / Start Follow-up) hasta pantalla de workflow lista para grabar; contar acciones; verificar consent gate si paciente sin consentimiento.

---

## Documento de contexto

- **Informe CTO (decisiones y alertas):** `docs/reports/CTO_COMMAND_CENTER_Y_UX_MEJORAS.md`
- **Alertas CTO:** Schedule = Capa 0 + mínima Capa 1 (sin "Add appointment"); consent gate nunca saltable; para piloto solo Initial/Follow-up upfront, WSIB/MVA en "More".
