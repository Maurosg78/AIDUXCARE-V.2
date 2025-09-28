#!/usr/bin/env bash
set -euo pipefail
ulimit -n 8192 2>/dev/null || true
# Sólo fuentes, nunca node_modules* ni backups
files=$(git ls-files 'src/**/*.{ts,tsx,js,jsx}' 'apps/**/*.{ts,tsx,js,jsx}' 'packages/**/*.{ts,tsx,js,jsx}' 2>/dev/null)
if [[ -z "$files" ]]; then
  files=$(git ls-files '*.{ts,tsx,js,jsx}' 2>/dev/null)
fi
echo "$files" | awk 'NF' | xargs -n 100 pnpm exec eslint \
  --cache --cache-location .eslintcache \
  --ignore-pattern 'node_modules.rescue.*' \
  --no-error-on-unmatched-pattern \
  --max-warnings=0
