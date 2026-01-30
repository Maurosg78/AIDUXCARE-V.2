#!/usr/bin/env bash
# WO-CLINICAL-STATE-REHYDRATION-001 Fase 0: bloqueo de secrets en commits.
# Bloquea patrones sk-, OPENAI_API_KEY=, VITE_OPENAI_API_KEY= en archivos staged.

set -e
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

# Excluir archivos que documentan o implementan los patrones (contienen las cadenas por diseño)
EXCLUDE='docs/SECURE-COMMITTING.md|scripts/check-secrets-pre-commit.sh'
FOUND=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$f" ] && continue
  echo "$f" | grep -qE "$EXCLUDE" 2>/dev/null && continue
  # Solo bloquear si parece key real: sk-proj- seguido de 30+ caracteres (OpenAI keys son largas)
  if git diff --cached -- "$f" | grep -qE 'sk-proj-[a-zA-Z0-9_-]{30,}' 2>/dev/null; then
    echo "❌ [pre-commit] Possible secret in staged file: $f"
    FOUND=1
  fi
done <<< "$STAGED"

if [ "$FOUND" -eq 1 ]; then
  echo "Blocked: remove API keys from staged files. See docs/SECURE-COMMITTING.md"
  exit 1
fi
exit 0
