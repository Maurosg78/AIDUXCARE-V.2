# AiDuxCare — Marco de Gobernanza AI
**Versión:** 1.0
**Fecha:** 16 Jun 2026
**Modelo de referencia:** Mayo Clinic AI Governance (adaptado startup)
**Autores:** Mauricio Sobarzo (CEO/Fisioterapeuta) + Claude (CTO AI)
**Revisión siguiente:** Al escalar más allá de 10 usuarios activos o al activar Sócrates

---

## Principio fundacional

En AiDuxCare no existe un comité multidisciplinario formal. La gobernanza
se implementa como **artefactos documentados y verificables** — no personas,
sino evidencia auditable. Cada cuadrante del modelo Mayo Clinic tiene un
artefacto correspondiente en el repositorio.

> "El fisio siempre decide. El sistema nunca dice debe. La trazabilidad
> es completa. La responsabilidad es del profesional."

---

## Cuadrante 1 — Ethical Evaluation & Usage

### Estado actual

| Artefacto | Estado | Ubicación |
|-----------|--------|-----------|
| Physio approval gate (arquitectural) | ✅ Activo | ADR-002, `types.ts:1` |
| ClinicalRedFlagDetector determinista | ✅ Activo | `src/core/clinical/ClinicalRedFlagDetector.ts` |
| Principio Sócrates "nunca dice debe" | ✅ Documentado | `docs/governance/SAMD_CLASSIFICATION_MEMO.md` |
| Safety gate physical test suggestions | ✅ Activo | `ProfessionalWorkflowPage.tsx` |
| regulatoryLanguageGuard | ⚠️ Solo advierte | `src/core/clinical-safety/` |
| Revisión formal de bias algorítmico | ❌ Pendiente | — |
| Evaluación de equidad por subgrupos | ❌ Pendiente | — |

### Gaps y roadmap

**Gap prioritario:** `regulatoryLanguageGuard` debe bloquear output con
lenguaje prescriptivo, no solo registrar warning. (Ver REGULATORY_DECISION_TREE.md §6)

**Gap post-piloto:** cuando AiDuxCare supere 100 sesiones, realizar análisis
de bias por edad, género y tipo de lesión sobre los outputs generados.
La memoria longitudinal acumulada será el dataset para ese análisis.

---

## Cuadrante 2 — Legal, Regulatory & Compliance

### Estado actual

| Artefacto | Estado | Fecha | Referencia |
|-----------|--------|-------|------------|
| RGPD Art.13 — consentimiento informado | ✅ Activo | — | SMS + verbal consent gate |
| DPA Google Cloud (CDPA) | ✅ Firmado | 14 Jun 2026 | GCP Console, maurosg.2023@gmail.com |
| DPA Firebase | ✅ Cubierto por GCP CDPA | 14 Jun 2026 | Mismo proyecto |
| DPO designado | ✅ Mauricio Sobarzo | 14 Jun 2026 | GCP Console |
| Autoridad supervisora | ✅ AEPD España | 14 Jun 2026 | GCP Console |
| REGULATORY_DECISION_TREE.md | ✅ v1.0 | 16 Jun 2026 | `docs/governance/` |
| SAMD_CLASSIFICATION_MEMO.md | ✅ Existe | — | `docs/governance/` |
| API keys en Secret Manager | ✅ Exportadas | 14 Jun 2026 | `AIDUXCARE_FUNCTIONS_CONFIG/v1` |
| DPA OpenAI (Whisper API) | ✅ Firmado | 18 Jun 2026 | Contrato e5347a40, mauricio@aiduxcare.com |
| DPIA (RGPD Art.35) | ❌ Pendiente | — | Requerida antes de Sócrates |
| Audit trail Art.17 (data erasure) | ⚠️ Parcial | — | `apiErasePatientData` sin authorizationProof obligatorio |

### Gaps y roadmap

**Cerrado el 18 Jun 2026:** DPA OpenAI firmado para Whisper API
mediante contrato e5347a40.

**Antes de Sócrates:** DPIA completa bajo RGPD Art. 35. La memoria
longitudinal con datos de salud de categoría especial (Art. 9) requiere
este análisis antes de procesar a escala.

**Antes de escalar:** `apiErasePatientData` debe exigir `authorizationProof`
como campo obligatorio para cumplir RGPD Art. 17 completamente.

---

## Cuadrante 3 — Clinical & Scientific Verification

### Estado actual

| Artefacto | Estado | Ubicación |
|-----------|--------|-----------|
| CLINICAL_AI_EVIDENCE.md (referencias peer-reviewed) | ✅ Existe | `docs/` |
| ClinicalRedFlagDetector validado contra literatura | ✅ Activo | `src/core/clinical/` |
| Physio principal como validador en producción real | ✅ Mauricio Sobarzo, 19 años MSK | Piloto Valencia |
| Prompt constraints ("no diagnostiques, no prescribas") | ✅ Activo | `buildAnalysisPrompt.es.ts` |
| SOAP finalization gate con revisión explícita | ✅ Activo | `SOAPEditor.tsx:1323` |
| Estudio de validación clínica formal | ❌ Pendiente | — |
| Métricas de accuracy de outputs | ❌ Pendiente | — |
| Revisión externa por segundo clínico | ❌ Pendiente | — |

