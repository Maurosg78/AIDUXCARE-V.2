# Informe CTO — Cambios Header y Work Orders

**Fecha:** 13 de febrero de 2026  
**Estado:** Completado  
**Build:** ✅ Pasando

---

## Resumen ejecutivo

Se recuperaron los 6 Work Orders autorizados (perdidos tras `git reset --hard`), se implementó WO-PILOT-FIX-07 (reorganización del header del workflow) y se aplicaron ajustes adicionales solicitados por el CEO.

---

## 1. Recuperación de los 6 WOs (post reset)

Los cambios se reimplementaron desde las especificaciones de `WORK_ORDERS_AUTORIZADOS_INFORME_2026-02-13.md`.

| WO | Descripción | Archivos modificados |
|----|-------------|----------------------|
| **WO-PILOT-FIX-02** | Nombre del paciente en header del workflow | ProfessionalWorkflowPage.tsx |
| **WO-PILOT-FIX-04** | Formulario Ongoing: todos los campos obligatorios | OngoingPatientIntakeModal.tsx, ongoingFormToBaselineSOAP.ts |
| **WO-PILOT-FIX-05** | Spinner de carga al crear baseline | OngoingPatientIntakeModal.tsx |
| **WO-PILOT-FIX-01** | Títulos profesionales (PT., Dr., OT., etc.) + Chiropractor | clinicProfile.ts, ProfessionalOnboardingPage.tsx |
| **WO-PILOT-FIX-03** | Logout global en LayoutWrapper | router.tsx, CommandCenterHeader.tsx |
| **WO-PILOT-FIX-06** | Área clickeable del selector de pacientes | PatientSearchBar.tsx, PatientsListDropdown.tsx, PatientSelectorModal.tsx |

**Consent UI:** Se restauraron también los cambios de gradientes y colores en ConsentGateScreen, ConsentGateWrapper, DeclinedConsentModal, VerbalConsentModal, DisclosurePage, PatientConsentPortalPage.

---

## 2. WO-PILOT-FIX-07 — Reorganización del header

### Objetivo
Reducir sobrecarga de información y mejorar la jerarquía visual del header del workflow.

### Implementación

**Nuevo archivo:** `src/utils/timeGreeting.ts`
- Función `getTimeBasedGreeting()` con saludos según hora local:
  - 05:00–11:59 → "Good morning"
  - 12:00–17:59 → "Good afternoon"
  - 18:00–21:59 → "Good evening"
  - 22:00–04:59 → "Good night"
- Actualización automática cada 60 segundos

**Header en dos líneas:**

| Línea 1 | Línea 2 |
|---------|---------|
| {greeting}, {clinicianDisplayName} | Initial Assessment / Follow-up — {PatientName} |
| [Logout] | [← Command Center] |

**Elementos eliminados:**
- Badge "Email verified · Access granted"
- Logo AiDuxCare 🍁 (se mantiene solo en LayoutWrapper superior)
- Nombre de la clínica (solo fisio en compras individuales; clínica en contratos futuros)

---

## 3. Ajustes adicionales (CEO)

| Ajuste | Razón |
|--------|-------|
| Eliminar AiDuxCare 🍁 del header del workflow | Evitar duplicado; se mantiene en LayoutWrapper superior |
| Eliminar nombre de clínica | No se sabe si el fisio trabaja en varias; la clínica solo aplica a contratos de clínicas; en compras individuales solo se muestra el fisio |

---

## 4. Archivos modificados (resumen)

```
src/utils/timeGreeting.ts                    (NUEVO)
src/utils/clinicProfile.ts                   (WO-01)
src/pages/ProfessionalWorkflowPage.tsx       (WO-02, WO-07, ajustes)
src/pages/ProfessionalOnboardingPage.tsx     (WO-01)
src/pages/DisclosurePage.tsx                 (Consent UI)
src/pages/PatientConsentPortalPage.tsx        (Consent UI)
src/router/router.tsx                        (WO-03)
src/features/command-center/components/OngoingPatientIntakeModal.tsx  (WO-04, WO-05)
src/features/command-center/components/CommandCenterHeader.tsx         (WO-03)
src/features/command-center/components/PatientSearchBar.tsx          (WO-06)
src/features/command-center/components/PatientsListDropdown.tsx       (WO-06)
src/features/command-center/components/PatientSelectorModal.tsx       (WO-06)
src/features/command-center/utils/ongoingFormToBaselineSOAP.ts        (WO-04)
src/components/consent/ConsentGateScreen.tsx
src/components/consent/ConsentGateWrapper.tsx
src/components/consent/DeclinedConsentModal.tsx
src/components/consent/VerbalConsentModal.tsx
```

---

## 5. Verificación

- **Build:** `npm run build` — ✅ OK
- **Linter:** Sin errores en archivos modificados

---

## 6. Próximos pasos recomendados

1. Desplegar a pilot
2. Pruebas manuales del header (saludos por franja horaria, logout, Command Center)
3. Hard refresh (Cmd+Shift+R) tras desplegar

---

## 7. Nuevo feedback recibido (pendiente de WO)

**Export:** `user_feedback_aiduxcare-v2-uat-dev_2026-02-13T11-50-03.json`  
**Ítems no resueltos en Firestore:** 7 (6 ya implementados, 1 nuevo)

### Feedback nuevo — requiere análisis CTO

| ID | Severidad | Tipo | Prioridad calc. |
|----|-----------|------|-----------------|
| **53jMoePBudigRHUcnrvM** | Medio | Sugerencia | 2.5 |

**Descripción (usuario):**
> "Si el paciente ya tiene un ongoing creado, no es necesario marcar en su historia el initial assessment como '?'. Simplemente un guión u otro símbolo en verde para que se sepa que no es bloqueante. Sería importante resolver cómo se marcan y diferencian los distintos initial assessment para paciente que vuelven a la consulta por otra patología."

**Contexto:**
- **Página:** `/patients/{id}/history` (historia del paciente)
- **Problema:** En la vista de historia del paciente, cuando el paciente ya tiene un baseline/ongoing creado, el initial assessment se muestra con "?" (probablemente indicando estado incompleto o pendiente). El usuario considera que eso genera confusión porque no es bloqueante.
- **Propuesta del usuario:** Usar un guión u otro símbolo en verde para indicar que no es bloqueante.
- **Caso de uso adicional:** Pacientes que vuelven por otra patología — cómo marcar y diferenciar múltiples initial assessments en la misma historia.

**Área técnica estimada:** Patient dashboard / Patient history / VisitRecordCard o componentes que renderizan la lista de visitas y su estado.

**Acción sugerida:** Crear WO para revisar la lógica de visualización de estados en la historia del paciente (initial vs ongoing vs follow-up) y el significado del "?".

---

### Los otros 6 ítems — ya implementados (marcar resueltos en Firestore)

Los 6 ítems restantes corresponden a WO-01 a WO-06. El código ya está implementado; falta marcarlos como `resolved` en Firestore:

```bash
node scripts/mark-feedback-resolved.cjs hq7ezKxBeF469uVTThUu g4IwSp2J864mviKnd4Ar g0gkw7PAR97VB5dOFAkt OEJwWDJOg3b3vVyq5zLS JfCq4oAQDOPfvrVsqyHL 0i0Tl9se80Lp541AIJAL
```

---

**Responsable:** CTO  
**Revisado por:** CEO
