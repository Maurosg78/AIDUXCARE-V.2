# Gaps y estimación para entregar el Clinical User Guide (Pilot Edition)

**Objetivo:** Saber **qué falta implementar** y **cuánto tomaría** para poder entregar la guía de forma honesta (producto alineado con lo que describe la guía + versión externa PDF para Niagara / MaRS / DMZ).

**Referencia:** `CLINICAL_USER_GUIDE_PILOT_EDITION_INTERNAL_DRAFT.md`

---

## 1. Resumen ejecutivo

| Tipo de trabajo | Estado | Esfuerzo estimado |
|-----------------|--------|-------------------|
| **Producto alineado con la guía** (implementation notes) | Parcial | 3–5 días dev |
| **Versión externa de la guía** (PDF sin notas internas + screenshots) | Por hacer | 1–2 días producto |
| **Total para “entregar” guía** | — | **4–7 días** (1 dev + producto/UX) |

La mayor parte del esfuerzo está en **WO-UX-01 (Command Center Fast Path)** y en **quitar tokens**. El resto son tareas acotadas (copy, consent gate, feedback PHI).

---

## 2. Mapeo: guía vs estado actual

Cada **Implementation note (internal)** y requisito de la guía se mapea a: **Hecho** / **Parcial** / **Pendiente**, y a WO o tarea concreta.

| § | Requisito de la guía / Implementation note | Estado | WO / tarea | Esfuerzo |
|---|---------------------------------------------|--------|------------|----------|
| **2** | Copy en app no debe contradecir “no diagnostica / no recomienda” | Parcial | Auditoría de copy (buscar “AI decides”, “recommended plan”, etc.) y ajustar | 0.5 d |
| **3** | Consent = hard gate; UX calmada pero bloqueante | Parcial | Revisar `ConsentGateScreen` copy y flujo; asegurar mensaje tipo “Before we continue, please confirm consent…” | 0.5 d |
| **4** | Cloudflare Access: copy “one-time code”, humano | Hecho / Verificar | Revisar pantalla de acceso; si ya dice “código por email”, listo | 0.25 d |
| **5** | Command Center: sin tokens; siguiente acción obvia; ≤3 acciones hasta workflow | Pendiente | **WO-UX-01** (quitar tokens, CTAs Initial/Follow-up, empty state, flujo ≤3 acciones) | 2–3 d |
| **6 Step 1** | Selección de paciente rápida; sin modales anidados | Parcial | Incluido en WO-UX-01 (evitar deep navigation) | — |
| **6 Step 2** | Initial vs Follow-up explícitos | Parcial | WO-UX-01 (dos CTAs claros) | — |
| **6 Step 3** | Workflow tolera pausas / sesión no continua | Hecho | Flujo actual permite pausar; documentar o verificar edge cases | 0 d |
| **6 Step 4–5** | Revisar y guardar; sin guardado sin confirmación clínico | Hecho | Ya existe review + finalize | 0 d |
| **7** | Sesiones numeradas por orden cronológico; ordinal por encounter order | Hecho | `getSessionOrdinalLabel`, `sessionType` persistido, legacy en usePatientVisits | 0 d |
| **9** | No ocultar limitaciones; transparencia | Copy | Una frase en app o en pantalla de ayuda (opcional) | 0.25 d |
| **10** | Feedback sin PHI por defecto | Pendiente | Revisar `feedbackService`: no enviar `patientId` ni datos de paciente en payload por defecto; o anonimizar | 0.5–1 d |

---

## 3. Desglose de esfuerzo (para entregar la guía)

### 3.1 Implementación (producto alineado con la guía)

| # | Tarea | Responsable | Días |
|---|-------|-------------|------|
| 1 | **WO-UX-01** — Command Center Fast Path (quitar tokens, CTAs Initial/Follow-up, empty state, ≤3 acciones) | Dev | 2–3 |
| 2 | Consent gate: copy y UX “calm, blocking” | Dev / Producto | 0.5 |
| 3 | Auditoría copy: nada que contradiga “no diagnostica / no recomienda” | Producto / Dev | 0.5 |
| 4 | Feedback: payloads sin PHI por defecto (no patientId o anonimizado) | Dev | 0.5–1 |
| 5 | Verificar acceso (Cloudflare) copy “one-time code” | Producto | 0.25 |

**Subtotal implementación:** **3.25–5.25 días** (1 dev + apoyo producto).

### 3.2 Documento externo (versión para entregar)

| # | Tarea | Responsable | Días |
|---|-------|-------------|------|
| 6 | Versión externa del Guide: quitar todas las “Implementation note (internal)” | Producto | 0.5 |
| 7 | Screenshots (3–4): acceso, Command Center, workflow/SOAP, confirmación (limpios, sin datos reales) | Producto / Dev | 0.5–1 |
| 8 | Export a PDF (EN); opcional espejo ES | Producto | 0.25 |

**Subtotal documento:** **1.25–1.75 días**.

### 3.3 Total

| Fase | Días (estimado) |
|------|------------------|
| Implementación (alinear producto con guía) | 3.25–5.25 |
| Documento externo (PDF + screenshots) | 1.25–1.75 |
| **Total** | **4.5–7 días** |

*(Asumiendo 1 dev a tiempo completo en WO-UX-01 + tareas pequeñas, y producto/UX en copy, screenshots y PDF.)*

---

## 4. Orden sugerido (sin dispersión)

1. **WO-UX-01** (Command Center Fast Path) — ya especificado en `docs/wo/WO-UX-01-command-center-fast-path.md`. Es el bloque más grande.
2. **Consent gate** — revisar copy y que el gate no se sienta “saltable”.
3. **Feedback sin PHI** — ajustar `feedbackService` para no incluir patientId/datos paciente en payload por defecto (o anonimizar).
4. **Auditoría copy** — buscar y corregir frases que contradigan §2 de la guía.
5. **Versión externa del Guide** — quitar notas internas, insertar screenshots, exportar PDF.

Con eso la guía es **entregable**: el producto se comporta como describe la guía y el PDF puede enviarse a instituciones sin reservas.

---

## 5. WOs derivados de la guía (resumen)

| WO | Descripción | Prioridad |
|----|-------------|-----------|
| **WO-UX-01** | Command Center Fast Path (Pilot) — tokens fuera, CTAs claros, empty state, ≤3 acciones | 1 |
| **WO-CONSENT-UX** (opcional) | Consent gate: copy “calm, blocking”; mensaje claro cuando no hay consent | 2 |
| **WO-FEEDBACK-PHI** | Feedback: payloads sin PHI por defecto (no patientId o anonimizado) | 2 |
| **WO-COPY-AUDIT** (opcional) | Auditoría copy en app para no contradecir “no diagnostica / no recomienda” | 3 |

WO-UX-01 ya está escrito. Los demás pueden ser tickets cortos (1–2 párrafos de criterios de aceptación) sin documento largo.

---

## 6. Próximo paso con el equipo

1. **Lectura conjunta** del internal draft (secciones 5–7) — 30–45 min.
2. **Marcar en este doc** “Esto ya está” / “A medias” / “No existe” según lo que vean en la app.
3. **Fijar orden y dueños:** WO-UX-01 primero; luego consent + feedback + copy; por último versión externa del Guide y PDF.

Cuando WO-UX-01 esté cerrado y las tareas pequeñas hechas, la guía es **entregable** en 4–7 días desde hoy (según disponibilidad).
