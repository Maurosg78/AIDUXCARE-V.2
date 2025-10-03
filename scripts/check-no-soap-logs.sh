#!/usr/bin/env bash
set -euo pipefail

if rg -n --hidden --glob 'src/**/*.{ts,tsx}' -i -P '^\s*(console\.(log|info|warn)|logger)\s*\(.*\b(SOAP|Subjective|Objective|Assessment|Plan)\b'; then
  echo '❌ Bloqueado: logs con palabras vetadas'
  exit 1
else
  echo '✅ OK: no hay logs prohibidos'
fi
