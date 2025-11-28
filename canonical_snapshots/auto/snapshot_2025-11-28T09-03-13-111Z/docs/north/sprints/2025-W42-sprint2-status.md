---
Market: CA
Language: en-CA
Document: Sprint Status
Title: Sprint 2 (W42) - Status Update
Date: 2025-10-03
---

# Sprint 2 — Status Update

**Fecha:** 3 Oct 2025  
**CTO:** Mauricio Sobarzo  
**Owner principal:** Programación Técnica + Data & Validation  
**Estado:** En ejecución (día 1 de 11)

---

## Resumen Ejecutivo

- Backend confirmado: **Firestore** (Supabase vestigial).
- Sprint 2 aprobado como **GO REDUCED**:
  - Quick Recall (<1s)  
  - Progress Notes (diff básico, sin LLM)  
  - notesRepo CRUD + inmutabilidad legal  
  - Feature flag `AIDUX_PROGRESS_NOTES=false`
- PR #133 (*Scrub SOAP wording + guardrail*) mergeado fuera de plan:
  - 70 archivos tocados, CI bloqueante activo.  
  - Protege compliance (CPO, PIPEDA).  
  - Consumió ventana de desarrollo prevista para Task 2.

---

## Estado de Tareas

### Task 1 — Persistence Layer (Oct 3–8)
- Firestore index creado y documentado → ✅  
- notesRepo CRUD (create/update/getLast/getLastN) → 🚧 in progress  
- Error codes + inmutabilidad (`ERR_NOTE_IMMUTABLE`) → planificado

### Task 2 — UI Integration (Oct 9–11)
- SaveNoteButton → ⏸ not started  
- SOAPNotePreview integration → ⏸ not started  
- QuickRecallPanel → ⏸ not started

### Task 3 — Diff View (Oct 14–15)
- No iniciado (dependiente de Task 2)

---

## Impacto del PR #133

- **Positivo:**  
  - Logs y comentarios limpios de SOAP.  
  - Guardrail CI (`check-no-soap-logs.sh`) previene regresiones.  
  - Branch protection reforzada (tests + 1 review + admins).  

- **Negativo:**  
  - Consumo de buffer (2 días).  
  - Riesgo de retrasar Task 2 (UI integration).  

---

## Riesgo actual

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Retraso Task 2 | Alta | Medio | Ajustar scope (QuickRecall → Sprint 3) o aceptar cierre 20–21 Oct |
| Inmutabilidad mal implementada | Media | Alto | Unit tests + reglas Firestore |
| Logs con PII | Baja | Crítico | Guardrail CI + auditoría manual |
| Diff insuficiente para clínicos | Media | Medio | MVP string-diff, iterar con feedback |

---

## Opciones del CTO

1. **Scope completo (QuickRecall + Diff)**  
   - Timeline extendido → cierre Sprint 2 ~20–21 Oct.  
   - Beta diciembre aún viable.

2. **Scope reducido (QuickRecall → Sprint 3)**  
   - Timeline protegido → cierre Sprint 2 ~18 Oct.  
   - Menor demo value en corto plazo.

---

## DoD Sprint 2 (sin cambios)

- Quick Recall retorna última nota firmada en <1s (dev p99).  
- Progress Notes diff view sin crash (S/O/A/P).  
- notesRepo CRUD + unit tests.  
- Firestore index creado y verificado.  
- Inmutabilidad de notas firmadas (ERR_NOTE_IMMUTABLE).  
- Logs solo con IDs/timestamps (no texto clínico).  
- Flag `AIDUX_PROGRESS_NOTES=false`.  
- Staging probado con 2 pacientes demo.  

---

**Próxima actualización:** 9 Oct 2025 (mitad de sprint)

