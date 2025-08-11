# FHIR Module - AiDuxCare

## 📋 **Estado del Módulo**

- **Versión**: v1.1.0
- **Estado**: ✅ PRODUCCIÓN - 100% tests passing (55/55)
- **Última actualización**: Agosto 2025

## 🏥 **Perfiles Implementados**

### Recursos FHIR R4
- ✅ **Patient** - Perfil completo con validación CA Core / US Core
- ✅ **Encounter** - Perfil completo con mapeo de tipos clínicos
- ✅ **Observation** - Perfil básico para datos clínicos

### Guías de Implementación
- ✅ **CA Core** - Canadá (Patient, Encounter, Observation)
- ✅ **US Core** - Estados Unidos (Patient, Encounter, Observation)

## 🔍 **Tipos de Validaciones Activas**

### Validación de Estructura
- Campos obligatorios según perfil
- Tipos de datos correctos
- Referencias válidas (Patient/{id} o urn:uuid:)

### Validación de Contenido
- Códigos de clase de encuentro (EMER|IMP|AMB|VR|HH)
- Formatos de país según perfil (CA para CA Core, US para US Core)
- Identificadores únicos y válidos

### Validación de Referencias
- Referencias internas resueltas
- UUIDs deterministas para consistencia
- Validación de integridad referencial

## 🧪 **Estado del Test Suite**

### Cobertura Total: 100%
- **Contract Tests**: 20/20 ✅
- **Profile Tests**: 21/21 ✅  
- **Integration Tests**: 14/14 ✅

### Tipos de Tests
- **Contract Tests**: Verificación de API pública
- **Profile Tests**: Validación CA Core / US Core
- **Integration Tests**: Round-trip completo (interno → FHIR → interno)
- **Snapshot Tests**: Consistencia de mapeo Patient/Encounter

## 🚀 **Uso del Módulo**

### Comandos Principales
```bash
# Suite completa FHIR
npm run fhir:all

# Tests específicos
npm run fhir:contracts    # Contract tests
npm run fhir:profiles     # Profile validation tests  
npm run run fhir:adapters # Integration tests
```

### API Pública
```typescript
import { toFhir, fromFhir, validate, makeBundle } from './core/fhir';

// Conversión interna → FHIR
const fhirPatient = toFhir(internalPatient, { profile: 'US_CORE' });

// Validación de recursos
const result = validate(fhirPatient, 'US_CORE');

// Creación de bundles
const bundle = makeBundle([fhirPatient, fhirEncounter], 'US_CORE');
```

## 🔒 **Quality Gates**

### CI/CD Integration
- **Workflow**: `.github/workflows/ci-fhir.yml`
- **Trigger**: Pull requests y pushes a `main`
- **Requisito**: `npm run fhir:all` debe pasar 100%
- **Bloqueo**: No se permite merge si fallan tests FHIR

### Validaciones Automáticas
- ✅ Linting (ESLint)
- ✅ TypeScript compilation
- ✅ FHIR test suite completo
- ✅ Reportes JUnit para auditoría

## 📚 **Documentación Adicional**

- **Changelog**: `CHANGELOG.md`
- **Versioning**: `docs/fhir-versioning.md`
- **Integration**: `docs/fhir-integration.md`

## 🆘 **Soporte**

Para problemas o preguntas sobre el módulo FHIR:
1. Verificar que `npm run fhir:all` pase localmente
2. Revisar logs de CI en GitHub Actions
3. Consultar documentación de versioning
4. Contactar al equipo de desarrollo
