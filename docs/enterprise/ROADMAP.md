# AiduxCare — Compliance-First Implementation Roadmap (Enterprise)

**Version:** 1.0  
**Market:** CA  
**Language:** en-CA  
**Owner:** Sprint Coordination  
**Last Updated:** $(date +"%Y-%m-%d")

---

## Executive Summary
- Roadmap de 10 sprints centrado en **compliance-first** (PHIPA/PIPEDA/CPO).
- MVP demuestra **Save + Load** con inmutabilidad y trazabilidad.
- Auditoría clínica, consentimientos y EVALs avanzan en primeras 6–8 semanas.
- CI/CD endurecido: lint, TS, tests, guardrail “no SOAP logs”, branch protection.
- Riesgo controlado con feature flags, staging estable y rollback claro.

---

## Convenciones
- Duración sprint: 1 semana (ajustable).
- DoD por sprint: criterios verificables (CI/PR/evidencia).
- SoT: `Market: CA · Language: en-CA` en commits y docs.

---

## SPRINT 2 (EN CURSO) — Persistence Core (Save + Load + Immutability)
**Objetivo:** Persistir notas con Firestore y demostrar continuidad clínica.  
**Entregables:**
- `notesRepo` CRUD + tests (emulador)
- Save flow UI (draft/submitted/signed)
- Load last note (≤1s p99 dev)
- Firestore rules (no edits si signed)
- Feature flag `AIDUX_PROGRESS_NOTES=false`
**DoD:**
- PRs mergeados + CI green
- Index compuesto creado y documentado
- 2 pacientes demo en staging
- Logs sin texto clínico
**Riesgos:** retraso UI → fallback Save-only

---

## SPRINT 3 — Audit Trail Foundation
**Objetivo:** Trazabilidad clínica (append-only).  
**Backend:**
- `audit_logs`: id, user_id, entity_type, entity_id, action, ts, ip
- Indices por `entity_id` y `timestamp`
**Frontend:**
- Componente de consulta (admin)
- Export PDF/CSV
**DoD:**
- Log en cada acción clínica clave
- Query “últimos N eventos” funcional
- E2E simula requerimiento CPO

---

## SPRINT 4 — Consent Management (PHIPA)
**Objetivo:** Consentimientos firmados y verificables.  
**Backend:** `consents(patient_id, form, version, signedAt, signer)`  
**UI:** flujo de firma y verificación previa a guardar nota  
**DoD:** nota no se guarda sin consentimiento válido

---

## SPRINT 5 — EVALs & Langfuse Integration
**Objetivo:** Evaluaciones de conformidad clínica.  
- Trazas Langfuse por generación
- EVAL básico (completitud, oportunidad, legibilidad)
**DoD:** score adjunto a cada nota generada

---

## SPRINT 6 — Quick Recall (Minimal)
**Objetivo:** Resumen última visita en <1s (staging).  
**DoD:** card con fecha/estado/S/O/A/P truncado

---

## SPRINT 7 — Progress Notes (Diff básico)
**Objetivo:** Comparar últimas 2 notas por sección.  
**DoD:** string-diff estable, sin LLM, edge cases cubiertos

---

## SPRINT 8 — Multi-user & Roles
**Objetivo:** RBAC básico (clinician/admin), clinic scope.  
**DoD:** reglas y tests de acceso aprobados

---

## SPRINT 9 — Integrations (Export)
**Objetivo:** Export PDF y/o JSON, preparación para EMR.  
**DoD:** export reproducible + firmado

---

## SPRINT 10 — Demo Polish & Investor Readiness
**Objetivo:** Pulido de demo, script y evidencia.  
**DoD:** video demo, 2 testimonios beta, deck final

---

## Riesgos Globales y Mitigación
- **Falta de evidencia:** cada “done” requiere PR + CI + pruebas.
- **Deriva de alcance:** congelar scope por sprint; extras van a backlog.
- **Fatiga founder:** bloques de foco (L-M-X dev; J meetings; V pitch).

---

## Anexos
- Diagramas: `docs/enterprise/diagrams/`
- ADRs: `docs/enterprise/ADRs/`
- Estándares: `docs/enterprise/CODE_STANDARDS.md`

---

_Market: CA · Language: en-CA_
