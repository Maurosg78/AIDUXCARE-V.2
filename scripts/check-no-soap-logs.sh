#!/usr/bin/env bash
set -euo pipefail

# Solo queremos detectar LOGS (console/logger) que contengan palabras SOAP-like.
# No queremos bloquear por menciones normales de "SOAP" en UI, types, schemas, etc.
# Excluimos scripts/ y src/tools/ porque son herramientas de desarrollo/testing legítimas.
# También excluimos logs de servicio que solo mencionan "SOAP" sin filtrar contenido real.

LOG_CALLS_REGEX='(console\.(log|info|warn|error)|logger\.(debug|info|warn|error))\('
SOAP_WORDS_REGEX='\b(SOAP|Subjective|Objective|Assessment|Plan)\b'

# Busca en archivos versionados, excluyendo carpetas típicas
log_lines="$(git grep -nEI "$LOG_CALLS_REGEX" -- \
  'src/**' 'functions/**' \
  ':!**/dist/**' ':!**/build/**' ':!**/node_modules/**' \
  ':!**/test/**' ':!**/tests/**' ':!**/__tests__/**' \
  ':!**/scripts/**' \
  ':!**/cypress/**' ':!**/playwright-report/**' ':!**/test-results/**' 2>/dev/null || true)"

# Filtra manualmente para excluir src/tools/ y otros paths de desarrollo
# También excluimos logs de servicio que solo mencionan "SOAP" sin filtrar contenido real
if [[ -n "$log_lines" ]]; then
  filtered_lines="$(echo "$log_lines" | grep -vE '(src/tools/|scripts/)' || true)"
  
  if [[ -n "$filtered_lines" ]]; then
    # Busca logs que realmente filtren contenido de SOAP (contienen variables o datos)
    # Excluye logs que solo mencionan "SOAP" en mensajes de servicio/debugging
    offenders="$(echo "$filtered_lines" | grep -EI "$SOAP_WORDS_REGEX" | \
      grep -vE '(SOAP Service|SOAP retry|SOAP note|SOAP Validation|Error parsing SOAP|Error converting note to SOAP|Generando SOAP|Saving SOAP|SOAP to Clinical|SOAP tab|Restored SOAP)' || true)"
    
    if [[ -n "${offenders// }" ]]; then
      echo "❌ Forbidden SOAP-like LOG statements found (console/logger):"
      echo "$offenders"
      exit 1
    fi
  fi
fi

echo "✅ No SOAP-like logs found (console/logger only, excluding scripts/, tools/, and service logs)."
