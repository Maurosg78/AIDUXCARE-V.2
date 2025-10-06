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
