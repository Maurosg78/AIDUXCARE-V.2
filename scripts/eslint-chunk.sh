#!/usr/bin/env bash
set -euo pipefail
# subir el límite para este proceso (por si el shell padre no lo propaga)
ulimit -n 8192 2>/dev/null || true
# Lint solo a los archivos trackeados JS/TS, en lotes de 100
git ls-files '*.ts' '*.tsx' '*.js' '*.jsx' \
| tr '\n' '\0' \
| xargs -0 -n 100 pnpm exec eslint \
  --cache --cache-location .eslintcache \
  --max-warnings=0 \
  --ignore-path .eslintignore \
  --no-error-on-unmatched-pattern
