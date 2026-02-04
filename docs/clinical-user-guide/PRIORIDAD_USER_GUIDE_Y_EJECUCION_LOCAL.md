# Orden de prioridad para validar el User Guide + Ejecución en local antes de dev

**Objetivo:** Cerrar los gaps del Clinical User Guide en orden, **corriendo y validando todo en local** antes de afectar dev (merge/deploy).

**Referencias:** `GAPS_AND_ESTIMATE_FOR_GUIDE_DELIVERY.md`, `WO-UX-01-command-center-fast-path.md`, `CLINICAL_USER_GUIDE_PILOT_EDITION_INTERNAL_DRAFT.md`

---

## Estrategia: correr todo en local antes de afectar dev

Antes de mergear a dev o desplegar:

1. **Build en local:** `npm run build` — sin errores.
2. **Tests en local (si aplica):** `npm test` o `npm run test` — sin fallos relevantes.
3. **Smoke en localhost:** `npm run dev` (o `npm run preview` con `dist/`) → abrir Command Center, flujo "Start Initial Assessment" / "Start Follow-up" hasta pantalla de workflow; consent gate si aplica; sin tokens visibles.
4. **Solo entonces:** merge a rama dev / deploy a entorno de desarrollo.

Cada WO o tarea de prioridad 1–5 debe cumplir este ciclo (build → test → smoke local) antes de considerarse listo para dev. La prioridad 6 (versión externa del Guide) es solo documento, no código.

---

## Orden de prioridad (4.5–7 días totales)

### PRIORIDAD 1: WO-UX-01 — Command Center Fast Path (2–3 días)

**Por qué primero:** Es el bloque más grande y afecta la primera impresión del piloto. Sin esto, el resto de la guía no se cumple.

**Qué hacer:**

- Quitar todos los tokens/créditos del Command Center.
- Dos CTAs claros: "Start Initial Assessment" y "Start Follow-up".
- Empty state cuando no hay pacientes: "No scheduled patients today" + CTA **"Start in-clinic session now"** (o "Add your first patient to begin" según copy acordado).
- Flujo ≤3 acciones desde Command Center hasta workflow activo.
- Selección de paciente rápida (sin modales anidados).

**Especificación:** `docs/wo/WO-UX-01-command-center-fast-path.md`

**Pre-dev:** Build + smoke local (Command Center, flujo hasta workflow, sin tokens visibles).

---

### PRIORIDAD 2: Consent Gate UX (0.5 días)

**Por qué segundo:** La guía dice "hard gate, calm but blocking". Confirmar que el mensaje no se siente "saltable".

**Qué hacer:**

- Revisar `ConsentGateScreen` (o donde esté el gate).
- Copy: "Before we continue, please confirm valid patient consent exists" (o equivalente).
- Tono: calm, explanatory, pero bloqueante.
- Sin botón "Skip" o "Continue anyway".

**Criterios de aceptación:**

- [ ] Mensaje claro sobre por qué se bloquea.
- [ ] No existe forma de saltarse el gate.
- [ ] Tono profesional, no "regañón".

**Pre-dev:** Build + smoke local (entrar a workflow sin consent y ver gate; verificar copy y que no hay skip).

---

### PRIORIDAD 3: Feedback sin PHI (0.5–1 día)

**Por qué tercero:** Compliance. La guía dice "Feedback does not require patient data".

**Qué hacer:**

- Revisar `feedbackService` (e.g. `src/services/feedbackService.ts`).
- Eliminar `patientId`, `sessionId`, o datos de paciente del payload por defecto.
- Si hace falta contexto: IDs hasheados o tipo de sesión genérico ("initial" vs "followup").

**Criterios de aceptación:**

- [ ] Payload de feedback no contiene PHI.
- [ ] Aún permite identificar tipo de sesión para debugging.
- [ ] No rompe el flujo de feedback existente.

**Pre-dev:** Build + test (si hay tests de feedback); smoke local (abrir feedback, enviar, revisar payload en red o logs).

