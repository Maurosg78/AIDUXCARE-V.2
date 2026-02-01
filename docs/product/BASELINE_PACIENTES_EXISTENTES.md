# Baseline para pacientes existentes — qué pedimos y cómo

**Contexto:** La mayoría de los pacientes que el fisioterapeuta incorpore **no vendrán de sesiones iniciales** en la app. Serán pacientes que ya tenían en su práctica. Si exigimos Initial completo o SOAP inicial en app para follow-up, el piloto se frena y el producto se siente “todo o nada”. Este documento desbloquea la adopción manteniendo **una sola fuente de verdad** (SoT).

---

## 1. Fuente de verdad (sin cambiar)

- **Baseline** = lo que devuelve `getClinicalState(patientId, userId)`:
  - `patient.activeBaselineId` → `clinical_baselines` (snapshot S/O/A/P), o
  - Fallback: última nota en `consultations` (SOAP finalizada) → mapeada a baselineSOAP.
- Si no hay baseline → follow-up no disponible (puerta en UI).
- **No se crean fuentes paralelas.** Definimos una forma mínima y explícita de **crear** un baseline válido que entra por el mismo tubo (`getClinicalState`).

---

## 2. Qué le pedimos al fisio (y por qué)

Objetivo: **contexto clínico operativo** para follow-up — no una evaluación, sino:
- Qué condición/estado tiene el paciente
- Cómo se está tratando y hacia dónde va el plan

Eso es lo que Vertex necesita para no repetir historia, no reinventar el plan y progresar con sentido.

**Dos vías posibles** (ver apartado 3):

1. **Pegar desde EMR / notas** (recomendada, baja fricción): el fisio pega una o varias sesiones que ya tiene con ese paciente en su EMR u otras notas → Vertex **genera un SOAP estructurado** a partir de ese texto → ese SOAP se guarda como baseline.
2. **Formulario mínimo** (alternativa, secundaria): un solo campo largo “Estado actual del tratamiento” (no 4 inputs separados); Vertex puede estructurarlo después si hace falta.

**Aclaración explícita (producto y copy):**

> Este resumen **no reemplaza una evaluación inicial**. Es solo un punto de partida para documentar follow-ups de pacientes ya en tratamiento.

Protege expectativas, uso correcto y línea clínica: Initial completo → ideal; baseline mínimo → suficiente para follow-ups de pacientes existentes.

---

## 3. Cómo lo pedimos (flujo y copy)

### 3.1 Lenguaje (UX)

Evitar términos que suenen a “evaluación” o “baseline técnico”:

- ❌ “Baseline mínimo”
- ✅ **“Resumen clínico inicial”** o **“Estado actual del tratamiento”**

Reduce resistencia psicológica del fisio.

---

### 3.2 Vía principal: pegar desde EMR / notas

**Qué pedimos:**

- “¿Este paciente ya está en tratamiento contigo? Para poder hacer follow-ups en la app necesitamos un **resumen clínico inicial**.”
- “Pega aquí **una sesión reciente** (o varias) que tengas de este paciente en tu EMR o en tus notas. Con eso generamos el contexto para los próximos follow-ups.”

**Cómo funciona:**

1. El fisio pega texto libre (una nota de sesión, o varias concatenadas).
2. El backend envía ese texto a **Vertex** con un prompt tipo: “A partir de esta nota de sesión(es), extrae o genera una nota SOAP estructurada (Subjective, Objective, Assessment, Plan) que sirva como contexto clínico de referencia para futuros follow-ups.”
3. Vertex devuelve un SOAP (S/O/A/P).
4. Guardamos ese SOAP como **baseline** en `clinical_baselines` y setear `patient.activeBaselineId` (Opción B, ver abajo). No guardamos como “consulta” suelta; es un snapshot de estado.
5. A partir de ahí, `getClinicalState` tiene baseline y el follow-up está disponible.

**Ventaja:** El fisio no reescribe nada; corta/pega lo que ya tiene. Vertex hace el trabajo de estructuración y dejamos un SOAP usable como baseline para los follow-ups.

---

### 3.3 Vía alternativa: formulario mínimo (secundaria)

Si el fisio **no tiene** algo que pegar (ej. solo ficha, sin notas de sesión):

- Mismo copy de entrada: “¿Este paciente ya está en tratamiento? Establece un **resumen clínico inicial** para poder hacer follow-ups.”
- **Idealmente un solo campo largo** (“Estado actual del tratamiento”), no 4 inputs separados: menos fricción, menos UI; el fisio escribe mejor en texto libre. Vertex puede estructurarlo a S/O/A/P si hace falta antes de guardar.
- El contenido debe incluir **Plan explícito** (qué tratamiento está en curso); si no, no se puede guardar (guard-rail duro, ver apartado 5).

Guardado: mismo destino que la vía principal → `clinical_baselines` + `patient.activeBaselineId`.

---

### 3.4 Dónde ofrecerlo (producto)

1. **Alta de paciente existente:** Tras crear la ficha, si el paciente ya está en tratamiento: “¿Este paciente ya está en tratamiento? Establece un resumen clínico inicial para poder hacer follow-ups.” → modal/pantalla con **pegado de texto** (vía principal) y opción “No tengo nada que pegar” → formulario mínimo.
2. **Puerta “No baseline — follow-up not available”:** CTA **“Establecer resumen clínico inicial”** → mismo modal (pegar o formulario). Es el lugar correcto para desbloquear sin dar rodeos.

