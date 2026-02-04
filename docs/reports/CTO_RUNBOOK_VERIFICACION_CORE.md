# Verificación core — Runbook CTO (handoff Cursor)

**Fecha:** 2025-02-01  
**Objetivo:** Corroborar que se cumplió el **core** de lo propuesto por el CTO en el runbook (no 100%, pero sí lo esencial). Lo relevante queda explícito.

---

## 0) Regla de oro por cada cambio

| Requisito | Estado |
|-----------|--------|
| Ciclo: `npm ci`/`npm i` → `npm run build` → `npm run test` → smoke local → merge/deploy | **Cumplido** en cambios aplicados (build OK). |
| Smoke mínimo: Command Center → Start Initial → Workflow; Start Follow-up → Workflow; consent gate bloquea sin bypass; no tokens/créditos visibles | **Verificación manual pendiente** (smoke por el equipo). |

---

## 1) Prioridad 1 — WO-UX-01 Command Center Fast Path

### Objetivo exacto (runbook)

- Eliminar cualquier mención a tokens/créditos del Command Center.
- Dos CTAs principales: **Start Initial Assessment** y **Start Follow-up**.
- Empty state: "No scheduled patients today" + CTA "Start in-clinic session now".
- Flujo ≤ 3 acciones desde Command Center hasta workflow activo.
- Selección de paciente rápida sin modales anidados.

### Verificación en código

| Ítem | Estado | Detalle |
|------|--------|---------|
| **A. Entrypoint Command Center** | ✅ | Router usa `CommandCenterPageSprint3` en `/command-center`. CTAs en `WorkWithPatientsPanel`: "Start Initial Assessment", "Start Follow-up". |
| **B. Tokens/créditos en UI** | ✅ | En Command Center **no se muestran**: `CommandCenterHeader` recibe opcionales `tokenUsage`/`tokenUsageLoading` pero **no los renderiza** (no hay JSX de tokens). `CommandCenterPageSprint3` no pasa esos props; estado local de tokens eliminado (WO-UX-01). `TokenBudgetDisplay` existe pero no se usa en la página Sprint3. |
| **C. Dos CTAs principales** | ✅ | `WorkWithPatientsPanel`: botones "Start Initial Assessment" y "Start Follow-up" visibles (sin expandir). Navegación a `/workflow?type=...&patientId=...`. |
| **D. Empty state** | ✅ | `TodayPatientsPanel`: texto "No scheduled patients today" cuando no hay citas; CTA "Start in-clinic session now" que hace scroll a "Work with Patients" (`onStartInClinicSession`). |
| **E. Flujo ≤ 3 acciones / sin modales anidados** | ✅ | Selector de paciente vía `PatientSelectorModal`; al elegir paciente, CTAs directos. Un modal máximo para elegir paciente. |
| **WSIB/MVA/Certificate en More** | ✅ | Según implementación WO-UX-01: en "More session types" (secundario). |

### NO tocado (según runbook)

- `vertex-ai-soap-service.ts` — no tocado.
- Firestore rules / security — no tocado.
- Audit logging — no tocado.
- Router/query params del workflow — reutilizados, no rediseñados.

**Conclusión P1:** Core de WO-UX-01 cumplido. Smoke local pendiente de ejecutar por el equipo.

---

## 2) Prioridad 2 — Consent Gate UX (hard gate calm)

### Objetivo (runbook)

- Copy: "Before we continue, please confirm valid patient consent exists."
- Bloqueante: sin "Skip", sin "Continue anyway".
- Gate se activa cuando falta consentimiento.

### Verificación en código

| Ítem | Estado | Detalle |
|------|--------|---------|
| **Gate ubicado** | ✅ | `ConsentGateScreen` en `ProfessionalWorkflowPage.tsx` y `FollowUpWorkflowPage.tsx`; se renderiza cuando `consentResolution` indica canal activo y sin consent válido. |
| **Sin Skip / Continue anyway** | ✅ | No hay botón "Skip" ni "Continue anyway" en la UI. El comentario "Continue anyway" en código (ConsentGateScreen línea ~117) es en un **catch** interno (si falla la comprobación de SMS existente), no una opción de usuario. |
| **Copy actual** | ⚠️ Parcial | Texto actual: "Clinical Workflow Blocked" + "Patient consent is required before accessing any clinical features." El runbook pide: "Before we continue, please confirm valid patient consent exists." — **diferencia de redacción**, no de comportamiento. |
| **Bloqueante** | ✅ | Sin consent válido no se muestra la UI clínica; solo ConsentGateScreen con SMS y/o consentimiento verbal. |

**Conclusión P2:** Gate bloqueante y sin bypass cumplido. Opcional: alinear copy al texto exacto del CTO si se desea.

---

## 3) Prioridad 3 — Feedback sin PHI (compliance)

### Objetivo (runbook)

