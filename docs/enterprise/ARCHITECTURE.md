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

## 2. Data Architecture
| Collection | Purpose | Key Indexes | Retention |
|-------------|----------|--------------|------------|
| `notes` | SOAP notes | `(patientId, status, createdAt desc)` | 7 years |
| `audit_logs` | Change history | `(entityId, timestamp)` | 10 years |
| `consents` | Patient consents | `(patientId, active)` | 10 years |

Erasure follows PHIPA/PIPEDA guidelines.  
(See ADR-004 “Retention and Erasure Policy”)

---

## 3. Security & Compliance
- Firestore rules:  
  - Immutable when `status === "signed"`.
  - Only clinician with matching UID can write.
- Logs: No SOAP content, only metadata.
- Feature flags for controlled rollouts.

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


## 4. Security Architecture

### Executive Summary
- Cifrado end-to-end: datos en reposo (AES-256, claves rotadas) y en tránsito (TLS 1.2+ con HSTS).
- RLS restringe acceso por paciente/clinician bajo mínimo privilegio.
- RBAC con 3 niveles (admin / clinician / read-only) y permisos declarativos.
- Notas firmadas inmutables; auditoría criptográfica de eventos PHI.
- MFA, sesiones cortas y rotación/revocación de tokens.
- Controles PHIPA/PIPEDA + pruebas periódicas de backup/restore.

### Encryption Architecture
**At rest.** PHI cifrada con AES-256; claves en KMS (CMEK), rotación programada y separación de deberes.  
**In transit.** TLS 1.2+ con HSTS; ciphers débiles deshabilitados; certificate pinning en móviles.  
**Secrets.** En secret manager; CI con scopes mínimos (principio Zero-Trust).

### RBAC Model
| Role      | Read patient | Write notes | Sign notes | Manage users | View audit |
|-----------|--------------|-------------|------------|--------------|------------|
| admin     | ✔︎ all       | ✔︎ all      | ✔︎         | ✔︎           | ✔︎         |
| clinician | ✔︎ own       | ✔︎ own      | ✔︎ own     | ✘            | limited    |
| read_only | ✔︎ scoped    | ✘           | ✘          | ✘            | limited    |

“own” = pacientes asignados al clinician o creados por él.

### Auth Flow
![auth-flow](./diagrams/auth-flow.svg)
Ver `docs/enterprise/diagrams/auth-flow.svg`.  
1) Usuario → MFA → `id_token` + `access_token`  
2) Backend valida firma/claims; emite sesión corta  
3) Autorización = RBAC + RLS  
4) Refresh tokens rotados y revocables

### Row-Level Security Policies (Postgres/Supabase)
Habilitar RLS por tabla. Ejemplo para `notes`.

```sql
-- Requisitos previos
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 1) Clinician solo lee notas de sus pacientes
CREATE POLICY clinician_read_own ON notes
FOR SELECT
USING (
  auth.uid() = clinician_id
);

-- 2) Clinician inserta notas propias y de pacientes asignados
CREATE POLICY clinician_insert_own ON notes
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM patient_clinicians pc
    WHERE pc.patient_id = notes.patient_id
      AND pc.clinician_id = auth.uid()
  )
);

-- 3) Notas firmadas no se pueden actualizar
CREATE POLICY update_unless_signed ON notes
FOR UPDATE
USING (NOT signed)
WITH CHECK (NOT signed);

-- 4) Admin acceso total
CREATE POLICY admin_all ON notes
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
