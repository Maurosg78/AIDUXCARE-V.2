# FHIR Module Versioning Guide

## Overview

The FHIR module in AiDuxCare V.2 follows **independent semantic versioning** from the main application. This allows the module to evolve at its own pace while maintaining backward compatibility for external consumers.

## Version Format

The FHIR module uses the format: `fhir-vMAJOR.MINOR.PATCH`

**Examples:**
- `fhir-v1.0.0` - Initial stable release
- `fhir-v1.1.0` - New features added
- `fhir-v1.1.1` - Bug fixes and improvements
- `fhir-v2.0.0` - Breaking changes

## Semantic Versioning Rules

### MAJOR Version (Breaking Changes)
**Increment when:**
- Public API function signatures change
- Supported FHIR resources are removed
- Profile support is dropped
- Validation behavior changes fundamentally
- Error response format changes

**Examples:**
- `toFhir(patient, options)` → `toFhir(patient, profile, strictMode)`
- Removing support for CA Core profile
- Changing validation result structure

### MINOR Version (New Features)
**Increment when:**
- New FHIR resources are added
- New regional profiles are supported
- New validation rules are implemented
- Additional utility functions are added
- Performance improvements are significant

**Examples:**
- Adding MedicationRequest resource support
- Adding EU Core profile support
- Adding new validation options
- Adding bundle search utilities

### PATCH Version (Bug Fixes)
**Increment when:**
- Bug fixes in existing functionality
- Performance optimizations
- Documentation updates
- Minor validation rule adjustments
- Test coverage improvements

**Examples:**
- Fixing validation edge cases
- Optimizing conversion algorithms
- Updating error messages
- Adding missing test cases

## Versioning Workflow

### 1. Development Phase
```bash
# Work on feature branch
git checkout -b feature/fhir-new-resource

# Make changes to FHIR module
# Update tests
# Update documentation
```

### 2. Version Decision
```bash
# Determine version bump based on changes
# Update CHANGELOG.md with new version
# Update package.json if applicable
```

### 3. Release Process
```bash
# Create release commit
git add .
git commit -m "fhir-v1.1.0: Add MedicationRequest resource support"

# Tag the release
git tag fhir-v1.1.0

# Push changes
git push origin feature/fhir-new-resource
git push origin fhir-v1.1.0
```

### 4. Integration
```bash
# Merge to main branch
git checkout main
git merge feature/fhir-new-resource

# Update main application to use new version
# Test integration thoroughly
```

## Version Compatibility Matrix

| FHIR Module Version | AiDuxCare Version | Breaking Changes | Notes |
|---------------------|-------------------|------------------|-------|
| fhir-v1.0.0        | v0.1.0+          | None             | Initial stable release |
| fhir-v1.1.0        | v0.1.0+          | None             | New resources added |
| fhir-v2.0.0        | v0.2.0+          | Yes              | API refactored |

## Breaking Change Policy

### Before Making Breaking Changes
1. **Deprecation Notice**: Announce in CHANGELOG.md at least 2 versions ahead
2. **Migration Guide**: Provide clear upgrade path for consumers
3. **Backward Compatibility**: Maintain old API for one major version
4. **Testing**: Ensure all existing integrations continue to work

### Deprecation Example
```typescript
// fhir-v1.2.0: Deprecation notice
/**
 * @deprecated Use validate(resource, profile, options) instead
 * Will be removed in fhir-v3.0.0
 */
export function validateLegacy(resource: unknown, profile: string) {
  // Implementation with deprecation warning
  console.warn('validateLegacy is deprecated. Use validate() instead.');
  return validate(resource, profile as 'CA_CORE' | 'US_CORE');
}
```

## Version Management Tools

### Automated Version Checking
```bash
# Check current FHIR module version
npm run fhir:version

# Check for version conflicts
npm run fhir:check-version

# Update version automatically
npm run fhir:bump-version -- [major|minor|patch]
```

