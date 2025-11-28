# REQUISITOS - W1-001: Verificación y Migración de Región Firestore

## Información General
- **Fecha**: 2025-11-27
- **Responsable**: DevOps Lead
- **Entregable**: W1-001 - Verificación y Migración de Región Firestore
- **ISO Control**: A.7.4 (Physical Security Monitoring), A.8.23 (Information Security for Use of Cloud Services)
- **Prioridad**: P0 - EXISTENTIAL

## Requisitos Funcionales

### Requisito 1: Verificar Región Actual de Firestore
- **Descripción**: Verificar en qué región geográfica está configurado Firestore actualmente
- **Justificación**: Violación crítica de soberanía de datos si Firestore está en US (us-central1)
- **Criterio de aceptación**: 
  - Script ejecutado exitosamente
  - Región verificada en Firebase Console
  - Región documentada en `docs/FIRESTORE_REGION_STATUS.md`

### Requisito 2: Migrar Firestore a Canadá (SI ES NECESARIO)
- **Descripción**: Si Firestore está en US, migrar a región canadiense (northamerica-northeast1)
- **Justificación**: Requisito legal de soberanía de datos canadienses (PHIPA/PIPEDA)
- **Criterio de aceptación**:
  - Firestore configurado en `northamerica-northeast1`
  - Todos los datos migrados sin pérdida
  - Aplicación funcionando correctamente después de migración

## Requisitos No Funcionales

### Performance
- **Requisito**: Migración no debe causar downtime > 1 hora
- **Métrica**: Tiempo de migración medido y documentado

### Security
- **Requisito**: Datos encriptados durante migración
- **Métrica**: Verificación de encriptación en tránsito

### Compliance
- **Requisito**: 100% datos en región canadiense
- **Métrica**: Verificación en Firebase Console + certificado de proveedor

## Dependencias

- [x] Script de verificación creado (`scripts/verify-firestore-region.sh`)
- [ ] Acceso a Firebase Console
- [ ] Acceso a Firebase CLI
- [ ] Backup completo de datos (si migración necesaria)

## Riesgos Identificados

### Riesgo 1: Firestore en US (us-central1)
- **Probabilidad**: Media (Firebase puede usar US por defecto)
- **Impacto**: EXISTENCIAL - Violación de soberanía de datos
- **Mitigación**: Migración urgente a región canadiense

### Riesgo 2: Pérdida de datos durante migración
- **Probabilidad**: Baja (con backup adecuado)
- **Impacto**: ALTO - Pérdida de datos de pacientes
- **Mitigación**: Backup completo antes de migración + verificación post-migración

### Riesgo 3: Downtime durante migración
- **Probabilidad**: Media
- **Impacto**: MEDIO - Servicio no disponible temporalmente
- **Mitigación**: Migración en ventana de mantenimiento + rollback plan

## Compliance Verification

- [ ] **PHIPA**: ⏳ Pendiente verificación
- [ ] **PIPEDA**: ⏳ Pendiente verificación
- [ ] **ISO 27001**: ⏳ Pendiente verificación
- [ ] **Data Sovereignty**: ⏳ Pendiente verificación

## Aprobaciones

- [x] **Responsable**: ✅ 2025-11-27 DevOps Lead
- [ ] **CTO**: ⏳ Pendiente

---

**Estado**: ⏳ En revisión  
**Última actualización**: 2025-11-27