---

## 4. Persistencia: Opción B (recomendación CTO)

**Por defecto: Opción B**

- Crear directamente un documento en **`clinical_baselines`** con el contenido S/O/A/P (ya sea generado por Vertex desde el pegado, o rellenado en el formulario mínimo).
- Setear **`patient.activeBaselineId`** al id de ese baseline.

**Por qué:**

- Semánticamente es correcto: no es una “consulta” suelta, es un snapshot de estado.
- Evita confusión: “¿Por qué hay una consultation sin sesión?”
- Encaja con WO-AUTO-BASELINE-01: baseline explícito (manual o generado), misma fuente de verdad.

**Opción A** (guardar como nota en `consultations`): dejarla solo como fallback histórico si ya existiera algo así; **no** como flujo principal para pacientes existentes.

---

## 4.1 Decisión cerrada: baseline = S/O/A/P listo, uso directo (sin reprocesar)

**Este baseline mínimo alimenta follow-up de forma inmediata, sin pasar por Vertex otra vez.**

- El baseline creado (por pegado + Vertex o por formulario) **ya es S/O/A/P** (objeto con subjective, objective, assessment, plan).
- Ese objeto se persiste en `clinical_baselines` y se usa **directamente** como `clinicalState.baselineSOAP` vía `getClinicalState`.
- El primer follow-up **ya funciona** con ese baseline; no hay paso extra.

**No hacer:**

- ❌ “Guardar baseline y luego generar SOAP de baseline”.
- ❌ “Reprocesar baseline antes del follow-up”.

Evita complejidad innecesaria y entrega valor desde el primer follow-up.

---

## 5. Guard-rail de calidad (duro)

- El baseline **no puede estar vacío** ni ser genérico (ej. “Paciente en tratamiento”).
- **Plan explícito: no negociable.** Si no hay Plan (qué tratamiento está en curso), **no se puede guardar baseline**.
  - Mensaje claro al usuario: *“Para poder generar follow-ups, necesitamos saber **qué tratamiento está en curso**.”*
- Vertex sin Plan tiende a inventar progresiones; este guard-rail protege la calidad clínica del sistema.

---

## 6. Auditoría (sin fricción para el usuario)

Al crear este baseline en `clinical_baselines`:

- `source = 'manual_minimal'` (formulario) o `source = 'vertex_from_paste'` (generado desde pegado).
- `createdFrom = 'patient_existing'`.

No se muestra al usuario; sirve para análisis, métricas del piloto y decisiones de producto.

---

## 7. Resumen ejecutivo: qué y cómo

| Qué pedimos | Cómo lo pedimos |
|-------------|------------------|
| **Contexto clínico operativo** (condición + tratamiento actual) para usar como baseline en follow-ups. | **Principal:** Pegar una o varias sesiones del EMR/notas → Vertex genera SOAP → guardamos en `clinical_baselines` + `activeBaselineId`. |
| Mismo resultado si no tiene nada que pegar. | **Alternativa (secundaria):** Un solo campo largo “Estado actual del tratamiento” → Vertex estructura a S/O/A/P si hace falta → mismo guardado. |
| Lenguaje en UI | “Resumen clínico inicial” / “Estado actual del tratamiento”. Evitar “baseline mínimo”. |
| Dónde | Alta de paciente existente + CTA en puerta “No baseline — follow-up not available”. |

---

## 8. Criterios de aceptación (para WO-MINIMAL-BASELINE-01)

- [ ] Copy del modal/CTA definido y alineado con este doc (resumen clínico inicial, pegar desde EMR).
- [ ] Flujo “pegar texto” → Vertex genera SOAP → guardar en `clinical_baselines` + `patient.activeBaselineId`.
- [ ] Flujo alternativo: un solo campo “Estado actual del tratamiento” (secundario); Plan obligatorio → mismo guardado.
- [ ] Guard-rail duro: sin Plan explícito no se puede guardar; copy “Para poder generar follow-ups, necesitamos saber qué tratamiento está en curso.”
- [ ] Disclaimer en copy: “Este resumen no reemplaza una evaluación inicial. Es solo un punto de partida para documentar follow-ups de pacientes ya en tratamiento.”
- [ ] Decisión cerrada: baseline creado se usa **directamente** como baselineSOAP; primer follow-up sin reprocesar.
- [ ] Campos de auditoría en `clinical_baselines`: `source`, `createdFrom`.
- [ ] Sin fuentes paralelas: baseline sigue siendo solo lo que lee `getClinicalState`.
- [ ] Paciente existente con baseline creado por este flujo puede hacer follow-up en la app.

---

## 9. Referencia técnica

- **Servicio:** `src/services/clinicalStateService.ts` — `getClinicalState`, `getBaselineSafe`.
- **Orígenes de baseline:** `patient.activeBaselineId` → `clinical_baselines`; fallback: última nota en `consultations`.
- **UI follow-up:** ProfessionalWorkflowPage — puerta cuando `followUpBaselineChecked && !followUpClinicalState`.
- **WO relacionado:** WO-AUTO-BASELINE-01 (baseline desde SOAP inicial finalizada en app). Mismo contrato de SoT; este doc añade la vía “paciente existente” (pegar o formulario mínimo).
