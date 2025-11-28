# PLAN DE MIGRACIÓN URGENTE - W1-001

## 🚨 MIGRACIÓN REQUERIDA: Firestore de US a Canadá

## Información General
- **Fecha de Creación**: 2025-11-27
- **Razón**: Violación crítica de soberanía de datos
- **Región Actual**: `us-east1` (Estados Unidos)
- **Región Objetivo**: `northamerica-northeast1` (Montreal, Canadá)
- **ISO Control**: A.7.4, A.8.23

## Resumen Ejecutivo

**Situación Actual**:
- Firestore está en `us-east1` (Estados Unidos) 🚨
- Violación crítica de PHIPA/PIPEDA/ISO 27001
- Migración urgente requerida

**Objetivo**:
- Migrar Firestore a `northamerica-northeast1` (Canadá)
- Garantizar 100% datos en Canadá
- Cumplir con requisitos de compliance

## Opciones de Migración

### Opción 1: Crear Nueva Base de Datos en Canadá ✅ RECOMENDADA

**Descripción**:
1. Crear nueva base de datos Firestore en región canadiense
2. Exportar datos de base de datos actual (US)
3. Importar datos a nueva base de datos (Canadá)
4. Actualizar configuración de aplicación
5. Eliminar base de datos antigua (después de verificación)

**Ventajas**:
- ✅ Proceso estándar de Firebase
- ✅ Permite verificación antes de eliminar datos originales
- ✅ Rollback fácil si hay problemas

**Desventajas**:
- ⚠️ Requiere downtime durante migración
- ⚠️ Requiere actualizar configuración de aplicación

**Timeline**: 4-6 horas (incluyendo verificación)

### Opción 2: Migración In-Place ❌ NO DISPONIBLE

**Razón de rechazo**:
- Firebase no permite cambiar región de base de datos existente
- Solo opción es crear nueva base de datos

## Plan de Migración Detallado (Opción 1)

### Fase 1: Preparación (2 horas)

**Checklist**:
- [ ] **T1.1**: Crear backup completo de datos actuales
  ```bash
  gcloud firestore export gs://[BUCKET_NAME]/backup-$(date +%Y%m%d) \
    --project=aiduxcare-v2-uat-dev \
    --database="(default)"
  ```
- [ ] **T1.2**: Verificar integridad de backup
- [ ] **T1.3**: Documentar tamaño de datos y collections
- [ ] **T1.4**: Notificar a usuarios de ventana de mantenimiento
- [ ] **T1.5**: Obtener aprobación CTO para migración

**Evidencia Requerida**:
- Logs de backup
- Verificación de integridad
- Aprobación CTO

---

### Fase 2: Crear Nueva Base de Datos (30 minutos)

**Checklist**:
- [ ] **T2.1**: Crear nueva base de datos en región canadiense
  ```bash
  gcloud firestore databases create \
    --project=aiduxcare-v2-uat-dev \
    --location=northamerica-northeast1 \
    --database=migrated-canada
  ```
- [ ] **T2.2**: Verificar creación exitosa
- [ ] **T2.3**: Documentar nueva base de datos

**Evidencia Requerida**:
- Output de creación
- Verificación de región

---

### Fase 3: Exportar Datos (1-2 horas dependiendo de tamaño)

**Checklist**:
- [ ] **T3.1**: Exportar datos de base de datos actual (US)
  ```bash
  gcloud firestore export gs://[BUCKET_NAME]/migration-export-$(date +%Y%m%d) \
    --project=aiduxcare-v2-uat-dev \
    --database="(default)"
  ```
- [ ] **T3.2**: Monitorear progreso de exportación
- [ ] **T3.3**: Verificar exportación completada
- [ ] **T3.4**: Verificar integridad de exportación

**Evidencia Requerida**:
- Logs de exportación
- Verificación de integridad
- Tiempo de exportación

---

### Fase 4: Importar Datos (1-2 horas dependiendo de tamaño)

