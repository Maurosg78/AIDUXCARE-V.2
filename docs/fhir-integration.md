# FHIR Integration Documentation

## Overview

This document describes the FHIR integration implementation for the AIDUXCARE application, including validators, adapters, and utility functions.

## Validadores MVP

### CA Core Validator

The CA Core validator implements minimal validation rules for Canadian healthcare standards:

#### Patient Validation
- **Required fields**: `resourceType === 'Patient'`, `id` (string), `name[0].family`, `name[0].given[0]`
- **Identifier validation**: If `identifier` exists, `system` and `value` must be non-empty
- **Validation result**: Returns structured `PatientValidationResult` with `valid: boolean` and `errors[]`

#### Encounter Validation
- **Required fields**: `resourceType === 'Encounter'`, `id` (string), `status`
- **Status validation**: Must be one of `'planned'`, `'in-progress'`, `'finished'`, `'cancelled'`
- **Class validation**: `class.code` must be mapped to appropriate encounter types
- **Validation result**: Returns structured `EncounterValidationResult`

#### Observation Validation
- **Required fields**: `resourceType === 'Observation'`, `id` (string), `status`, `code`
- **Status validation**: Must be one of `'final'`, `'amended'`, `'corrected'`, `'registered'`, `'preliminary'`
- **Vital signs**: If category is `'vital-signs'`, must have LOINC coding in `code.coding`
- **Validation result**: Returns structured `ObservationValidationResult`

### US Core Validator

The US Core validator implements similar validation rules for US healthcare standards:

- **Same validation logic** as CA Core but with US-specific profile compliance
- **Returns structured results** with `valid: boolean` and `errors[]`
- **No undefined returns** - all validation results are deterministic

### Implementation Strategy

- **Lightweight validation** based on structure and required field checks
- **Local constants** for terminology validation (no external heavy packages)
- **Partial types** generated only for used fields (in `src/core/fhir/types/partial/`)
- **No heavy dependencies** in frontend - validation is MVP and deterministic

## Encounter Mappings (Internal ↔ FHIR)

### Internal to FHIR Conversion

| Internal Type | FHIR Class Code | FHIR Display | Notes |
|---------------|-----------------|--------------|-------|
| `emergency`   | `EMER`          | Emergency    | Emergency department visits |
| `inpatient`   | `IMP`           | Inpatient    | Hospital inpatient stays |
| `outpatient`  | `AMB`           | Ambulatory   | Outpatient clinic visits |
| `ambulatory`  | `AMB`           | Ambulatory   | Same as outpatient |
| `virtual`     | `VR`            | Virtual      | Telemedicine encounters |
| `home`        | `HH`            | Home         | Home healthcare visits |

### FHIR to Internal Conversion

| FHIR Class Code | Internal Type | Notes |
|-----------------|---------------|-------|
| `EMER`          | `emergency`   | Emergency department |
| `IMP`           | `inpatient`   | Inpatient hospital |
| `AMB`           | `outpatient`  | Ambulatory/outpatient |
| `VR`            | `virtual`     | Virtual/telemedicine |
| `HH`            | `home`        | Home healthcare |

### Implementation Details

- **Bijective mapping** ensures round-trip conversion without data loss
- **Provider ID handling** properly mapped through `participant` array
- **Status validation** ensures only valid encounter statuses are accepted

## Bundle Generation

### Clinical Analysis to FHIR Bundle

The `convertClinicalAnalysisToFhir` function generates complete FHIR bundles:

#### Before Correction (Empty Bundle)
```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": []
}
```

#### After Correction (Complete Bundle)
```json
{
  "resourceType": "Bundle",
  "type": "document",
  "id": "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
  "meta": {
    "profile": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-bundle",
      "us-core"
    ]
  },
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-123",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-123",
        "identifier": [{"system": "http://example.com/patients", "value": "123"}],
        "name": [{"use": "official", "text": "John Doe"}],
        "active": true
      }
    },
    {
      "fullUrl": "urn:uuid:encounter-456",
      "resource": {
        "resourceType": "Encounter",
        "id": "encounter-456",
        "status": "finished",
        "class": {"code": "AMB", "display": "Ambulatory"},
        "subject": {"reference": "urn:uuid:patient-123"}
      }
    }
  ]
}
```

### Bundle Features

- **Unique IDs**: Generated using UUID v4 for each resource
- **Proper references**: Internal references use `urn:uuid:` format
- **Profile compliance**: Includes both full URLs and short profile names
- **Resource validation**: All resources validated before bundle creation

## Utility Functions

### Bundle Utils

- `createFhirBundle()`: Creates FHIR bundles with custom options
- `validateFhirBundle()`: Validates bundle structure and entries
- `exportFhirBundle()`: Exports bundles as JSON with formatting options
- `extractBundleResources()`: Extracts resources by type from bundles

### JSON Utils

- `validateFhirJson()`: Basic FHIR JSON validation
- `parseFhirResource()`: Parses and validates typed FHIR resources
- `isFhirJson()`: Quick check if JSON is valid FHIR
- `getFhirResourceType()`: Extracts resource type from JSON

### Validation Utils

- `createValidationError()`: Creates structured validation errors
- `formatValidationErrors()`: Formats errors for display
- `validateFhirProfile()`: Profile-specific validation (CA Core/US Core)

## Testing

### Test Coverage

- **109 tests total** with 100% pass rate
- **Unit tests** for all validators, adapters, and utilities
- **Integration tests** for round-trip conversions
- **Edge case coverage** for error handling and validation

### Test Categories

1. **FHIR Types**: Basic type definitions and interfaces
2. **Validators**: CA Core and US Core validation logic
3. **Adapters**: Internal ↔ FHIR conversion functions
4. **Bundle Utils**: Bundle creation, validation, and export
5. **JSON Utils**: JSON parsing and validation utilities

## Performance Considerations

- **No heavy dependencies** in frontend bundle
- **Lazy validation** only when needed
- **Efficient parsing** with early returns on validation failures
- **Memory efficient** bundle generation with streaming considerations

## Future Enhancements

- **Extended profile support** for additional healthcare standards
- **Advanced validation rules** based on specific use cases
- **Performance optimization** for large bundle processing
- **Internationalization** support for multiple locales
