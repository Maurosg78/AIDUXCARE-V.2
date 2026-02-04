# Ongoing Patient Form — Análisis y plan (CTO spec vs AiDuxCare)

## Objetivo

- El botón **"Ongoing patient, first time in AiDuxCare"** abre un formulario que:
  - Alimenta el **baseline** sin ambigüedad.
  - Permite crear/hidratar al paciente y la sesión actual + el follow-up posterior.

## Mapeo CTO → modelo actual

| CTO (Estructura) | AiDuxCare hoy | Acción |
|-------------------|----------------|--------|
| PatientDemographics (age, DOB, sexAtBirth, genderIdentity, occupation, dominantSide) | Patient: birthDate, chiefComplaint; no hay occupation/dominantSide/sex | Opcional: añadir campos opcionales a patient o a un blob `ongoingIntake` en baseline. |
| LifestyleContext (physicalActivity, workDemands, sport) | No existe | Opcional; texto libre que puede ir a subjective o a metadata. |
| ClinicalContext (primaryConcern, onset, mechanism, medicalHistory, imaging, redFlags) | No estructurado | Opcional; puede alimentar subjective/assessment. |
| Baseline Subjective (chiefComplaint, pain, functionalLimitations, goals) | Baseline snapshot: keyFindings[0] = subjective | **Requerido para baseline**: chiefComplaint + texto subjective. |
| Baseline Objective (ROM, strength, neuro) | Baseline snapshot: keyFindings[1] = objective | **Requerido para baseline**: texto objective. |
| Baseline Summary | snapshot.primaryAssessment, keyFindings, planSummary | Derivado del form (assessment → primaryAssessment; plan → planSummary). |
| SessionDelta, ClinicalImpression, PlanSnapshot | SOAP en sesión | Plan **obligatorio** para `createBaselineFromMinimalSOAP` (min 15 chars, no genérico). |

## Corrección sugerida (no seguir CTO al pie de la letra)

- **CTO:** “Nada obligatorio salvo patientId.”
- **Realidad técnica:** `createBaselineFromMinimalSOAP` exige **plan** válido (≥15 caracteres, no genérico) para poder generar follow-ups útiles.
- **Propuesta:** En el piloto, exigir solo:
  1. **PatientId** (ya tenemos paciente seleccionado).
  2. **Chief complaint** o equivalente (una línea de “motivo principal”).
  3. **Plan / next focus** (texto libre, min 15 caracteres, no “en tratamiento”, “n/a”, etc.).

  El resto de campos (subjective, objective, assessment, demographics, lifestyle, clinical context) **opcionales**. Si el clínico no los llena, se guardan vacíos y el baseline queda con plan + chief complaint; el primer follow-up puede completar.

- **Baseline inmutable:** Siempre creamos un nuevo baseline (`createBaseline` / `createBaselineFromMinimalSOAP`), nunca overwrite. OK.
- **Exactitud > normalización:** Formulario con texto libre; sin rangos ni categorías forzadas. OK.
- **AI no completa campos:** Solo resume/compara/redacta con lo existente. Fuera de alcance de este form.

## Mínimo obligatorio para el piloto

1. **patientId** — ya disponible (paciente seleccionado).
2. **Chief complaint** (o “Primary concern”) — una línea, para keyFindings[0] / subjective.
3. **Plan / Next focus** — texto libre ≥15 caracteres, no genérico, para `planSummary`.

Opcional pero recomendado: **Subjective** (texto), **Objective** (texto), **Assessment/Impression** (texto) para que el snapshot sea rico y el follow-up esté bien hidratado.

## Flujo de implementación

1. **Botón:** “Ongoing patient, first time in AiDuxCare” (o “Ongoing (first time in AiDux)” en el botón + tooltip largo).
2. **Al hacer clic:** Abrir modal **Ongoing Patient Intake** con paciente ya seleccionado.
3. **Formulario (secciones):**
   - **Demographics (opcional):** age/DOB, sexAtBirth, genderIdentity, occupation, dominantSide — si no existen en Patient, guardar en patient o en metadata del baseline.
   - **Lifestyle (opcional):** physicalActivityDescription, workPhysicalDemands, sportOrRecreationalActivities — texto libre.
   - **Clinical context (opcional):** primaryConcern (region + side), onsetDescription, mechanismOfInjury, relevantMedicalHistory, relevantImagingOrTests, redFlagsIdentified.
   - **Baseline Subjective:** chiefComplaint (recomendado), pain (opcional), functionalLimitations, patientGoals — texto libre.
   - **Baseline Objective:** observationNotes, ROM findings, strength findings, neurologicalFindings — texto libre.
   - **Assessment / Impression:** texto libre (mapea a primaryAssessment).
   - **Plan / Next focus:** obligatorio, min 15 caracteres, no genérico (mapea a planSummary).
4. **Submit:**  
   - Construir `soap: { subjective, objective, assessment, plan }` desde el form (concatenar secciones opcionales en S/O/A si hace falta).  
   - `createBaselineFromMinimalSOAP(patientId, soap, createdBy, 'manual_minimal')`.  
   - `PatientService.updatePatient(patientId, { activeBaselineId: baselineId })`.  
   - Navegar a `/workflow?type=followup&patientId=patientId`.
5. **Hidratación:** El workflow de follow-up ya usa `getBaselineById(patient.activeBaselineId)`; con este baseline creado, la sesión actual y los follow-ups posteriores quedan hidratados.

## Resumen

- **Sí implementar:** Form Ongoing Patient con mínimo chief complaint + plan (obligatorios para baseline), resto opcional; crear baseline, asignar `activeBaselineId`, ir a workflow follow-up.
- **No cambiar:** Regla de baseline inmutable; AI no rellenando campos; exactitud > normalización.
- **Fase 2 (opcional):** Persistir Demographics / Lifestyle / Clinical context en patient o en documento asociado al baseline para uso futuro y reportes.

---

## Implementado (piloto)

- **Botón:** "Ongoing patient, first time in AiDuxCare" con subtítulo "Existing treatment, first time in app — fill intake to create baseline".
- **Modal:** `OngoingPatientIntakeModal` — Chief complaint (recomendado), Subjective / Objective / Assessment (opcional), Plan / Next focus (obligatorio, min 15 caracteres, no genérico).
- **Submit:** `createBaselineFromMinimalSOAP(..., source: 'ongoing_intake')`, `PatientService.updatePatient(patientId, { activeBaselineId })`, navegación a `/workflow?type=followup&patientId=...`.
- **Auditoría:** `MinimalBaselineSource` incluye `'ongoing_intake'`.
