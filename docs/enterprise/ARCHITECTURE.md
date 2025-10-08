
### 4.x End-to-End Sample (sanitized)

**Transcript (excerpt)**
[0.0–3.2] PATIENT: Headaches for 2 weeks, frontal, worse in afternoon. No vision changes.
[3.3–5.5] CLINICIAN: Any nausea or fever?
[5.6–6.4] PATIENT: No fever; mild nausea yesterday.

**Generated SOAP (JSON)**
{
  "subjective": {
    "chief_complaint": "Headache for 2 weeks",
    "history": [
      "Frontal location; worse in afternoons",
      "No vision changes",
      "Mild nausea yesterday; afebrile"
    ],
    "citations": [[0.0, 3.2], [5.6, 6.4]]
  },
  "objective": {
    "vitals": { "bp": "120/78", "temp": "afebrile" },
    "exam": [],
    "citations": []
  },
  "assessment": [
    {
      "dx": "Tension-type headache (probable)",
      "confidence": 0.72,
      "rationale": "Pattern + location + afebrile; no neuro red flags",
      "citations": [[0.0, 3.2]]
    }
  ],
  "plan": [
    { "item": "Hydration and sleep hygiene", "citations": [] },
    { "item": "Acetaminophen 500 mg PO PRN", "citations": [] },
    { "item": "Return precautions for red flags", "citations": [] }
  ],
  "meta": {
    "promptId": "soap-scribe",
    "promptSemVer": "1.4.0",
    "model": "gemini-1.5-pro",
    "traceId": "LANGFUSE_TRACE_ID"
  }
}

**Guardrails applied**
- No new facts (limitado al transcript).
- JSON SOAP validable por esquema.
- Citaciones de spans por sección.
## 4. AI Layer

### Executive Summary
- Pipeline de transcripción confiable (Whisper) con normalización, chunking y control de calidad.
- Generación de notas SOAP con Vertex AI usando prompts versionados y guardrails clínicos.
- Evaluación continua con Langfuse: factualidad, estructura y tasas de “hallucination”.
- Trazabilidad end-to-end (prompt ↔ salida ↔ audio) para auditoría y mejora continua.
- Estrategia de versionado/rollback de prompts con experimentación A/B y gates de calidad.
- Minimización de PHI: redacción selectiva y controles de acceso alineados a §3 (Security).

### 4.1 Transcription Pipeline (Whisper)
![ai-pipeline](./diagrams/ai-pipeline.svg)

**Flujo**  
1) **Upload Audio** (UI/API) → validación de formato (wav/mp3, 16kHz mono recomendado).  
2) **Pre-processing**: normalización de loudness, VAD (Voice Activity Detection), opcional diarización.  
3) **Chunking**: segmentos <= 30–60s con solapes de 250ms para continuidad.  
4) **Whisper Inference**: `task=transcribe`, `temperature=0.0–0.2`, timestamps por palabra.  
5) **Post-processing**: fusión de segmentos, corrección de puntuación, normalización de abreviaturas clínicas.  
6) **QC**: confianza media por segmento, % de palabras OOV, heurísticas de ruido; si < umbral → retry/modelo mayor.  
7) **Persistencia**: texto + timestamps + métricas en `encounters/{id}/transcripts/{v}` (ver §2).  

**Parámetros sugeridos**  
- `model=whisper-large-v3` (o distil para costo/latencia).  
- `language=auto`, `beam_size=5`, `best_of=5`, `word_timestamps=true`.  
- **Cost Guardrail**: límite de duración por encuentro; colas con prioridad clínica.

### 4.2 SOAP Generation con Vertex AI
**Objetivo**: convertir transcript en nota clínica **estructurada** (SOAP) con enfoque “explainable-by-structure”.

**Prompting (ejemplo)**  
_Sistema_
_Usuario_

**Guardrails**  
- Redacción de PHI no necesaria si proviene del transcript permitido; nunca añadir nueva PII.  
- Validación de **estructura JSON** (schema), longitud por sección y vocabulario clínico.  
- “No new facts”: comprobación cruzada con spans citados; si falla → “fallback to extractive summary”.

**Persistencia**  
- `notes/{encounterId}/{version}` con `source=vertex-ai`, `promptId`, `model`, `latencyMs`, `qualityScores`.

### 4.3 EVAL con Langfuse
**Integración**  
- Registro de `trace/span` por request: prompt, parámetros, output, métricas.  
- Métricas base:  
  - **StructureScore** (JSON válido y esquema completo)  
  - **Factuality** (overlap con spans citados)  
  - **MedicalStyle** (terminología/claridad)  
  - **Toxicity/PHI-leak** (clasificadores).  
- **Gates** (bloquean promoción a prod): `StructureScore≥0.98`, `HallucinationRate≤1%`, `Coverage≥0.9`.

**Ciclo**  
1) batch nightly sobre muestras nuevas;  
2) dashboards por versión de prompt;  
3) ticket automático si gate falla 2+ veces.

### 4.4 Prompt Versioning Strategy
- **SemVer** de prompts (`soap-scribe@1.4.0`), almacenados en git con metadata (`domain`, `locale`, `schema_id`).  
- **Runtime header**: `{promptId, promptSemVer, model, safety_profile}` incluido en la nota.  
- **Canary/A-B** por clínica o porcentaje de tráfico; **rollback** fijo a `N-1` si gate falla.  
- **Changelog** orientado a hipótesis (p.ej., “mejora de extracción de meds en pediatría”).

