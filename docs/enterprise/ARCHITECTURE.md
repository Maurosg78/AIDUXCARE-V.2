## 2. Data Architecture

### Executive Summary
- Single source of truth en Firestore con reglas explícitas por tipo de dato.
- Esquema versionado; migraciones declarativas documentadas.
- Data lifecycle trazable: captura → validación → uso clínico → archivo → borrado.
- Auditoría inmutable para eventos PHI y cambios sensibles.
- Backups automáticos + pruebas de restore documentadas.
- Minimización de datos y retención por políticas (PHIPA/PIPEDA-aligned).

### Firestore Schema (versión v1)
**Collections clave**
- `patients` (PII mínima): `firstName`, `lastName`, `dob`, `mrn`, `primaryClinicianId`, `createdAt`, `updatedAt`, `version`
- `encounters`: `patientId`, `startAt`, `endAt`, `type`, `status`, `createdBy`, `updatedBy`, `auditId`
- `notes`: `patientId`, `encounterId`, `authorId`, `noteType` (SOAP), `content`, `signed` (bool), `signedAt`, `signHash`, `version`
- `attachments`: `encounterId`, `type`, `uri`, `sha256`, `size`, `createdAt`
- `auditTrail`: `entity`, `entityId`, `action`, `actorId`, `ip`, `userAgent`, `ts`, `checksum`
- `consents`: `patientId`, `scope`, `granted`, `grantedAt`, `revokedAt`, `version`
- `rbacRoles`: `roleId`, `permissions[]`, `updatedAt`

**Notas de diseño**
- Campos `createdAt/updatedAt` normalizados en UTC ISO-8601.
- Hashes (`sha256`, `signHash`) para detectar tampering.
- `version` para compatibilidad ante cambios de esquema.

### Patient Data Lifecycle
![data-lifecycle](./diagrams/data-lifecycle.svg)

1) **Ingesta**: captura desde UI o APIs → validación de tipos y tamaños.  
2) **Validación**: reglas de negocio (p. ej., MRN único por clínica).  
3) **Uso clínico**: lectura bajo principio de mínimo privilegio.  
4) **Firma**: notas firmadas generan `signHash` y bloquean edición (ver Security §3).  
5) **Auditoría**: todas las operaciones sensibles registradas en `auditTrail`.  
6) **Retención**: políticas por jurisdicción; auto-archivado de encuentros cerrados.  
7) **Borrado**: solicitudes del paciente → “tombstone” + purge seguro en anexos.

### Audit Trail (flujo)
- **Evento**: antes/después de operaciones críticas se escribe `auditTrail`.
- **Integridad**: `checksum` = HMAC(ts|actor|action|entityId).  
- **Consultas**: índices por `entityId` y `ts` para revisiones rápidas.

### Backups & Recovery
- **Backups**: diarios + retención 35 días (full) y 12 meses (mensuales).  
- **Verificación**: job semanal hace restore a proyecto “shadow” y compara conteos/hash.  
- **Procedimiento de restore**:
  1. Congelar escrituras.
  2. Restaurar snapshot etiquetado.
  3. Reproducir diffs de `auditTrail` si aplica.
  4. Reabrir escrituras, monitorizar errores 24h.

### Esquema de índices sugeridos
- `encounters(patientId, startAt desc)`
- `notes(patientId, signed desc, signedAt desc)`
- `auditTrail(entity, entityId, ts desc)`

### Referencias
- Diagrama del ciclo de vida: `docs/enterprise/diagrams/data-lifecycle.svg`
# AiduxCare — Enterprise Architecture Blueprint (v1)

**Market:** CA · **Language:** en-CA  
**Date:** 2025-10-06

---

## Executive Summary
AiduxCare is a compliance-first clinical documentation platform for physiotherapists and allied health professionals in Ontario, Canada.  
Our stack integrates **React + TypeScript** (frontend), **Firestore** (backend), **Vertex AI** (AI layer), and **GitHub Actions** (CI/CD).  
Design principles:
- Compliance-first (PHIPA/PIPEDA/CPO)
- Predictable, observable AI behaviour
- Immutable auditability

---

## 1. System Overview
![System Overview](./diagrams/system-overview.svg)

**Layers**
| Layer | Tech | Description |
|-------|------|-------------|
| Frontend | React (Vite+TS) | SOAP interface & clinician workflows |
| Backend | Firestore | Source of truth for notes, visits, metrics |
| AI Layer | Vertex AI / Langfuse | Summarization & compliance checks |
| Compliance | PHIPA Guardrails | Prevents PII in logs, immutable signed notes |
| CI/CD | GitHub Actions | Typecheck, lint, test, and infra-protection |

---

## 3. Security & Compliance
- Firestore rules:  
  - Immutable when `status === "signed"`.
  - Only clinician with matching UID can write.
- Logs: No SOAP content, only metadata.
- Feature flags for controlled rollouts.

---

## 4. AI Layer
- Prompt templates versioned under `/ai/prompts/*.md`
- Fallback: deterministic summaries when Vertex unavailable.
- Observability: Langfuse (planned Sprint 7–8)

---

## 5. CI/CD & Environments
| Env | Branch | Deployment | Purpose |
|------|---------|-------------|----------|
| `main` | Production | Vercel | Canada-first |
| `develop` | Staging | Vercel Preview | QA / Compliance runs |
| Feature branches | — | Local + PR | Validated via SoT Guardian |

Workflows:
- `tsc`, `eslint`, `vitest`
- `protect-infra.yml` for restricted areas

---

## 6. Decision Highlights (ADRs)
- ADR-001: React + Firestore chosen over Supabase
- ADR-002: SoT Guardian hooks for CA/en-CA enforcement
- ADR-003: Firestore backend active (Oct 2025)
- ADR-004: Retention & Erasure under PHIPA
- ADR-005: AI Observability (Langfuse) deferred to Sprint 7

---

## Appendix
| Area | File | Responsibility |
|-------|------|----------------|
| Notes | `src/components/notes/SaveNoteButton.tsx` | Entry point for SOAP submissions |
| Rules | `firestore.rules` | Access control |
| CI/CD | `.github/workflows/*` | Pipeline enforcement |
| Docs | `/docs/north`, `/docs/enterprise` | Market source of truth |
