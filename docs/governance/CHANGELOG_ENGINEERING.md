# ENGINEERING.md Changelog

## 2026-05-19 — v1.9

- ADR-009 — Política de scope de imágenes diagnósticas. Base legal España (LOPS, RD 1976/1999, RD 1001/2002, Orden CIN/2135/2008) y Ontario (Physiotherapy Act 1991, CPO mayo 2026).
- Fix FileProcessor: visualScore eliminado del contexto clínico. ocrScore === 0 → rejected.
- Actualiza versión a 1.9 y fecha a 2026-05-19.

## 2026-05-18 — v1.8

- Añadido §1.13 Principio de diseño clínico realista: AiduxCare captura la realidad clínica disponible, estructura según Magee y genera la mejor ficha posible sin agregar carga cognitiva.
- Añadidos ADR-006, ADR-007 y ADR-008: Magee como framework MSK, Zotero como inbox de evidencia candidata y roadmap secuencial de inteligencia clínica.
- Añadidas referencias 28 y 29 para Magee 8th Ed. y la consulta técnica estratégica Vertex AI / Claude de mayo 2026.
- Actualiza versión a 1.8 manteniendo intacta la numeración previa.

## 2026-05-18 — v1.7

- Added safety decision under §1.6: AI-generated physical-test suggestions are disabled by default; manual/library/custom tests remain enabled. Reactivation requires explicit feature flag, region/case guardrails, documented clinical evaluation and CTO approval.
- Añadido §0 Definición de Producto: declaración fundacional de AiduxCare como plataforma documental asistida por IA con memoria longitudinal del paciente y del profesional, y companion thinking como capa de profundidad clínica a demanda.
- Incorpora las tres capas de producto en orden de profundidad regulatoria y de adopción: documentación → memoria longitudinal → companion thinking.
- Incluye nota regulatoria inline que distingue el lenguaje de producto del lenguaje de intended use para documentación MDR/Health Canada.
- Actualiza versión a 1.7 y fecha a 2026-05-18.

## 2026-05-17 — v1.6

- Added §1.12 Clinical Scope Policy — Imaging Analysis.
- Established canonical physiotherapy rule: AiduxCare does not visually interpret diagnostic images for physiotherapy.
- Distinguished permitted source types: written imaging reports/OCR, clinician transcript comments and objective lab values with mandatory attribution.
- Distinguished prohibited source type: diagnostic image visual content cannot generate diagnosis, red flags, treatment, objective findings, key findings or recommended tests.
- Documented deterministic enforcement requirement: prompts may describe the rule, but source classification, post-processing guards and attribution checks enforce it before output reaches SOAP, clinical decisions, memory or Socratic context.
- Added official scope references: BOE RD 1001/2002, BOE Ley 44/2003 and CPO 11 May 2026 scope expansion communication.

## 2026-05-14 — v1.5

- Added §1.7 Diagnostic Imaging Scope Boundary: defines four clinical source levels (transcript, text_layer_pdf, ocr_text, image_visual) with distinct trust levels and prompt rules.
- Established canonical rule: AI is not authorized to interpret diagnostic images; an AI visual description of a radiograph or MRI is not a clinical finding — it is an observation requiring review by a competent professional.
- Added non-negotiable design restrictions for image/OCR attachments in analysis prompts: no AI-generated red flags from visual descriptions, no diagnostic image interpretation, no overruling written radiology reports.
- Documented implementation anchor: `buildAttachmentsSection()` imaging-derived detection and restricted instruction block.
- Added policy type anchor: `ClinicalSourceLevel`, `CanonicalityStatus`, `ImagingInputPolicy`, `ScopeBoundarySignalCategory` in `src/core/clinical-safety/types.ts`.

## 2026-05-13 — v1.4

- Added Principio Sócrates: AiduxCare amplifies clinical reasoning instead of replacing clinician judgment.
- Defined two explicit operating modes: documentation burden reduction and clinician-activated Socratic reasoning.
- Added non-negotiable design restrictions for Socratic mode: traceable observations, forward-looking questions, no imperative clinical language, no repeated same-session prompts and full clinician control.
- Added canonical Socratic architecture: ClinicalContextLedger, threshold evaluation, candidate generation, interaction logging and memory update.
- Established data provenance boundaries: documented facts, AI observations and clinician decisions must not be conflated.
- Added temporal validity as a canonical Socratic constraint: only active, non-superseded and non-expired documented facts can feed threshold evaluation.
- Declared active longitudinal memory as the technical prerequisite for Socratic reasoning.

## 2026-05-07 — v1.3

- Added product north star: AiduxCare as a clinical operating system with auditable AI agents, not an isolated AI note generator.
- Added agentic architecture principles: traceable inputs, verifiable outputs, explicit memory, bounded tools, human confirmation, auditability and prudent escalation.
- Clarified that models are interchangeable components and product advantage lives in the surrounding clinical system: memory, prompts, validators, traceability and clinician authority.

## 2026-05-06 — v1.2

- Added conservative SaMD/MLMD regulatory posture for future commercialization.
- Added Health Canada MLMD 2026 readiness expectations: lifecycle evidence, GMLP, risk management, data, validation, transparency, post-market monitoring and PCCP.
- Added audit baseline artifacts required before commercial sale: intended use, claims register, classification memo, risk file, traceability matrix, model/prompt card, SOC 2 control matrix and DPIA/PIA.
- Added ISO 14971-lite, IEC 62304-lite, ISO/IEC 27001, SOC 2 and ISO/IEC 42001 readiness framing.
- Added rules for clinical feature briefs, commercial claims, AI/ML controls and medical-device cybersecurity readiness.

## 2026-05-05 — v1.1

- Declared `ENGINEERING.md` as the editable source of truth for AiduxCare engineering governance.
- Established PDFs as historical reference artifacts only.
- Added CTO ownership and changelog requirement for future SoT changes.
- Snapshotted the current editable baseline at `docs/governance/ENGINEERING.v2026-05-05.md`.
