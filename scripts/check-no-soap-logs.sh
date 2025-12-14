#!/usr/bin/env bash
set -euo pipefail

PATTERN='console\.(log|info|warn|error)\s*\(|logger\.(debug|info|warn|error)\s*\('
WORDS='\b(SOAP|Subjective|Objective|Assessment|Plan)\b'

# Solo buscamos en archivos versionados, y evitamos vendor/build
OFFENDERS=$(git grep -nE "${PATTERN}.*${WORDS}" -- \
  'src/**' 'functions/**' 'scripts/**' \
  ':!**/dist/**' ':!**/build/**' ':!**/node_modules/**' ':!**/test/**' || true)

if [[ -n "${OFFENDERS}" ]]; then
  echo "❌ SOAP-like logs found:"
  echo "${OFFENDERS}"
  exit 1
fi

echo "✅ No SOAP-like logs found."
