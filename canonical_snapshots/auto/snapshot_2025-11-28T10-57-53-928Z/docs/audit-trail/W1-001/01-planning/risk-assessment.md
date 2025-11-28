# EVALUACIÓN DE RIESGOS - W1-001

## Información General
- **Fecha**: 2025-11-27
- **Entregable**: W1-001 - Verificación y Migración de Región Firestore
- **ISO Control**: A.8.24-A.8.28 (Information Security Incident Management)

## Matriz de Riesgos

### Riesgo 1: Firestore en Región US (us-central1)
- **Categoría**: Compliance / Legal
- **Probabilidad**: MEDIA (Firebase puede usar US por defecto)
- **Impacto**: EXISTENCIAL
- **Nivel de Riesgo**: 🔴 CRÍTICO
- **ISO Control**: A.7.4, A.8.23

**Descripción**:
Firestore puede estar configurado en región US por defecto, violando requisitos de soberanía de datos canadienses.

**Mitigación**:
1. Verificar región inmediatamente
2. Si está en US → Migración urgente (fin de semana)
3. Documentar verificación para auditoría

**Contingencia**:
- Plan de migración documentado
- Backup completo antes de migración
- Rollback plan disponible

---

### Riesgo 2: Pérdida de Datos Durante Migración
- **Categoría**: Operacional / Data Loss
- **Probabilidad**: BAJA (con backup adecuado)
- **Impacto**: ALTO
- **Nivel de Riesgo**: 🟠 ALTO
- **ISO Control**: A.8.10 (Information Deletion)

**Descripción**:
Durante migración, existe riesgo de pérdida de datos si el proceso no se ejecuta correctamente.

**Mitigación**:
1. Backup completo antes de migración
2. Verificación de integridad post-migración
3. Pruebas en ambiente de staging primero
4. Rollback plan documentado

**Contingencia**:
- Restaurar desde backup
- Verificar integridad de datos
- Reportar incidente según protocolo

---

### Riesgo 3: Downtime Durante Migración
- **Categoría**: Disponibilidad
- **Probabilidad**: MEDIA
- **Impacto**: MEDIO
- **Nivel de Riesgo**: 🟡 MEDIO
- **ISO Control**: A.12.1 (Documented Operating Procedures)

**Descripción**:
Migración puede causar downtime temporal del servicio.

**Mitigación**:
1. Migración en ventana de mantenimiento
2. Comunicación previa a usuarios
3. Migración rápida (< 1 hora objetivo)
4. Rollback plan para minimizar downtime

**Contingencia**:
- Rollback inmediato si problemas
- Comunicación de downtime a usuarios
- Monitoreo durante migración

---

### Riesgo 4: Configuración Incorrecta Post-Migración
- **Categoría**: Configuración
- **Probabilidad**: BAJA
- **Impacto**: MEDIO
- **Nivel de Riesgo**: 🟡 MEDIO
- **ISO Control**: A.8.9 (Configuration Management)

**Descripción**:
Después de migración, configuración puede no estar correcta, causando problemas de funcionamiento.

**Mitigación**:
1. Verificación exhaustiva post-migración
2. Pruebas de funcionalidad completa
3. Monitoreo activo después de migración
4. Documentación de configuración

**Contingencia**:
- Rollback si problemas detectados
- Corrección de configuración
- Verificación adicional

---

## Plan de Mitigación Global

1. **Pre-Migración**:
   - Backup completo
   - Verificación de región actual
   - Plan de migración documentado
   - Rollback plan documentado

2. **Durante Migración**:
   - Monitoreo activo
   - Verificación paso a paso
   - Comunicación de estado

3. **Post-Migración**:
   - Verificación de integridad
   - Pruebas de funcionalidad
   - Monitoreo extendido (24-48h)
   - Documentación completa

## Aprobaciones

- [x] **Responsable**: ✅ 2025-11-27 DevOps Lead
- [ ] **CTO**: ⏳ Pendiente

---

**Estado**: ⏳ Pendiente aprobación CTO  
**Última actualización**: 2025-11-27


