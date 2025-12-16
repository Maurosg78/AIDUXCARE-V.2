---
Market: CA
Language: en-CA
Document: Product Roadmap - CANONICAL
Title: Aidux North - Roadmap to Beta
Version: 1.1
Date: 2025-10-02
Status: ACTIVE - This is the single source of truth
---

# ⚠️ CANONICAL ROADMAP - Aidux North

**Este es el único roadmap válido para el mercado canadiense.**  
Cualquier otro archivo llamado "roadmap" en el proyecto es legacy y debe ignorarse.

**Ubicación:** `docs/north/NORTH_ROADMAP.md`  
**Última actualización:** 2 octubre 2025

---

# Informe de Sprints — Roadmap hacia Aidux Beta

## Contexto

AiduxCare V.2 está actualmente en la versión **v2.11.0**, con un MVP estable en desarrollo y enfoque **Canada-first** (SoT North, en-CA). El objetivo inmediato es lograr una **versión Beta clínica funcional** para pilotos en **Niagara (Ontario)** con fisioterapeutas, alineada a normativa **CPO + PHIPA/PIPEDA**.

**Plazo estimado:** 10 semanas → **Beta listo diciembre 2025**

---

## Sprint W40-W41: Cierre técnico y limpieza

**Estado:** ✅ COMPLETADO (30 sept 2025)

**Objetivo:** Entregar un baseline limpio y estable sobre el que construir la Beta.

### Completado
- ✅ EMR ports/adapters (FHIR mock + stubs Jane/Noterro)
- ✅ SOAP Builder + Renderer (en-CA)
- ✅ CPO compliance rules + CI integration (blocking PRs)
- ✅ Metrics service (Supabase ports)
- ✅ Tests unitarios (12 tests pasando, 100% success)
- ✅ Supabase migration (4 tablas métricas)
- ✅ SoT enforcement activo en commits/PRs
- ✅ SOAP Preview real-time (analysis tab)
- ✅ CPO runtime validation (blocking saves)
- ✅ Note persistence (localStorage mock)

**Commits:** 
- Sprint 0: PR #130
- Sprint 1: 2cdbbfd (SOAP Integration)

**Documentación:** 
- `docs/north/sprints/2025-W40-sprint0.md`
- `docs/north/sprints/2025-W41-sprint1-report.md`

**Duración real:** 3 días (Sprint 0: 1 día, Sprint 1: 2 días)  
**Estimado:** 7 días  
**Varianza:** ⚡ 57% más rápido

---

## Sprint W42-W43: Personalización por perfil profesional

**Estado:** 📋 PLANNED (arranca 3 oct 2025)

**Objetivo:** Sistema se adapta al estilo de práctica del profesional y respeta scope legal.

**Owner:** Hilo "Data & Validation"

**Documentación:** `docs/north/sprints/2025-W42-sprint2-planned.md`

### Fases
1. Onboarding simplificado (3-4 días)
2. Aprendizaje adaptativo (5-6 días)
3. Filtrado por scope legal (3-4 días)

**DoD:**
- [ ] 80%+ usuarios completan nuevo step onboarding
- [ ] Modal de refinamiento aparece ~15 días de uso
- [ ] 30%+ incremento en acceptance rate post-personalización
- [ ] 0 sugerencias de técnicas sin certificación aplicadas

---

## Sprint W44-W45: Audio clínico inteligente (MVP)

**Estado:** 📋 PLANNED

**Objetivo:** Capturar información desde micrófono para disminuir carga administrativa.

**DoD:**
- [ ] Audio puede activarse voluntariamente
- [ ] Transcripción genera checklist usable
- [ ] Sugerencias respetan perfil del profesional

---

## Sprint W46-W47: Regulatorio y legal

**Estado:** 📋 PLANNED

**Objetivo:** Garantizar que Beta cumple requisitos básicos de seguridad y legalidad.

**Owner:** Hilo "Regulatory-to-Code"

**DoD:**
- [ ] Reporte de cumplimiento automático en CI
- [ ] Consentimientos implementados y auditables
- [ ] Trazabilidad completa de sugerencias aplicadas

---

## Sprint W48: Branding & Visual Identity

**Estado:** �� PLANNED

**Objetivo:** Profesionalizar la UI antes de presentar a pilotos e inversores.

**Owner:** Hilo "Shared Resources"  
**Budget:** $200-500

**DoD:**
- [ ] Sistema de diseño aplicado
- [ ] Logo profesional integrado
- [ ] Screenshots para demo listos

---

## Sprint W49-W50: Beta Release

**Estado:** 📋 PLANNED

**Objetivo:** Entregar la Beta a pilotos en Niagara.

**DoD:**
- [ ] Aidux Beta desplegado en entorno real
- [ ] Usable en piloto con fisioterapeutas Niagara
- [ ] Demo para inversores preparado

---

## Resumen ejecutivo

| Sprint | Semanas | Estado | Objetivo |
|--------|---------|--------|----------|
| W40-W41 | Sprint 0-1 | ✅ DONE | Fundaciones + SOAP |
| W42-W43 | Sprint 2 | 📋 PLANNED | Personalización |
| W44-W45 | Sprint 3 | 📋 PLANNED | Audio clínico |
| W46-W47 | Sprint 4 | 📋 PLANNED | Regulatorio |
| W48 | Sprint 5 | 📋 PLANNED | Branding |
| W49-W50 | Sprint 6 | 📋 PLANNED | Beta Release |

---

## Metodología de trabajo

**Coordinación:** 5 hilos de ChatGPT especializados

1. Regulatory-to-Code (CPO compliance)
2. Data & Validation (Personalización + métricas)
3. Programación técnica (SOAP + Audio)
4. Shared Resources (Docs + Branding)
5. Sprint Coordination (Centro de mando)

**CTO:** Mauricio Sobarzo  
**Arquitectura:** Claude (Anthropic)  
**Implementación:** ChatGPT (OpenAI)

---

**Última actualización:** 2 octubre 2025
