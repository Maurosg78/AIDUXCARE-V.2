# CTO Decision: Modal en 2 pasos (Propuesta A)

**Fecha:** 2026-02-03  
**Estado:** Implementado — pendiente feedback de usuario (fisio).

---

## Decisión

Se implementa **Propuesta A**: el CTA principal **"Start in-clinic session now"** abre un **modal en 2 pasos** en lugar de cerrar el modal tras elegir paciente y obligar al usuario a bajar a la sección "Work with Patients" para elegir tipo de sesión.

---

## Justificación (perspectiva fisio)

- **Contexto:** El fisio recibe un paciente y debe crear o elegir al paciente para trabajar de inmediato.
- **Problema anterior:** Tras hacer clic en "Start in-clinic session now" y elegir (o crear) un paciente, el modal se cerraba y abajo aparecían 3 botones. La siguiente decisión ("¿qué tipo de sesión?") quedaba fuera del mismo contexto, con riesgo de confusión o de no ver el siguiente paso.
- **Solución:** Un solo funnel en el mismo modal: **Paso 1 — "Who is the patient?"** (buscar / crear). **Paso 2 — "What type of session?"** (Initial Assessment | Follow-up | Ongoing first time in AiDuxCare). Así el fisio no sale del flujo: quien + tipo + ir, en ≤3 acciones y en un solo lugar.

---

## Comportamiento implementado

1. **CTA "Start in-clinic session now"** (Today's Patients, empty state) → abre `StartSessionTwoStepModal` en paso 1.
2. **Paso 1:** Búsqueda por nombre/email, lista de pacientes, botón "Create New Patient". Al elegir un paciente → se pasa a paso 2 (sin cerrar el modal). Al hacer clic en "Create New Patient" → se cierra el modal y se abre el formulario de crear paciente.
3. **Paso 2:** Título "What type of session?" y nombre del paciente. Tres botones: **Initial Assessment**, **Follow-up**, **Ongoing patient, first time in AiDuxCare**. Botón "Back" para volver al paso 1. Al elegir un tipo → se cierra el modal y se navega al workflow (o se abre el formulario Ongoing intake y luego workflow).
4. **Si el usuario creó un paciente desde paso 1:** Al guardar el nuevo paciente, se reabre el modal directamente en **paso 2** con ese paciente ya elegido, para que elija el tipo de sesión (Initial / Follow-up / Ongoing).

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/features/command-center/components/StartSessionTwoStepModal.tsx` | **Nuevo.** Modal 2 pasos: paso 1 = paciente, paso 2 = tipo de sesión. |
| `src/features/command-center/CommandCenterPageSprint3.tsx` | CTA "Start in-clinic session now" abre `StartSessionTwoStepModal`; estado para reabrir en paso 2 tras crear paciente; callbacks `onStartSession` y `onStartOngoing`. |

---

## Cambios posteriores (feedback fisio)

1. **Ongoing deshabilitado cuando el paciente ya tiene historial:** Si el paciente ya está creado en AiDuxCare (Initial + follow-ups o `activeBaselineId` / sesiones previas), el botón "Ongoing patient, first time in AiDuxCare" en el paso 2 del modal queda **deshabilitado** y muestra el texto: "This patient already has sessions in AiDuxCare — use Initial or Follow-up". Lógica: Ongoing es solo para pacientes que aún no están en AiDuxCare (tratamiento existente, primera vez en la app).

2. **Una sola modalidad:** Se eliminaron las **3 tarjetas** del panel "Work with Patients" cuando no hay paciente seleccionado. En su lugar hay un **único CTA**: "Start in-clinic session", que abre el mismo modal en 2 pasos. Así no hay dos formas de elegir tipo de sesión (tarjetas vs modal); todo pasa por el mismo flujo: CTA → modal (quién → qué tipo) → ir.

---

## Cómo probar

1. Login → Command Center.
2. En "Today's Patients" (empty state), clic en **"Start in-clinic session now"**.
3. **Paso 1:** Buscar y elegir un paciente existente → debe aparecer paso 2 con los 3 tipos de sesión. Elegir uno → debe ir al workflow (o al intake Ongoing).
4. **Paso 1:** Clic en "Create New Patient" → crear paciente → al guardar debe reabrirse el modal en paso 2 con ese paciente; elegir tipo → ir al workflow o intake.
5. En paso 2, clic en "Back" → debe volver al paso 1.

Feedback del fisio/usuario determinará ajustes de copy, orden de botones o refinamientos de flujo.