### Gaps y roadmap

**Validación informal actual:** el fisio principal (Mauricio Sobarzo,
fisioterapeuta con 19 años de experiencia clínica MSK) usa el sistema
en producción real y reporta feedback directo. Esto constituye validación
clínica continua en piloto controlado, no un estudio formal.

**Al llegar a 10 usuarios activos:** definir protocolo de validación
clínica. Métricas mínimas: accuracy de red flags vs criterio clínico,
completitud de documentación SOAP, tiempo ahorrado por sesión.

**Al escalar comercialmente:** revisión externa por segundo clínico
independiente (no puede ser el mismo fisio que usa el sistema).

---

## Cuadrante 4 — Organizational Deployment & Change Management

### Estado actual

| Artefacto | Estado | Referencia |
|-----------|--------|------------|
| Reglas de deploy documentadas | ✅ Activo | `ENGINEERING.md` |
| No deploy en horario clínico (lun-vie 9-17h) | ✅ Activo | `ENGINEERING.md` |
| Git workflow con aprobación manual | ✅ Activo | branch `stable` |
| Build solo en Mac (no en VPS) | ✅ Activo | `ENGINEERING.md` |
| pm2 como process manager con restart automático | ✅ Activo | VPS pilot-vps |
| Secret Manager para API keys | ✅ Activo | `AIDUXCARE_FUNCTIONS_CONFIG/v1` |
| whisperProxy auth guard | ✅ Activo | `functions/src/whisperProxy.js` |
| CI/CD automatizado | ❌ Pendiente | Backlog |
| INCIDENT_RESPONSE_PLAN.md | ❌ Pendiente | Backlog |
| Monitoring dashboard performance/fairness | ❌ Pendiente | Backlog |
| Node.js 22 migration | ⏳ Deadline oct 2026 | Backlog, reminder sep 2026 |
| functions.config() → Secret Manager params | ⏳ Deadline mar 2027 | Backlog |

### Gaps y roadmap

**Gap más urgente:** INCIDENT_RESPONSE_PLAN.md. Si hay un incidente
de datos con pacientes reales, el equipo necesita saber exactamente
qué hacer en las primeras 72 horas (obligación RGPD Art. 33).

**Gap operacional:** sin CI/CD, cada deploy es manual y depende del
founder. Para escalar a 10+ usuarios necesita automatización nocturna.

---

## Resumen ejecutivo de gaps por cuadrante

| Cuadrante | Cobertura actual | Gap crítico |
|-----------|-----------------|-------------|
| Ethical Evaluation | 🟡 Parcial | regulatoryLanguageGuard bloquea, no advierte |
| Legal & Compliance | 🟡 Parcial | DPIA antes de Sócrates |
| Clinical Verification | 🟡 Parcial | Sin estudio formal (aceptable en piloto) |
| Deployment & Change | 🟡 Parcial | INCIDENT_RESPONSE_PLAN.md |

**Posición actual:** AiDuxCare tiene gobernanza real y funcional para
un piloto controlado de 2-10 usuarios. Los gaps identificados son
manejables en el horizonte de escala actual. Ningún gap representa
riesgo inmediato para los pacientes o el profesional en el piloto.

---

## Roadmap de gobernanza por fase

### Fase 1 — Piloto (2-10 usuarios, ahora)
- [x] DPA GCP firmado
- [x] Consentimiento RGPD activo
- [x] REGULATORY_DECISION_TREE.md
- [x] DPA OpenAI formal
- [ ] INCIDENT_RESPONSE_PLAN.md
- [ ] regulatoryLanguageGuard → bloqueo

### Fase 2 — Early commercial (10-50 usuarios)
- [ ] DPIA completa (Art. 35)
- [ ] Estudio de validación clínica
- [ ] CI/CD automatizado
- [ ] Monitoring dashboard
- [ ] Segundo revisor clínico externo

### Fase 3 — Scale (50+ usuarios)
- [ ] Análisis de bias por subgrupos
- [ ] Certificación ISO 13485 (si aplica)
- [ ] Re-evaluación SAMD si Sócrates activo
- [ ] Auditoría externa de gobernanza

---

## Historial de revisiones

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 16 Jun 2026 | 1.0 | Creación inicial basada en modelo Mayo Clinic | Mauricio Sobarzo + Claude |

---

*Este documento es evidencia de due diligence de gobernanza interna.
No constituye certificación regulatoria. Revisar con especialista antes
de escalar a uso comercial.*
