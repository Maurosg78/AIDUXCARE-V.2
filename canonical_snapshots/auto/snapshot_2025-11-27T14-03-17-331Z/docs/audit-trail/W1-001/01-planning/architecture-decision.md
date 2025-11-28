# DECISIÓN DE ARQUITECTURA - W1-001

## Información General
- **Fecha**: 2025-11-27
- **Entregable**: W1-001 - Verificación y Migración de Región Firestore
- **ISO Control**: A.7.4, A.8.23

## Decisión Arquitectónica

### Opción 1: Verificar y Migrar (SI ES NECESARIO) ✅ SELECCIONADA

**Descripción**:
1. Ejecutar script de verificación para determinar región actual
2. Si región es US → Planificar migración a Canadá
3. Si región es Canadá → Documentar y completar

**Ventajas**:
- ✅ Resuelve violación de soberanía de datos
- ✅ Cumple con PHIPA/PIPEDA
- ✅ Cumple con ISO 27001 A.7.4, A.8.23

**Desventajas**:
- ⚠️ Puede requerir downtime si migración necesaria
- ⚠️ Riesgo de pérdida de datos si no se hace correctamente

**Justificación**:
- Requisito legal no negociable
- Violación existencial si datos en US
- Migración es única vez, beneficio permanente

### Opción 2: Asumir que está en Canadá ❌ RECHAZADA

**Razón de rechazo**:
- No verificable
- No cumple con auditoría ISO 27001
- Riesgo de violación legal

## Arquitectura Técnica

### Fase 1: Verificación
- Script: `scripts/verify-firestore-region.sh`
- Firebase Console: Verificación manual
- Documentación: `docs/FIRESTORE_REGION_STATUS.md`

### Fase 2: Migración (SI NECESARIA)
- Backup: Export completo de datos
- Migración: Import a región canadiense
- Verificación: Confirmar datos migrados
- Rollback: Plan de rollback documentado

## Configuración Objetivo

```
Firestore Region: northamerica-northeast1 (Montreal, Canadá)
Firebase Functions: northamerica-northeast1 ✅ (Ya configurado)
Firebase Hosting: Edge locations (OK para estático)
```

## Impacto en Sistema

- **Datos**: Migración de ubicación física
- **APIs**: Sin cambios (mismo endpoint)
- **Clientes**: Sin cambios (mismo SDK)
- **Performance**: Posible latencia ligeramente mayor (aceptable)

## Aprobaciones

- [x] **Responsable**: ✅ 2025-11-27 DevOps Lead
- [ ] **CTO**: ⏳ Pendiente

---

**Estado**: ⏳ Pendiente aprobación CTO  
**Última actualización**: 2025-11-27

