# FHIR Module - AiDuxCare

## Quick Start

```typescript
import { 
  convertPatientToFhir, 
  createFhirBundle,
  validateCaCorePatient 
} from '@/core/fhir';

// Convert internal patient to FHIR
const fhirPatient = convertPatientToFhir(internalPatient, { 
  profile: 'ca-core' 
});

// Create FHIR bundle
const bundle = createFhirBundle([fhirPatient], {
  type: 'document',
  profile: 'ca-core'
});

// Validate against CA Core
const validation = validateCaCorePatient(fhirPatient);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

## Module Structure

```
src/core/fhir/
├── adapters/           # Data conversion
├── validators/         # Profile validation
├── types/              # TypeScript interfaces
├── utils/              # Bundle & JSON utilities
├── tests/              # Unit tests
└── index.ts            # Main exports
```

## Supported Resources

- **Patient**: Demographics & identification
- **Encounter**: Clinical visits
- **Observation**: Clinical measurements & findings

## Supported Profiles

- **CA Core**: Canadian FHIR Implementation Guide
- **US Core**: US FHIR Implementation Guide

## Key Features

- ✅ **Lightweight**: No heavy external dependencies
- ✅ **Type Safe**: Strict TypeScript with no `any`
- ✅ **Profile Compliant**: CA Core + US Core validation
- ✅ **Round-trip**: Lossless data conversion
- ✅ **Tested**: 100% test coverage
- ✅ **Decoupled**: No impact on existing EMR flow

## Validation

```typescript
import { validateFhirJson, validateFhirProfile } from '@/core/fhir';

// Basic JSON validation
const jsonValidation = validateFhirJson(fhirJsonString, 'Patient');

// Profile-specific validation
const profileValidation = validateFhirProfile(fhirJsonString, 'ca-core');
```

## Bundle Operations

```typescript
import { 
  createFhirBundle, 
  extractBundleResources,
  validateFhirBundle 
} from '@/core/fhir';

// Create bundle
const bundle = createFhirBundle(resources, { type: 'document' });

// Extract resources by type
const { patients, encounters, observations } = extractBundleResources(bundle);

// Validate bundle
const bundleValidation = validateFhirBundle(bundle);
```

## Testing

```bash
# Run all FHIR tests
npm run test src/core/fhir

# Run specific test files
npm run test src/core/fhir/tests/validators.test.ts

# Validate entire module
npm run validate:fhir
```

## Documentation

- **Full Documentation**: `docs/fhir-integration.md`
- **API Reference**: JSDoc comments in source code
- **Examples**: See test files for usage patterns

## Compliance

- **FHIR R4**: Full compliance
- **CA Core**: Validated against Canadian standards
- **US Core**: Validated against US standards
- **TypeScript**: Strict mode enabled

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: December 2024
