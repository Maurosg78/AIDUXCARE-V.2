# FHIR Module Versioning Guide

## Overview

The FHIR module follows independent semantic versioning (`fhir-vMAJOR.MINOR.PATCH`) separate from the main AiDuxCare application version. This allows the FHIR module to evolve independently while maintaining API stability.

## Versioning Rules

### MAJOR Version (Breaking Changes)
- Changes to public API function signatures
- Removal of supported resources or profiles
- Changes to validation behavior or error response format
- Breaking changes to internal data structures

### MINOR Version (New Features)
- Addition of new FHIR resources
- New profile support (e.g., EU Core, AU Core)
- Enhanced validation capabilities
- New utility functions
- Performance improvements

### PATCH Version (Bug Fixes)
- Bug fixes in existing functionality
- Documentation updates
- Test improvements
- Minor performance optimizations

## Quality Gates Policy

### 🚨 **CRÍTICO: Ningún PR puede mergear si `npm run fhir:all` falla**

El módulo FHIR implementa quality gates estrictos que bloquean cualquier integración si los tests no pasan al 100%.

### Workflow CI Automático

**Archivo**: `.github/workflows/ci-fhir.yml`

**Triggers**:
- Pull requests a `main`
- Push directo a `main`

**Validaciones Obligatorias**:
1. ✅ **Linting**: `npm run lint` (0 errores)
2. ✅ **TypeScript**: `npx tsc --noEmit` (0 errores)
3. ✅ **FHIR Suite**: `npm run fhir:all` (55/55 tests passing)
4. ✅ **Reportes**: Exportación JUnit para auditoría

**Bloqueo Automático**:
- Si cualquier paso falla, el workflow falla
- GitHub bloquea el merge automáticamente
- Se requiere corrección antes de continuar

### Scripts de Validación

```bash
# Suite completa (obligatorio para merge)
npm run fhir:all

# Tests específicos
npm run fhir:contracts    # API pública
npm run fhir:profiles     # Validación perfiles
npm run fhir:adapters     # Tests integración
```

### Snapshot Tests

**Archivos**:
- `src/core/fhir/__tests__/snapshots/patient.snapshot.test.ts`
- `src/core/fhir/__tests__/snapshots/encounter.snapshot.test.ts`

**Propósito**:
- Verificar consistencia de mapeo interno → FHIR
- Detectar cambios no intencionales en adapters
- Mantener integridad de referencias

**Actualización**:
```bash
# Regenerar snapshots si cambio es intencional
npx vitest -u --run src/core/fhir/__tests__/snapshots
```

## Release Process

### Pre-Release Checklist
- [ ] `npm run lint` pasa sin errores
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] `npm run fhir:all` pasa 100% (55/55 tests)
- [ ] Snapshot tests actualizados si necesario
- [ ] CHANGELOG.md actualizado
- [ ] README.md actualizado

### Release Steps
1. **Verificar Quality Gates**: Ejecutar suite completa localmente
2. **Merge a Main**: Solo si todos los tests pasan
3. **Tag Release**: `git tag fhir-vX.Y.Z`
4. **Push Tags**: `git push origin --tags`
5. **CI Verification**: Confirmar que workflow CI pasa en main

### Post-Release
- Monitorear CI/CD pipeline
- Verificar reportes JUnit
- Actualizar documentación si es necesario
- Planificar siguiente versión

## Current Status

### Version: v1.1.0
- **Status**: ✅ PRODUCCIÓN - Quality Gates Implementados
- **Tests**: 55/55 passing (100%)
- **Profiles**: CA Core + US Core
- **Resources**: Patient, Encounter, Observation

### Quality Gates Status
- ✅ **CI Workflow**: Implementado y activo
- ✅ **Snapshot Tests**: Patient y Encounter
- ✅ **Contract Tests**: API pública verificada
- ✅ **Integration Tests**: Round-trip validado
- ✅ **Profile Tests**: CA Core + US Core

## Compliance Requirements

### HIPAA/GDPR
- Validación estricta de perfiles
- UUIDs deterministas para auditoría
- Reportes JUnit para evidencia regulatoria
- Quality gates que previenen regresiones

### Medical Standards
- FHIR R4 compliance
- CA Core implementation guide
- US Core implementation guide
- Type safety sin `any` types

---

**Last Updated**: Agosto 2025  
**Next Version**: v1.2.0 (planned)  
**Quality Gate Status**: ✅ ACTIVE