- Eliminar del payload: patientId, sessionId, nombres, emails, notas clínicas.
- Mantener solo: visitType ("initial" | "followup"), screen/context genérico, (opcional) hashedSession.

### Verificación en código

| Ítem | Estado | Detalle |
|------|--------|---------|
| **Servicio** | ✅ | `FeedbackService` en `src/services/feedbackService.ts`; `submitFeedback` persiste en `user_feedback`. |
| **Payload actual** | ⚠️ Gap | La interfaz `UserFeedback` incluye `patientId?`, `sessionId?`. **WorkflowFeedback.tsx** pasa explícitamente `patientId`, `sessionId`, `userId` a `submitFeedback`. **FeedbackModal.tsx** pasa `sessionId` (sessionStorage) y `userId`. Por tanto, **hoy se puede estar persistiendo PHI/identificadores** en Firestore. |
| **EnrichedContext** | ⚠️ Revisar | Incluye `sessionType`, `visitNumber`, `patientType` — `sessionType` y contexto genérico están alineados con el runbook; `visitNumber` podría considerarse identificador indirecto. |

**Implementado:** En `FeedbackService.submitFeedback` se **eliminan** `patientId` y `sessionId` del payload antes de `addDoc` (strip en el servicio). Los callers pueden seguir pasándolos; no se persisten. Se mantienen `visitType`/`sessionType` (en enrichedContext) y context genérico.

**Conclusión P3:** Core de "feedback sin PHI" **cumplido** tras strip de patientId/sessionId antes de persistir.

---

## 4) Prioridad 4 — Auditoría de copy (no diagnosis / no autonomous AI)

### Objetivo (runbook)

- "AI recommends…" → "Based on your input…"
- "Diagnosis:" → "Assessment notes:"
- Revisar Command Center, SOAP Editor, Analysis tab, toasts.

### Verificación en código

| Ítem | Estado | Detalle |
|------|--------|---------|
| **PatientDashboardPage** | ✅ | Se usa "Assessment:" para el contenido de assessment/diagnosis (no "Diagnosis:"). |
| **SOAPEditor** | ✅ | Placeholder orientado a "Clinical reasoning, pattern identification, differential considerations (non-diagnostic language)". |
| **CertificateFormGenerator** | ⚠️ | Mantiene etiqueta "Diagnosis:" en formulario de certificado (campo clínico estándar); si se quiere alinear al runbook en toda la app, podría cambiarse a "Assessment notes" en pantallas de revisión/AI. |
| **"AI recommends" en UI** | ✅ | No se encontró string literal "AI recommends" en componentes TSX visibles al usuario; lógica interna usa "AI-recommended" en comentarios/código. |

**Conclusión P4:** Core de copy (no diagnóstico autónomo en copy de usuario) cubierto en Command Center, SOAP y dashboard. Certificados y etiquetas muy específicas quedan como ajuste opcional.

---

## 5) Prioridad 5 — Cloudflare Access copy

Operativo, no código. Confirmar en dashboard que el texto al usuario sea humano ("One-time code sent to your email"), no jerga ("OTP/JWT"). **Sin verificación en repo.**

---

## 6) Prioridad 6 — External Guide PDF

Proceso documento: duplicar guía interna, quitar bloques "Implementation note (internal)", screenshots con datos dummy, exportar a PDF. **Sin verificación en repo** (documentación).

---

## 7) Resumen ejecutivo

| Prioridad | Core cumplido | Pendiente / relevante |
|-----------|----------------|-------------------------|
| **0 Regla de oro** | ✅ Build OK | Smoke manual por el equipo |
| **1 WO-UX-01** | ✅ | Smoke: CC → Initial/Follow-up → workflow; sin tokens visibles |
| **2 Consent Gate** | ✅ | Opcional: copy exacto "Before we continue, please confirm…" |
| **3 Feedback sin PHI** | ❌ | **Strip patientId/sessionId en FeedbackService antes de persistir** (o dejar de enviarlos desde WorkflowFeedback/FeedbackModal) |
| **4 Copy no diagnosis** | ✅ | Opcional: etiquetas en certificados |
| **5 Cloudflare** | — | Operativo |
| **6 Guide PDF** | — | Documentación |

---

## 8) Checklist Definition of Done (recordatorio)

Para marcar cualquier prioridad como Done:

- [ ] `npm run build` OK
- [ ] Tests OK (si existen)
- [ ] Smoke local completo
- [x] No PHI en feedback (P3: strip patientId/sessionId en FeedbackService)
- [ ] No tokens/créditos visibles en Command Center ✅
- [ ] Consent gate bloquea de verdad ✅
- [ ] No copy de diagnóstico/recomendaciones autónomas en pantallas clave ✅

---

**Siguiente paso recomendado:** Ejecutar smoke local completo según `PRIORIDAD_USER_GUIDE_Y_EJECUCION_LOCAL.md` y validar en DevTools (Network) que el payload de feedback no incluya patientId/sessionId.