---

### PRIORIDAD 4: Auditoría de copy (0.5 días)

**Por qué cuarto:** Evitar contradicciones con §2 de la guía ("no diagnostica / no recomienda").

**Qué hacer:**

- Buscar en código: "AI decides", "recommended", "diagnosis", "treatment recommendation".
- Revisar copy en: Command Center, SOAP Editor (hints, placeholders), Analysis Tab, mensajes success/error.

**Red flags a corregir:**

- ❌ "AI recommends..." → ✅ "Based on your input..."
- ❌ "Diagnosis: ..." → ✅ "Assessment notes:"
- ❌ "AI decides..." → ✅ "Generated content for your review"

**Criterios de aceptación:**

- [ ] Ningún copy sugiere que AI decide autónomamente.
- [ ] Ningún copy sugiere que AI diagnostica.
- [ ] Copy refuerza "tool for clinician, not autonomous agent".

**Pre-dev:** Build; revisión manual de pantallas afectadas en localhost.

---

### PRIORIDAD 5: Verificar Cloudflare Access copy (0.25 días)

**Por qué quinto:** Quick win. Solo verificar que el mensaje sea humano.

**Qué hacer:**

- Abrir https://pilot.aiduxcare.com (o entorno con Access).
- Confirmar copy tipo "One-time code sent to your email" (no "OTP", no "JWT token").
- Si no está bien, ajustar en Cloudflare dashboard.

**Pre-dev:** N/A (no es cambio de código).

---

### PRIORIDAD 6: Versión externa del Guide (1.25–1.75 días)

**Por qué último:** Documento final, no afecta producto.

**Qué hacer:**

1. Copiar `CLINICAL_USER_GUIDE_PILOT_EDITION_INTERNAL_DRAFT.md`.
2. Eliminar todas las líneas `**Implementation note (internal):**` y el párrafo asociado.
3. Tomar 3–4 screenshots limpios (sin datos reales): Cloudflare Access, Command Center (empty state), Workflow/SOAP review, Session saved confirmation.
4. Insertar screenshots en los placeholders 📸.
5. Exportar a PDF (Markdown → Pandoc o Google Docs → PDF).
6. (Opcional) Versión en español si Niagara/MaRS la pide.

**Criterios de aceptación:**

- [ ] PDF sin notas internas.
- [ ] Screenshots profesionales (no datos reales).
- [ ] Formato limpio y legible.
- [ ] Listo para enviar a instituciones.

**Pre-dev:** N/A (solo documento).

---

## Resumen de esfuerzo

| Prioridad | Tarea | Días | Responsable | Pre-dev (local) |
|-----------|-------|------|-------------|------------------|
| 1 | WO-UX-01 (Command Center) | 2–3 | Dev | Build + smoke local |
| 2 | Consent gate UX | 0.5 | Dev + Producto | Build + smoke local |
| 3 | Feedback sin PHI | 0.5–1 | Dev | Build + smoke/test |
| 4 | Auditoría copy | 0.5 | Producto + Dev | Build + revisión local |
| 5 | Cloudflare Access copy | 0.25 | Producto | N/A |
| 6 | Versión externa (PDF) | 1.25–1.75 | Producto | N/A |
| **Total** | | **4.5–7 días** | 1 dev + producto | |

---

## Estrategia de ejecución

- **Semana 1:** WO-UX-01 (2–3 d) + Consent + Feedback (1.5 d) → Command Center nuevo + compliance OK. Todo validado en local antes de dev.
- **Semana 2:** Auditoría copy (0.5 d) + Cloudflare check (0.25 d) + Versión externa (1.5 d) → Guía entregable.

**Punto de decisión:** Tras WO-UX-01 (y smoke local OK), se puede mostrar el piloto a Niagara con confianza. La guía externa puede ir en paralelo.

**Arranque:** WO-UX-01; cada cambio se corre en local (build, smoke) antes de afectar dev.
