#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

# Lista de .ts/.tsx versionados
FILES=$(git ls-files 'src/**/*.ts' 'src/**/*.tsx' 2>/dev/null || true)
if [ -z "${FILES}" ]; then
  echo "No se encontraron archivos .ts/.tsx versionados en src/."
  exit 0
fi

echo "Archivos a procesar:"
echo "$FILES" | head -5
echo "..."

# Procesar archivos uno por uno para evitar problemas con espacios
echo "$FILES" | while IFS= read -r file; do
  if [ -n "$file" ] && [ -f "$file" ]; then
    node scripts/codemod_imports.mjs "$file"
  fi
done

echo
echo "=== Grep de verificación (no debería encontrar imports legacy) ==="
grep -R --line-number -E "from ['\"][^'\"]*pages/(Welcome|Login)Page|from ['\"][^'\"]*router/router" src || echo "OK: sin imports legacy"
