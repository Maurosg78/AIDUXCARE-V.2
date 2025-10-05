# AiduxCare — Enterprise Architecture Blueprint  
*Compliance-First System for Allied Health Professionals*  

**Version:** 1.0  
**Market:** CA  
**Language:** en-CA  
**Author:** Technical Thread 1 (Architecture/Infra)  
**Last Updated:** 2025-10-05  

---

## 🧭 Executive Summary

- Architecture designed for **PHIPA/PIPEDA/CPO** compliance from day one.  
- Built on **React + TypeScript frontend**, **Firebase backend (Firestore + Functions)**.  
- Modular **AI Layer** (Vertex AI + Langfuse) handles transcription, reasoning, and audit EVALs.  
- **Audit-first** design: every action loggable and traceable.  
- **Deployment-ready** for Canada-first staging (Niagara) with CI/CD validated.  
- Architecture documented for due diligence and CTO onboarding.  

---

## 🏗️ 1. System Overview

**Diagram:** `/docs/enterprise/diagrams/system-overview.png`  
(If missing, placeholder diagram required by Day 2)

### Layers
| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | React + TypeScript | EMR UI, user interactions |
| Backend | Firebase (Firestore, Functions) | Data storage, business logic |
| AI Layer | Vertex AI, Langfuse | Transcription, SOAP reasoning, compliance EVALs |
| Compliance Layer | CPO + Audit + Consent | Legal conformity and runtime validation |
| CI/CD | GitHub Actions | Testing, linting, compliance checks |
| Monitoring | Langfuse + Logs | Trace AI outputs and user actions |

---

## 🗂️ 2. Data Architecture

### Core Collections (Firestore)
| Collection | Purpose | Key Fields |
|-------------|----------|-------------|
| users | Authentication, roles | uid, role, clinicId |
| patients | Patient profiles | name, dob, healthCard |
| notes | Clinical documentation (SOAP) | patientId, clinicianUid, status, subjective, objective, assessment, plan |
| audit_logs | Trace user actions | entityId, actionType, timestamp |
| consents | Patient consent tracking | patientId, formVersion, signedAt |
| evals | AI conformity scoring | noteId, score, timestamp |

**Indexes:**  
- `notes(patientId, status, createdAt DESC)`  
- `audit_logs(entityId, timestamp DESC)`  

**Storage buckets:**  
- `audio/` (session recordings, encrypted)  
- `exports/` (PDF/JSON exports)  

---

## 🔐 3. Security Architecture

- **Authentication:** Firebase Auth (JWT-based, RBAC)  
- **Authorization:** Firestore security rules + role filters  
- **Data encryption:**  
  - In transit: TLS 1.3  
  - At rest: Firestore native AES-256  
- **Access control:**  
  - Clinicians see only own patients  
  - Admins see all within clinic scope  
- **Logging:** Centralized audit_logs collection  
- **API key rotation:** quarterly via Secrets Manager  

---

## ⚖️ 4. Compliance Architecture

| Requirement | Implementation | Location |
|--------------|----------------|-----------|
| PHIPA Data Minimization | No PII in logs | Guardrail + CI |
| CPO Timeliness | Timestamp on note close | notes.createdAt |
| PIPEDA Right to Erasure | Cascade delete + audit entry | Firestore Function |
| Audit Trail | Append-only logs | audit_logs collection |
| Consent Validation | Signed consent check before note save | consents collection |
| Clinical Evaluation | EVAL via Langfuse trace | evals collection |

---

## 🧠 5. AI/ML Architecture

- **Transcription pipeline:** Whisper API → text normalization  
- **SOAP reasoning:** Vertex AI → structured output (subjective, objective, etc.)  
- **EVAL tracking:** Langfuse traces linked to each note  
- **Prompt versioning:** MCP + Langfuse metadata  
- **Model fallback:** Vertex AI primary → Gemini local backup  

---

## 🚀 6. Deployment & CI/CD

| Stage | Environment | Purpose |
|--------|--------------|----------|
| Dev | Local (Vite + Emulator) | Rapid iteration |
| Staging | Firebase project (Niagara) | Beta testing, PHIPA data |
| Prod | Firebase project (Canada region) | Live clinics |

**Pipeline:**
1. PR → CI Lint + Tests + Guardrail (`check-no-soap-logs`)  
2. Merge → Deploy Staging (auto)  
3. Manual Approval → Deploy Prod  

**Rollback:** Firebase hosting versions kept for 7 days; can revert instantly.

---

## 📈 7. Monitoring & Observability

- **Langfuse:** Logs AI prompts/responses with evals  
- **GitHub Actions:** Checks TypeScript, lint, test coverage  
- **Audit Trail:** Records every clinical and AI action  
- **Alerting:** Email + Slack on deployment or test failure  

---

## 🧾 8. Future Evolution

| Feature | Planned Sprint | Purpose |
|----------|----------------|----------|
| Audit Trail Foundation | Sprint 3 | Compliance and legal defensibility |
| Consent Management | Sprint 4 | Patient data handling |
| EVAL Framework Expansion | Sprint 5 | Clinical quality metrics |
| Evidence Grounding | Sprint 6 | RAG + medical databases |
| Multi-user & Billing | Sprint 8 | Scale for clinics |

---

## 🧩 9. Architectural Principles

- Compliance-first > Feature-first  
- Traceability by default  
- Immutable clinical data  
- Feature flags for safety rollout  
- AI transparency and EVAL logging  
- Simplicity in data model (minimize joins)  

---

## 📘 10. References

- Ontario CPO Documentation Standard (2025 Update)  
- PHIPA Guidelines (2024)  
- PIPEDA Principles of Fair Information (2024)  
- Langfuse Observability Docs  
- Firebase Security Rules Best Practices  

---

**Document Owner:** Thread 1 — Architecture & Infra  
**Definition of Done (DoD):**

✅ Executive Summary (5 bullets)  
✅ System Overview Diagram committed in `/docs/enterprise/diagrams/`  
✅ All sections 1–10 filled  
✅ Table of collections with fields  
✅ Compliance mapping table  
✅ Security model described  
✅ CI/CD pipeline outlined  
✅ PR link attached in daily control  
✅ SoT footer: `Market: CA | Language: en-CA`  

---

_Market: CA · Language: en-CA_
