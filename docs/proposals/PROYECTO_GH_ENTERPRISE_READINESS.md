# PROYECTO: GitHub Enterprise Readiness — AiDuxCare

**Documento:** PROYECTO_GH_ENTERPRISE_READINESS  
**Versión:** 1.0  
**Fecha:** 2026-02-15  
**Estado:** PROPUESTA — Pendiente aprobación post-inversión  
**Objetivo:** Dejar GitHub en condiciones enterprise para que cualquier investor o ingeniero pueda navegar AiDux con certeza de que estamos ante una manera profesional de trabajar

---

## 1. OBJETIVO ESTRATÉGICO

**Problema actual:**  
- CI no pasa en PRs; workflows complejos; conflictos frecuentes  
- Estructura de branches poco clara  
- Documentación dispersa  
- Falta de estándares visibles para contributors externos  

**Objetivo:**  
Repositorio GitHub que transmita **profesionalismo** y **confianza** a:
- Inversores (due diligence técnico)
- Ingenieros que se incorporen al equipo
- Partners técnicos (integración, auditoría)

---

## 2. FASES DEL PROYECTO

### FASE 1 — Fundamentos (1–2 semanas)  
**Trigger:** Post-inversión o cuando haya recursos dedicados

| # | Tarea | Esfuerzo | Entregable |
|---|------|----------|------------|
| 1.1 | **Branch strategy** | 2 días | Documento `docs/architecture/GIT_BRANCH_STRATEGY.md` + `main` como fuente de verdad |
| 1.2 | **CONTRIBUTING.md** | 1 día | Guía para contributors: commits, PRs, code review |
| 1.3 | **CI mínimo viable** | 3 días | 1 workflow: lint + typecheck + build | 
| 1.4 | **Issue templates** | 0.5 días | `.github/ISSUE_TEMPLATE/` | 
| 1.5 | **PR template** | 0.5 días | `.github/PULL_REQUEST_TEMPLATE.md` |

**Criterio de éxito:** PR nuevo desde `main` pasa CI en <5 min.

---

### FASE 2 — Calidad y Compliance (2–3 semanas)

| # | Tarea | Esfuerzo | Entregable |
|---|------|----------|------------|
| 2.1 | **Branch protection rules** | 1 día | `main` protegido: required checks, review, no force-push |
| 2.2 | **Code owners** | 0.5 días | `CODEOWNERS` para rutas críticas |
| 2.3 | **Security scanning** | 2 días | Dependabot + CodeQL (o similar) |
| 2.4 | **Documentación central** | 2 días | `docs/README.md` como índice de arquitectura |
| 2.5 | **Changelog / releases** | 1 día | `CHANGELOG.md` + tags semánticos |

**Criterio de éxito:** PR requiere 1 approval; dependencias escaneadas.

---

### FASE 3 — Enterprise Grade (2–3 semanas)

| # | Tarea | Esfuerzo | Entregable |
|---|------|----------|------------|
| 3.1 | **Audit log** | 1 día | Documentar eventos críticos (deploy, merge, secrets) |
| 3.2 | **CI/CD pipeline** | 3 días | Build → Test → Deploy staging → Deploy prod (manual gate) |
| 3.3 | **Environments** | 1 día | GitHub Environments: staging, production |
| 3.4 | **Secrets management** | 1 día | Variables/secretos documentados; rotación de secrets |
| 3.5 | **Runbook** | 2 días | `docs/runbooks/` para incidentes comunes |

**Criterio de éxito:** Deploy a staging desde PR; prod con manual approval.

---

### FASE 4 — Investor-Ready (1 semana)

| # | Tarea | Esfuerzo | Entregable |
|---|------|----------|------------|
| 4.1 | **Technical due diligence pack** | 2 días | Documento ejecutivo: arquitectura, seguridad, compliance |
| 4.2 | **README profesional** | 1 día | Badges, quick start, arquitectura high-level |
| 4.3 | **License y compliance** | 0.5 días | LICENSE, NOTICE, dependencias con licencias |
| 4.4 | **Metrics dashboard** | 1 día | (Opcional) Métricas de build, coverage, deploy |

**Criterio de éxito:** Inversor puede evaluar repo en <30 min.

---

## 3. CRONOGRAMA SUGERIDO

| Fase | Duración | Dependencia |
|------|----------|-------------|
| Fase 1 | 2 semanas | Post-inversión o sprint dedicado |
| Fase 2 | 2–3 semanas | Fase 1 completada |
| Fase 3 | 2–3 semanas | Fase 2 completada |
| Fase 4 | 1 semana | Fase 3 completada |

**Total estimado:** 7–9 semanas (con 1 dev part-time o 2–3 semanas full-time)

---

## 4. RECURSOS NECESARIOS

| Recurso | Fase 1 | Fase 2–4 |
|---------|--------|----------|
| 1 Dev (part-time) | 40% | 20% |
| CTO review | 2h | 4h |
| Infra (GitHub Actions mins) | Incluido | Incluido |

---

## 5. RIESGOS Y MITIGACIÓN

| Riesgo | Mitigación |
|--------|------------|
| Romper producción actual | Fase 1–2 no tocan deploy; solo CI y docs |
| Complejidad excesiva | Empezar con CI mínimo; no 22 workflows |
| Falta de tiempo | Priorizar Fase 1 + 4 (investor-ready) |

---

## 6. CRITERIOS DE ACEPTACIÓN GLOBAL

- [ ] Cualquier PR a `main` pasa CI en <10 min
- [ ] `CONTRIBUTING.md` explica cómo contribuir
- [ ] Branch protection activa en `main`
- [ ] Documento de arquitectura accesible
- [ ] Inversor puede evaluar repo en <30 min

---

## 7. REFERENCIAS

- Propuesta archivada: `docs/proposals/archived/PROPUESTA_CI_PILOT_RELAX_2026-02-14.md`
- Informe PR #285: `docs/reports/INFORME_CTO_PR_285_CI_RELAX_2026-02-15.md`
- GitHub Best Practices: https://docs.github.com/en/get-started

---

**Aprobación:** Pendiente — ejecutar post-inversión  
**Autor:** CTO + Cursor AI  
**Fecha:** 2026-02-15
