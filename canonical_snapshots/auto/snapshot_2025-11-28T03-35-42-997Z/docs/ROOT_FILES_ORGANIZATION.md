# Organización de Archivos .md en Raíz del Proyecto

**Fecha:** Noviembre 2025  
**Objetivo:** Mover todos los archivos .md de la raíz a `docs/` organizados

---

## 📋 Categorización de Archivos en Raíz

### **Changelogs / Historial**
- `CHANGELOG.md` → `docs/`
- `CHANGELOG_REVERSION.md` → `docs/_archive/`

### **Informes CTO / Ejecutivos**
- `RESUMEN_EJECUTIVO_CTO.md` → `docs/cto-briefings/`
- `INFORME_CTO_*.md` → `docs/cto-briefings/`
- `RESUMEN_FINAL_*.md` → `docs/cto-briefings/`

### **Implementaciones Completadas**
- `IMPLEMENTACION_*.md` → `docs/implementation/`
- `FASE_*_COMPLETADA.md` → `docs/implementation/`
- `VALIDACION_*.md` → `docs/implementation/`

### **Análisis / Estrategia**
- `ANALISIS_*.md` → `docs/strategy/`
- `COMPARACION_*.md` → `docs/strategy/`
- `PROMPT_OPTIMIZATION_ANALYSIS.md` → `docs/architecture/`

### **Deuda Técnica**
- `DEUDA_TECNICA_ACUMULADA.md` → `docs/enterprise/TECHNICAL_DEBT.md` (consolidar)
- `TECH_DEBT.md` → `docs/enterprise/TECHNICAL_DEBT.md` (consolidar)
- `ROADMAP_DEUDA_TECNICA_ACTUALIZADO.md` → `docs/enterprise/`

### **Sprints / Roadmaps**
- `SPRINT_*.md` → `docs/strategy/`
- `ROADMAP_*.md` → `docs/strategy/`

### **Correcciones / Soluciones**
- `CORRECCIONES_*.md` → `docs/implementation/`
- `SOLUCION_*.md` → `docs/troubleshooting/`

### **Guías / Runbooks**
- `GUIA_*.md` → `docs/user-guides/`
- `RUNBOOK_*.md` → `docs/deployment/`

### **Testing / Validación**
- `USER_TESTING_LOG.md` → `docs/testing/`
- `TEST_GUARDIAN.md` → `docs/testing/`
- `validation-results.md` → `docs/testing/`

### **Estado / Status**
- `status.md` → `docs/` (mantener en raíz o mover a docs/)
- `DEMO_STATUS.md` → `docs/implementation/`

### **Documentación Técnica**
- `ENTREGA-*.md` → `docs/_archive/`
- `MEDICAL_INTEGRATION_REPORT.md` → `docs/architecture/`
- `CONOCIMIENTO_BASE_*.md` → `docs/architecture/`

### **Obsoletos / Archivar**
- `CLEANUP_*.md` → `docs/_archive/`
- `LIMPIEZA_*.md` → `docs/_archive/`
- `REVERSION_*.md` → `docs/_archive/`
- `TODO_*.md` → `docs/_archive/` (si completados)

---

## 🎯 Plan de Acción

1. **Crear subcarpetas adicionales si necesario**
2. **Mover archivos según categorización**
3. **Consolidar documentos redundantes**
4. **Actualizar referencias en código si existen**

---

## ✅ Estado Final (Día 4 Ready)

- Archivos que permanecen en raíz: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS`
- Todo el resto de `.md` fue movido a `docs/` o `docs/_archive/`
- `status.md` ahora vive en `docs/status/status.md`
- `AiDuxVerdad.md` y `CODESPACES_README.md` viven en `docs/`
- `docs/` contiene el índice maestro (`docs/README.md`) y `docs/ROOT_FILES_MOVED.md` como bitácora

**Siguiente paso:** mantener esta guía actualizada si aparecen nuevos `.md` en la raíz.

