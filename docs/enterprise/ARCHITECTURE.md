
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
