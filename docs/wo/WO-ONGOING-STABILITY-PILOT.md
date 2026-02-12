**Work Order – Estabilización Ongoing Intake (Piloto)**

**Proyecto:** AiDuxCare – Pilot  
**Owner:** CTO  
**Prioridad:** Alta (bloqueante para confianza clínica)  
**Scope:** UX + State integrity (NO lógica clínica nueva)

---

## 🎯 Objetivo

Asegurar que el flujo **Ongoing Intake**:

1. **No pierda datos clínicos** durante la interacción.
2. **Cree correctamente paciente + baseline**.
3. **No genere confusión UX** durante la transcripción por micrófono.

Este WO **NO introduce features nuevas**. Solo estabiliza comportamiento existente para pilotos.

---

## 🧩 Feedbacks cubiertos

| ID | Descripción                             | Estado actual |
| -- | --------------------------------------- | ------------- |
| F4 | Ongoing no crea paciente / pierde datos | ❌ NO resuelto |
| F5 | NPRS borra diagnóstico primario         | ❌ NO resuelto |
| F6 | Micrófono “no funciona” hasta soltar    | ⚠️ UX pendiente |

---

## 🧪 Tests Manuales Obligatorios (criterio de aceptación)

### **Test O1 — Create baseline & start session**

**Objetivo:** validar que el flujo crea paciente + baseline sin resetear estado.

**Pasos:**

1. Ir a **Command Center → Ongoing (new patient)**.
2. Completar **todos los campos** (nombre, motivo, diagnóstico primario).
3. Ajustar **NPRS**.
4. Adjuntar (si aplica).
5. Click **“Create baseline & start session”**.

**Resultado esperado:**

- ✔️ Paciente creado en Firestore.
- ✔️ Baseline creada correctamente.
- ✔️ No se borran campos antes del submit.
- ❌ No aparece error “Primary concern required”.

**DONE cuando:**  
✔️ 2 ejecuciones consecutivas sin pérdida de datos.

---

### **Test O2 — NPRS no borra diagnóstico primario**

**Objetivo:** asegurar integridad de estado del formulario.

**Pasos:**

1. En Ongoing Intake, escribir **diagnóstico primario**.
2. Mover **NPRS slider** varias veces.
3. Cambiar de tab (si aplica) y volver.

**Resultado esperado:**

- ✔️ El diagnóstico primario **permanece intacto**.
- ❌ No se resetea ni queda vacío.

**DONE cuando:**  
✔️ El campo nunca se borra en ninguna interacción del NPRS.

---

### **Test O3 — Micrófono (UX esperado)**

**Objetivo:** validar percepción correcta del usuario.

**Pasos:**

1. Activar micrófono en español.
2. Hablar durante 5–10 segundos.
3. Soltar el botón.

**Resultado esperado (estado actual):**

- ✔️ El texto aparece al soltar el botón.
- ⚠️ No hay streaming en tiempo real (esperado).

**Acción requerida:**

- Añadir **copy visible** (temporal):

  > “Recording… transcription appears when you release the button.”

**DONE cuando:**  
✔️ El usuario entiende que el sistema está funcionando.

---

## 🛠️ Archivos bajo revisión

- `src/features/command-center/components/OngoingPatientIntakeModal.tsx`
- `src/components/workflow/TranscriptArea.tsx`
- `src/services/clinicalAttachmentService.ts`
- Estado local del form (React state / controlled inputs)

⚠️ **Prohibido**:

- Reescribir lógica clínica
- Cambiar contratos Firestore
- Introducir side-effects nuevos

---

## 📋 Checklist CTO (obligatorio)

- [ ] Tests O1, O2, O3 ejecutados manualmente
- [ ] Probado en **Windows 13"** (viewport bajo)
- [ ] Sin errores en consola
- [ ] Build pasa (`npm run build`)
- [ ] Feedbacks F4/F5 marcados como `resolved=true` **solo después** de pasar tests
- [ ] Nota de UX añadida para micrófono (F6)

---

## ✅ Definition of Done (DoD)

Este WO se considera **CERRADO** cuando:

- Ongoing Intake **no pierde datos**.
- El submit **crea paciente + baseline** de forma consistente.
- El comportamiento del micrófono **no genera confusión**.
- Los pilotos pueden usar Ongoing sin asistencia.

---

## 🧠 Nota CTO

> Este WO es clave para **confianza clínica**.  
> Un solo formulario que “borra cosas” invalida 10 features bien hechas.

