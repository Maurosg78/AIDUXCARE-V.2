# Propuesta CTO: Cierre de feedback Ongoing Patient y correcciones

**Para:** CTO AiDuxCare  
**De:** Equipo Desarrollo  
**Fecha:** 7 de febrero de 2026  
**Asunto:** Cierre del feedback "Ongoing patient — no genera nota / pide volver a rellenar perdiendo info" y propuesta de trabajo aprobable  

---

## 1. Resumen del feedback

- **Origen:** Formulario de feedback en Firebase (user_feedback), reportado por usuarios y recientemente por CEO.
- **Problemas reportados:**
  1. **No genera nota al final:** Tras rellenar el formulario "Ongoing patient, first time in AiDuxCare" y pulsar "Create baseline", el usuario no ve una nota SOAP generada.
  2. **Pide volver a rellenar perdiendo info:** Los campos aparecen vacíos después de haber rellenado todo y pulsar "Create baseline", obligando a rellenar de nuevo y perdiendo información relevante.

---

## 2. Análisis técnico realizado

### 2.1 Flujo actual

- **OngoingPatientIntakeModal:** formulario con secciones Patient record (si paciente nuevo), Chief complaint & subjective, Previous history, Objective, Clinical impression, Plan / next focus.
- Al enviar: se valida, se llama a `createBaselineFromMinimalSOAP`, se actualiza `activeBaselineId` en el paciente y se navega a `/workflow?type=followup&patientId=...` con `state: { baselineFromOngoing: baselineSOAP }`.
- **ProfessionalWorkflowPage:** recibe `baselineFromOngoing`, guarda el baseline en `followUpClinicalState`, hace `replace` en la URL limpiando el state, pero **no** rellenaba la nota SOAP visible (`localSoapNote`). El usuario llegaba al workflow con pestaña SOAP vacía hasta que añadiera actualización clínica y generara SOAP con Vertex.

### 2.2 Causas identificadas

| Problema | Causa raíz |
|----------|------------|
| "No genera nota" | El workflow no prellenaba `localSoapNote` con el baseline al llegar desde ongoing intake; la nota solo se generaba al usar "Generate SOAP" con transcript/checklist. |
| "Campos vacíos / volver a rellenar" | El `useEffect` del modal reseteaba `formDraft` cada vez que cambiaban `isOpen`, `initialPatientId` o `initialPatientName`. Cualquier re-render del padre con cambio de props podía vaciar el formulario mientras el usuario lo estaba rellenando o tras un error de validación. |

---

## 3. Cambios implementados (listos para revisión/merge)

### 3.1 WO-ONGOING-FB: No resetear formulario mientras el modal está abierto

**Archivo:** `src/features/command-center/components/OngoingPatientIntakeModal.tsx`

- **Cambio:** El reset del formulario (y datos del modal) solo se ejecuta cuando el modal **pasa de cerrado a abierto** (`isOpen` false → true), usando un `useRef(prevIsOpen)`.
- **Efecto:** Si falla la validación o el padre re-renderiza sin cerrar el modal, los datos del usuario **no se pierden** y no se pide volver a rellenar por un reset inesperado.

### 3.2 WO-ONGOING-FB: Mostrar nota SOAP al llegar desde Ongoing intake

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

- **Cambio:** Cuando existe `baselineFromOngoing` en el state de navegación, además de guardar el baseline en `followUpClinicalState`:
  - Se llama a `setLocalSoapNote` con el contenido S/O/A/P del baseline (como nota prellenada, no generada por IA).
  - Se cambia a la pestaña SOAP (`setActiveTab('soap')`).
- **Efecto:** El usuario ve de inmediato la "nota" (baseline) que acaba de crear y puede editarla o usarla como base para la sesión de follow-up.
- **Importante — prompts distintos:** Initial y follow-up usan prompts distintos (buildInitialAssessmentPrompt vs buildFollowUpPrompt). El baseline de Ongoing **solo** hidrata el prompt de **follow-up**; nunca se usa para el prompt de initial assessment. El flujo entra por `?type=followup`, por lo que `visitType` queda en `'follow-up'` y el baseline en `followUpClinicalState` solo alimenta la generación de SOAP de follow-up.

---

## 4. Cierre del feedback en Firebase

**Acción para admin (CEO/CTO):**

1. Ir a **Revisión de feedback** (ruta `/feedback-review` o equivalente con permisos admin).
2. Localizar el/los ítems de feedback relativos a:
   - "Ongoing patient", "no genera nota", "crear baseline", "campos vacíos", "volver a rellenar".
3. En cada ítem:
   - **Solución propuesta:** pegar el siguiente texto (o adaptarlo):

```text
CERRADO — WO-ONGOING-FB

Problema 1 — "No genera nota": Corregido. Al crear baseline desde "Ongoing patient, first time in AiDuxCare", el workflow de follow-up ahora prellena la nota SOAP con el contenido del baseline y abre la pestaña SOAP, de modo que el usuario ve la nota de inmediato.

Problema 2 — "Campos vacíos / volver a rellenar": Corregido. El formulario del modal ya no se resetea cuando cambian props del padre; solo se resetea al abrir el modal (false → true). Así no se pierde información si falla la validación o hay re-renders.

Commits / docs: PROPUESTA_CTO_ONGOING_PATIENT_FEEDBACK_FIX.md, OngoingPatientIntakeModal.tsx (reset solo al abrir), ProfessionalWorkflowPage.tsx (setLocalSoapNote + setActiveTab desde baselineFromOngoing).
```

   - Marcar el feedback como **Resuelto** (botón "Marcar resuelto" en la UI de revisión de feedback).