### Version Validation
```bash
# Validate version consistency
npm run fhir:validate-version

# Check for breaking changes
npm run fhir:check-breaking-changes
```

## Integration Guidelines

### For Application Developers
```typescript
// Always specify exact FHIR module version
import { toFhir, validate } from '@/core/fhir';

// Use version-specific features safely
if (FHIR_MODULE_VERSION >= '1.1.0') {
  // Use new features available in 1.1.0+
} else {
  // Fallback for older versions
}
```

### For Module Maintainers
```typescript
// Export version information
export const FHIR_MODULE_VERSION = '1.1.0';
export const FHIR_MODULE_API_VERSION = '1.0'; // API compatibility version

// Version-specific exports
export const SUPPORTED_FEATURES = {
  '1.0.0': ['Patient', 'Encounter', 'Observation'],
  '1.1.0': ['Patient', 'Encounter', 'Observation', 'MedicationRequest'],
  '2.0.0': ['Patient', 'Encounter', 'Observation', 'MedicationRequest', 'Condition']
};
```

## Release Checklist

### Before Release
- [ ] All tests passing (100% coverage)
- [ ] No linting errors
- [ ] TypeScript compilation successful
- [ ] CHANGELOG.md updated
- [ ] Breaking changes documented
- [ ] Migration guide written (if applicable)
- [ ] Performance benchmarks updated

### Release Day
- [ ] Create release branch
- [ ] Update version numbers
- [ ] Run full test suite
- [ ] Create release commit
- [ ] Tag release
- [ ] Update documentation
- [ ] Notify team of changes

### Post-Release
- [ ] Monitor integration tests
- [ ] Collect feedback from consumers
- [ ] Plan next version features
- [ ] Update roadmap

## Examples

### Version 1.0.0 → 1.1.0 (Minor)
```typescript
// Added new resource support
export function toFhirMedicationRequest(
  medication: unknown, 
  options: FhirConversionOptions
): FhirMedicationRequest {
  // New functionality
}

// Updated constants
export const SUPPORTED_RESOURCES = [
  'Patient', 
  'Encounter', 
  'Observation',
  'MedicationRequest' // New
] as const;
```

### Version 1.1.0 → 2.0.0 (Major)
```typescript
// Breaking change: function signature modified
export function toFhir(
  resource: unknown, 
  profile: 'CA_CORE' | 'US_CORE',
  options?: FhirConversionOptions // New optional parameter
): FhirResource {
  // Implementation changed
}

// Old API deprecated
/**
 * @deprecated Use toFhir(resource, profile, options) instead
 */
export function toFhirLegacy(
  resource: unknown, 
  profile: 'CA_CORE' | 'US_CORE'
): FhirResource {
  // Legacy implementation
}
```

## Best Practices

1. **Always document breaking changes** in CHANGELOG.md
2. **Provide migration guides** for major version changes
3. **Test backward compatibility** thoroughly
4. **Use semantic versioning** consistently
5. **Communicate changes** to the team early
6. **Maintain version history** in git tags
7. **Update documentation** with each release

---

**Last Updated**: December 2024  
**FHIR Module Version**: 1.0.0  
**Next Planned Release**: 1.1.0 (Q1 2025)

## Quality Gates Policy

**CRÍTICO**: Ningún Pull Request puede ser mergeado si `npm run fhir:all` falla.

### Pre-merge Requirements
1. **Contract Tests**: `npm run fhir:contracts` debe pasar al 100%
2. **Profile Validation**: `npm run fhir:profiles` debe pasar al 100%  
3. **Integration Tests**: `npm run fhir:adapters` debe pasar al 100%
4. **Full FHIR Suite**: `npm run fhir:all` debe pasar al 100%

### Breaking Changes Detection
- Si se detecta un breaking change en la API pública, **DETENER** el merge
- Documentar como `v2.0.0` en el CHANGELOG
- Requerir migración plan y guía de actualización
- Solo permitir merge después de aprobación del equipo técnico
