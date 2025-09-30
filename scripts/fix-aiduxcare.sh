#!/usr/bin/env bash
set -euo pipefail

echo "==> Reparando exports de FirebaseAuthService…"
FILE="src/core/auth/firebaseAuthService.ts"
if [[ -f "$FILE" ]]; then
  BACKUP="$FILE.bak.$(date +%s)"
  cp "$FILE" "$BACKUP"
  echo "Backup: $BACKUP"

  # macOS sed necesita '' después de -i
  sed -E -i '' 's/^export[[:space:]]+default[[:space:]]+class[[:space:]]+FirebaseAuthService/export class FirebaseAuthService/' "$FILE"

  # Asegurar export default al final
  if ! grep -qE 'export[[:space:]]+default[[:space:]]+FirebaseAuthService' "$FILE"; then
    printf '\nexport default FirebaseAuthService;\n' >> "$FILE"
  fi

  echo "Preview:"
  grep -nE 'export[[:space:]]+(default[[:space:]]+)?class[[:space:]]+FirebaseAuthService|export[[:space:]]+default[[:space:]]+FirebaseAuthService' "$FILE" || true
else
  echo "No encontré $FILE (omito esta parte)."
fi

echo "==> Creando el FHIR Public API que piden los tests…"
mkdir -p src/core/fhir
cat > src/core/fhir/public-api.ts <<'TS'
// Public API re-exports & facade for FHIR module

// Ajusta estos imports si tus rutas internas difieren.
import * as Adapters from './adapters'
import { validate as rawValidate } from './validators'
import { makeBundle as rawMakeBundle } from './bundle'
import { scrubFhirResource as rawScrub } from './utils'

export const FHIR_MODULE_VERSION = '1.1.0' as const
export const SUPPORTED_PROFILES = ['CA_CORE', 'US_CORE'] as const
export const SUPPORTED_RESOURCES = ['Patient', 'Encounter', 'Observation'] as const

export const FHIR_CONFIG = {
  profiles: SUPPORTED_PROFILES,
  resources: SUPPORTED_RESOURCES,
} as const

export function isFhirModuleReady(): boolean {
  return true
}

export function getFhirModuleInfo() {
  return {
    version: FHIR_MODULE_VERSION,
    supportedProfiles: SUPPORTED_PROFILES,
    supportedResources: SUPPORTED_RESOURCES,
  }
}

// Re-exports principales
export const toFhir = (Adapters as any).toFhir
export const toFhirEncounter = (Adapters as any).toFhirEncounter
export const toFhirObservation = (Adapters as any).toFhirObservation
export const fromFhir = (Adapters as any).fromFhir
export const validate = rawValidate as any
export const makeBundle = rawMakeBundle as any
export const scrubFhirResource = rawScrub as any

const FhirPublicAPI = {
  toFhir,
  toFhirEncounter,
  toFhirObservation,
  fromFhir,
  validate,
  makeBundle,
  scrubFhirResource,
  FHIR_MODULE_VERSION,
  SUPPORTED_PROFILES,
  SUPPORTED_RESOURCES,
  FHIR_CONFIG,
  isFhirModuleReady,
  getFhirModuleInfo,
}
export default FhirPublicAPI
TS

echo "Listo."