### 4.5 Observabilidad & Guardrails
- Rate limiting por usuario/encounter; colas con prioridad clínica.  
- Validadores previos/posteriores (longitud, lenguaje, toxicidad).  
- Telemetría: latencia P50/P95, coste por minuto de audio y por nota; alertas por desviación.  
- Logs sin PHI; referencias cruzadas con `auditTrail` (§2) y controles de acceso (§3).

**Referencias**  
- Diagrama AI pipeline: `docs/enterprise/diagrams/ai-pipeline.svg`  
- Evaluación: Langfuse traces/gates
## 2. Data Architecture
### 2.x Firestore Indexes (operacionales)

> Índices sugeridos para consultas críticas; exportables vía `firestore:indexes`.

```json
{
  "indexes": [
    {
      "collectionGroup": "encounters",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath":"patientId","order":"ASCENDING"},
        {"fieldPath":"startAt","order":"DESCENDING"}
      ]
    },
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath":"patientId","order":"ASCENDING"},
        {"fieldPath":"signed","order":"DESCENDING"},
        {"fieldPath":"signedAt","order":"DESCENDING"}
      ]
    },
    {
      "collectionGroup": "auditTrail",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath":"entity","order":"ASCENDING"},
        {"fieldPath":"entityId","order":"ASCENDING"},
        {"fieldPath":"ts","order":"DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "notes",
      "fieldPath": "content",
      "ttl": {}
    }
  ]
}

### Compliance Mapping (PHIPA/PIPEDA)

#### Executive Snapshot
- Patient data encrypted at rest (AES-256, CMEK/KMS) and in transit (TLS 1.2+, HSTS, pinning).
- Access governed by RBAC (admin/clinician/read_only) + RLS policies; least-privilege enforced.
- Immutable audit trail for PHI events with HMAC checksums and indexed retrieval.
- Data minimization & consent scoping; no PHI in logs; vetted redaction for AI prompts/outputs.
- Backups (daily + monthly) with weekly restore tests to a shadow project; documented DR steps.
- Continuous compliance checks in CI; evidence captured via Langfuse traces and run artefacts.
- Residency & vendor configuration documented per environment; change-control via Git.

#### Controls at a Glance
- **Encryption**: AES-256 at rest (CMEK/KMS rotation), TLS 1.2+ in transit. *Evidence*: §3 “Encryption Architecture”.
- **Access**: RBAC (3 roles) + **4 RLS** on `notes` (read/insert/update/admin). *Evidence*: §3 “RBAC Model”, “RLS Policies”.
- **Auditability**: Append-only `auditTrail(entity, entityId, action, actorId, ts, checksum)`. *Evidence*: §2 “Audit Trail”.
- **Minimization**: PII kept minimal in `patients`; PHI excluded from logs/metrics. *Evidence*: §2 schema & logging policy.
- **Backups/DR**: Daily + monthly snapshots; weekly automated restore check. *Evidence*: §2 “Backups & Recovery”.
- **AI Guardrails**: “No new facts”, JSON schema validation, Langfuse gates. *Evidence*: §4 “EVAL & Guardrails”.

#### PHIPA / PIPEDA Mapping
| Requirement | Implementation | Evidence |
|---|---|---|
| Safeguards (physical/technical) | AES-256 at rest; TLS 1.2+; secret manager; short-lived sessions | §3 Encryption; Auth Flow diagram |
| Limiting collection/use | Minimal PII; consent scoping; access by role/patient | §2 Schema; §3 RBAC/RLS |
| Accuracy & Integrity | Signed notes (immutable); audit checksums; QC on transcripts | §3 RLS (no updates when signed); §4 QC |
| Openness & Accountability | Versioned policies; change-control in Git; monitoring | Repo history; CI logs; Langfuse |
| Individual Access & Correction | DSR workflow; tombstone + secure purge for attachments | §2 Lifecycle (Deletion Request) |
| Retention & Disposal | Policy-based archive; timed deletion; backup rotation | §2 Retention/Archive; Backups |

#### Data-Subject Requests (DSR)
1) Verify identity & scope (patient/record range).  
2) Execute *access export* (redacted where required).  
3) For deletion, write **tombstone** in primary records and purge attachments securely.  
4) Append audit events (`requested`, `fulfilled`, operator `actorId`).  
5) Close ticket with evidence bundle (hashes, timestamps).

#### Automated Compliance Checks (CI)
- Lint for **no-PHI in logs** (denylist + allowlist tests).
- Detect missing **executive summaries/diagrams** in docs PRs.
- Backup evidence present & latest restore test < 7 days; alert if stale.
- Langfuse **gates** enforced: `StructureScore≥0.98`, `HallucinationRate≤1%`, `Coverage≥0.9`.

#### Backup/DR SLOs
- **RPO** ≤ 24h (daily snapshots), **RTO** ≤ 8h (documented restore runbook).
- Monthly restore drill to shadow project with object-count/hash spot checks.

#### Open Items / Risks
- Finalize residency matrix per region/vendor.
- Add formal incident-response tabletop results (quarterly).
- Extend RLS to `attachments` and `auditTrail` views where applicable.
## 3. Security & Compliance

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

> “own” = pacientes asignados al clinician o creados por él.

### Auth Flow
![auth-flow](./diagrams/auth-flow.svg)
Ver `docs/enterprise/diagrams/auth-flow.svg`.  
1) Usuario → MFA → `id_token` + `access_token`  
2) Backend valida firma/claims; emite sesión corta  
3) Autorización = RBAC + RLS  
4) Refresh tokens rotados y revocables

### Row-Level Security Policies (Postgres/Supabase)
> Habilitar RLS por tabla. Ejemplo para `notes`.

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
