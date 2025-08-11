# Changelog

All notable changes to the FHIR module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-11

### Added
- **Snapshot Tests**: Implementados tests de snapshot para Patient y Encounter
- **Quality Gates**: Workflow CI que bloquea merge si `npm run fhir:all` falla
- **Fixtures Internos**: Mocks deterministas para testing consistente
- **Reportes JUnit**: Exportación automática de resultados para auditoría

### Enhanced
- **Contract Tests**: Verificación completa de API pública (20/20 tests)
- **Integration Tests**: Round-trip completo validado (14/14 tests)
- **Profile Validation**: Validación CA Core / US Core (21/21 tests)
- **UUID Deterministas**: Referencias consistentes para testing

### Fixed
- **Reference Validation**: Acepta tanto `Patient/{id}` como `urn:uuid:` formatos
- **Encounter Class Codes**: Validación estricta de códigos EMER|IMP|AMB|VR|HH
- **Country Validation**: Formato específico por perfil (CA para CA Core, US para US Core)
- **Bundle Validation**: Fallo automático si cualquier recurso falla validación

### Technical
- **CI/CD Integration**: Workflow `.github/workflows/ci-fhir.yml`
- **Artifact Upload**: Reportes de test automáticos en GitHub Actions
- **Cache Optimization**: npm cache habilitado en CI
- **Error Handling**: Manejo robusto de fallos de validación

## [1.0.0] - 2025-08-10

### Added
- **Core FHIR Types**: Patient, Encounter, Observation (FHIR R4)
- **Profile Validation**: CA Core and US Core implementation guides
- **Data Adapters**: Bidirectional conversion internal ↔ FHIR
- **Bundle Operations**: Create and validate FHIR bundles
- **Type Safety**: Strict TypeScript with no `any` types

### Supported Resources
- **Patient**: Demographics, identifiers, contact information
- **Encounter**: Clinical visits with type mapping
- **Observation**: Clinical measurements and findings

### Supported Profiles
- **CA Core**: Canadian FHIR Implementation Guide
- **US Core**: US FHIR Implementation Guide

### Key Features
- Lightweight implementation (no heavy external dependencies)
- Profile-compliant validation
- Round-trip data conversion
- Comprehensive test coverage
- Decoupled from existing EMR flow

---

**Note**: This module follows independent semantic versioning (`fhir-vMAJOR.MINOR.PATCH`) 
separate from the main AiDuxCare version.