El servicio ya soporta `FeedbackService.updateFeedbackAdmin(id, { solutionProposal, resolved: true, resolvedBy: user.uid })`, usado desde `FeedbackReviewPage`.

---

## 5. Propuesta de trabajo para aprobación CTO

### 5.1 Alcance aprobado en esta propuesta

- **In scope (hecho):**
  - Evitar pérdida de datos en el formulario Ongoing (reset solo al abrir).
  - Mostrar nota SOAP al llegar al workflow desde Ongoing intake (prellenar desde baseline).
  - Documentar y cerrar el feedback en Firebase según sección 4.

### 5.2 Opcional / siguiente iteración (no bloqueante)

- **Relajar validación del formulario Ongoing** según `docs/reports/ONGOING_PATIENT_FORM_ANALYSIS.md`: solo **chief complaint** y **plan** (≥15 caracteres, no genérico) obligatorios; el resto de campos opcionales para reducir fricción y errores de validación. Requiere cambio en `OngoingPatientIntakeModal` (validaciones) y posible ajuste en `createBaselineFromMinimalSOAP` si se mantiene el mínimo actual de plan.
- **Auto-tag en feedback:** Añadir un tag tipo `ongoing-patient-form` cuando el contexto (URL o descripción) indique flujo "Ongoing patient" para facilitar filtrado en la revisión de feedback.

### 5.3 Criterios de aceptación (para esta entrega)

- [x] Al abrir el modal Ongoing, el formulario se resetea.
- [x] Si la validación falla, el formulario **no** se vacía (los datos permanecen).
- [x] Tras "Create baseline" exitoso, el usuario llega al workflow en pestaña SOAP con la nota prellenada con el contenido del baseline.
- [ ] Admin cierra en Firebase el/los feedbacks correspondientes con la solución propuesta y "Resuelto".

---

## 6. Referencias

- `src/features/command-center/components/OngoingPatientIntakeModal.tsx` — modal y reset.
- `src/pages/ProfessionalWorkflowPage.tsx` — efecto que lee `baselineFromOngoing` y ahora setea `localSoapNote` + `activeTab`.
- `src/services/feedbackService.ts` — `updateFeedbackAdmin`, `listUnresolvedFeedback`.
- `src/pages/FeedbackReviewPage.tsx` — UI de revisión y "Marcar resuelto".
- `docs/reports/ONGOING_PATIENT_FORM_ANALYSIS.md` — análisis del formulario y mínimo obligatorio (chief complaint + plan).

---

## 7. Aprobación CTO — APROBADO

**Estado:** ✅ **READY FOR MERGE · READY FOR FEEDBACK CLOSURE**  
**Aprobado por:** CTO AiDuxCare  
**Fecha:** 7 de febrero de 2026  

### Decisión técnica (CTO)

- ✔️ Causa del "no genera nota" correctamente identificada (estado/UX de transición, no IA/Vertex).
- ✔️ Reset por `useEffect` dependiente de props identificado como bug clásico de React; solución con `prevIsOpen` correcta.
- ✔️ Prellenar `localSoapNote` sin llamar a IA: decisión correcta (sin confusión clínica, sin costos innecesarios, baseline humano vs SOAP generado bien separados).
- ✔️ Sin deuda técnica ni side-effects evidentes.

### Decisión de producto

- Elimina fricción clínica severa, restaura confianza ("lo que escribo no se pierde"), alinea con el modelo mental del fisio ("si acabo de crear una nota, quiero verla"). Habilita piloto real.

### Alcance aprobado

- **In scope:** Reset solo al abrir modal, persistencia ante errores de validación, prellenado de nota SOAP desde `baselineFromOngoing`, navegación a pestaña SOAP, documentación para cierre de feedback.
- **Fuera de scope (correctamente excluido):** Cambios de lógica clínica, generación automática de SOAP por IA, refactors amplios del workflow.

### Instrucción formal post-aprobación

1. **Proceder a merge** de los cambios descritos.
2. **Cerrar los feedbacks** en Firebase usando el texto de la sección 4; marcar como **Resuelto** con `resolvedBy` correspondiente.
3. **Registrar este fix como:** *Milestone UX crítica cerrada — Ongoing intake*.

### Siguiente paso recomendado (no bloqueante)

Relajar validación del Ongoing intake (chief complaint + plan como mínimos clínicos), cuando se decida; correctamente fuera de este WO.

---

## 8. Checklist post-aprobación (implementación)

| # | Acción | Responsable | Estado |
|---|--------|-------------|--------|
| 1 | Merge a main (cherry-pick aplicado en main; push requiere ejecutar `git push origin main` localmente) | Dev | Hecho (push manual) |
| 2 | Ir a `/feedback-review`, localizar feedback(s) Ongoing patient / no genera nota / crear baseline | Admin (CEO/CTO) | Pendiente |
| 3 | Pegar "Solución propuesta" (sección 4) y pulsar **Marcar resuelto** | Admin | Pendiente |
| 4 | Registrar milestone: **UX crítica cerrada — Ongoing intake** → registrado en `docs/status/MILESTONES_UX.md` | Equipo | Hecho |
| 5 | Actualizar VPS: `./scripts/deploy-pilot-vps.sh` (ver `CIERRE_FEEDBACK_ONGOING_PASOS.md`) | Dev/Ops | Pendiente |