**Checklist**:
- [ ] **T4.1**: Importar datos a nueva base de datos (Canadá)
  ```bash
  gcloud firestore import gs://[BUCKET_NAME]/migration-export-$(date +%Y%m%d) \
    --project=aiduxcare-v2-uat-dev \
    --database=migrated-canada
  ```
- [ ] **T4.2**: Monitorear progreso de importación
- [ ] **T4.3**: Verificar importación completada
- [ ] **T4.4**: Verificar integridad de datos importados

**Evidencia Requerida**:
- Logs de importación
- Verificación de integridad
- Comparación de conteos de documentos

---

### Fase 5: Actualizar Configuración (30 minutos)

**Checklist**:
- [ ] **T5.1**: Actualizar código para usar nueva base de datos
  - Modificar `src/lib/firebase.ts` si necesario
  - Verificar que no hay hardcoded database name
- [ ] **T5.2**: Actualizar variables de entorno si aplica
- [ ] **T5.3**: Probar conexión a nueva base de datos
- [ ] **T5.4**: Deploy a staging primero

**Evidencia Requerida**:
- Código actualizado
- Pruebas de conexión exitosas
- Deploy a staging exitoso

---

### Fase 6: Verificación y Cutover (1 hora)

**Checklist**:
- [ ] **T6.1**: Verificar funcionalidad completa en staging
- [ ] **T6.2**: Comparar datos entre bases de datos (muestra)
- [ ] **T6.3**: Deploy a producción
- [ ] **T6.4**: Verificar funcionamiento en producción
- [ ] **T6.5**: Monitoreo extendido (24-48h)

**Evidencia Requerida**:
- Pruebas de funcionalidad
- Comparación de datos
- Logs de producción
- Métricas de monitoreo

---

### Fase 7: Limpieza (Después de 30 días)

**Checklist**:
- [ ] **T7.1**: Verificar que nueva base de datos funciona correctamente (30 días)
- [ ] **T7.2**: Eliminar base de datos antigua (US)
  ```bash
  gcloud firestore databases delete \
    --project=aiduxcare-v2-uat-dev \
    --database="(default)"
  ```
- [ ] **T7.3**: Renombrar nueva base de datos a "(default)" si necesario
- [ ] **T7.4**: Documentar eliminación

**Evidencia Requerida**:
- Verificación de 30 días
- Logs de eliminación
- Documentación completa

---

## Riesgos y Mitigación

### Riesgo 1: Pérdida de Datos Durante Migración
- **Mitigación**: Backup completo antes + Verificación post-migración
- **Contingencia**: Restaurar desde backup

### Riesgo 2: Downtime Extendido
- **Mitigación**: Migración en ventana de mantenimiento + Comunicación previa
- **Contingencia**: Rollback a base de datos original

### Riesgo 3: Inconsistencias de Datos
- **Mitigación**: Verificación exhaustiva post-migración
- **Contingencia**: Re-importar datos si necesario

## Timeline Estimado

- **Preparación**: 2 horas
- **Creación nueva DB**: 30 minutos
- **Exportación**: 1-2 horas
- **Importación**: 1-2 horas
- **Actualización código**: 30 minutos
- **Verificación**: 1 hora
- **Total**: 6-8 horas

**Ventana de Mantenimiento Recomendada**: Fin de semana (sábado o domingo)

## Aprobaciones Requeridas

- [ ] **CTO Approval**: ⏳ Pendiente
- [ ] **Backup Verification**: ⏳ Pendiente
- [ ] **Rollback Plan**: ⏳ Pendiente

## Evidencia de Migración

Todos los logs y evidencia serán guardados en:
- `docs/audit-trail/W1-001/04-deployment/migration-logs/`

---

**Estado**: ⏳ Pendiente aprobación CTO  
**Última actualización**: 2025-11-27  
**Prioridad**: P0 - EXISTENCIAL


