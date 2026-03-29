# Handoff: historial del paciente — Editar / Eliminar / versiones SOAP

## Objetivo

`PatientDashboardPage`: acciones por visita alineadas al estado de la nota SOAP.

## Reglas de negocio

- Si `visit.soapNote?.status === 'finalized'`: mostrar botón **Editar** (siempre). No **Eliminar**.
  - Editar crea nueva versión (nuevo id/número), append-only en `soap_versions`, snapshot anterior inmutable.
  - Lista muestra solo versión actual; badge i18n **Modificado** si no es v1.
- Si no está `finalized` (incl. `showPendingClosure` / draft / sin nota cerrada): mostrar **Eliminar** (archivar soft `deleted_sessions`). No **Editar**.
- **Nunca:** borrar `finalized`; nunca mostrar versiones antiguas al fisio.

## Familia A / B (resumen)

| Familia | Condición | Acciones |
|---------|-----------|----------|
| **A** | `soapNote.status === 'finalized'` | Editar, Ver SOAP; nunca Eliminar |
| **B** | no `finalized` | Eliminar (archivo), Ver SOAP si aplica; nunca Editar como nota legal |

## Archivos previstos

- UI: `src/features/patient-dashboard/PatientDashboardPage.tsx` (+ servicios que carguen visitas).
- Persistencia: `PersistenceService` / Firestore; reglas coherentes con versiones append-only.

## QA sugerido

- Finalized: Editar 2× → una fila visible, badge Modificado, historial interno de versiones; fisio solo ve última.
- Pending: eliminar → desaparece del listado; registro en archivo si aplica política.

---

## Estándar de código obligatorio

- Una operación por línea
- Variable intermedia obligatoria por cada paso
- Sin operaciones encadenadas ni efectos secundarios ocultos
- Al inicio de cada prompt mostrar % de contexto restante del agente

---

## Estado actual del repo

- Branch: **stable** | HEAD: **7113a82** (verificar con `git rev-parse HEAD`)
- VPS: **pilot.aiduxcare.com** — deploy pendiente (`git pull` + build)
- Pendiente inmediato antes de los botones:
  1. Deploy VPS (`git fetch` + `reset`/`pull` + build + `pm2 restart`)
  2. Limpiar 1 visita fantasma restante de **Maritza Lyon** en historial (origen `consultations`/`encounters`, no `sessions`) → inspeccionar con:

```bash
node scripts/qa/inspect-patient-session-state.mjs "Maritza Lyon"
```

(Requiere `GOOGLE_APPLICATION_CREDENTIALS` o ADC y `.env.local` con proyecto Firebase.)

---

## Contexto técnico de arranque (dashboard)

- Visitas se agregan desde: `sessions`, `consultations` (vía `PersistenceService.getNotesByPatient`), `encounters` — ver `usePatientVisits.ts`.
- Estados UI actuales: `showPendingClosure`, `isResumableInitial`, `soapNote?.status`.
