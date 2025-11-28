---
title: Aidux North — Project Handbook
version: 1.0.0
status: ACTIVE
owners: ["@Maurosg78"]
last_review: 2025-09-25
---

# Aidux North — Project Handbook

> **Documento maestro**. Esta guía es la **fuente única de verdad** para todos los hilos (negocio, regulatory, validación y programación). Ningún flujo puede desviarse de lo aquí definido.

## Tabla de contenidos
1. [Principios rectores](#principios-rectores)
2. [Mapa de hilos y tracks](#mapa-de-hilos-y-tracks)
3. [Roadmap y OKRs](#roadmap-y-okrs)
4. [Flujo de trabajo estándar](#flujo-de-trabajo-estándar)
5. [Calidad, CI y seguridad](#calidad-ci-y-seguridad)
6. [Compliance](#compliance)
7. [Material técnico](#material-técnico)
8. [Comunicación y reportes](#comunicación-y-reportes)
9. [Mensajes permitidos a inversores](#mensajes-permitidos-a-inversores)
10. [Gobernanza y cambios](#gobernanza-y-cambios)

---

## Principios rectores
- **Compliance primero** (CPO, PIPEDA; HIPAA cuando aplique).
- **Sprint diario (lun–dom)**: planificación, ejecución, demo interna breve.
- **No desviarse**: todo trabajo pertenece a un **track oficial** y cumple DoR/DoD.
- **SSoT**: este Handbook manda sobre cualquier hilo o documento.
- **No sobreprometer**: solo mensajes aprobados en la sección de inversores.

## Mapa de hilos y tracks
| Hilo (carpeta Aidux North) | Track asignado | Objetivo |
|---|---|---|
| Hilo programación técnica | Desarrollo de features | Implementación de código + CI/CD |
| Regulatory-to-Code pipeline | Compliance médico | Traducir regulación → especificaciones |
| Shared Resources thread | Infra/DevOps | Reutilizables, buenas prácticas |
| Business plan edición | Business/Investor | Refinar BP y pricing |
| Data & Validation plan | Validación clínica | EVALs, datasets, métricas |
| Investor materials estructura | Business/Investor | Deck, one-pager, LOIs |

> **Definiciones DoR/DoD oficiales** por track: ver `/docs/processes/DOR_DOD_DEFINITIONS.md`.

## Roadmap y OKRs
- **Q4 2024**: 50 usuarios activos, 1000+ SOAPs, 10+ LOIs (~$10K MRR potencial).
- **Q1 2025**: Integraciones EMR.
- **Q2 2025**: Apps móviles.
- **Q3 2025**: Recomendaciones de tratamiento IA.

## Flujo de trabajo estándar
1) Idea/Need en **hilo correcto** →  
2) Especificación (aceptación clínica + impacto compliance) →  
3) Issue (template) y plan →  
4) Implementación (PR con CI) →  
5) Tests/EVALs/Compliance gates →  
6) Deploy preview + demo →  
7) Merge/Release.

Plantillas: ver **/.github/ISSUE_TEMPLATE/** y **.github/pull_request_template.md**.

## Calidad, CI y seguridad
- Lint y typecheck **sin warnings**.
- Cobertura tests **≥80%** en rutas críticas.
- Build < **5 min**; 0 vulnerabilidades **críticas**.
- Sin PHI en logs.

## Compliance
Checklist vivo: `/docs/processes/COMPLIANCE_CHECKLIST.md`.  
Proceso de release: `/docs/processes/RELEASE_PROCESS.md`.

## Material técnico
- Arquitectura: `/docs/technical/ARCHITECTURE.md`
- Despliegue: `/docs/technical/DEPLOYMENT.md`
- API: `/docs/technical/API_REFERENCE.md`
- Handoff técnico Claude: *(cuando se agregue)* `/docs/technical/HANDOFF.md`

## Comunicación y reportes
- **Diario**: update corto (hecho / haré / bloqueos).
- **Semanal (viernes)**: usuarios activos, SOAPs, uptime, logros, foco próximo (Niagara).
- **Mensual**: métricas, testimonios, progreso técnico, runway (board).

## Mensajes permitidos a inversores
- Target **$550K CAD** (enero 2025).
- Sistema funcional con **dual-call architecture**.
- **Validación humana** en el loop.
- **ICD-10 compliance**.
- No prometer escalamiento sin resolver deuda técnica crítica.

## Gobernanza y cambios
- Cambios al Handbook → **PR** + **bump `version`** y entrada en `/docs/CHANGELOG.md`.
- **CODEOWNERS** exige revisión del owner en `/docs/**`.
