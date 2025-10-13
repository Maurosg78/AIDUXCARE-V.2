#!/usr/bin/env bash
set -euo pipefail

TRAILERS=("Market: CA" "Language: en-CA" "Signed-off-by: ROADMAP_READ" "COMPLIANCE_CHECKED")
MSG="$(git log -1 --pretty=%B)"

missing=()
for t in "${TRAILERS[@]}"; do
  echo "$MSG" | grep -qF "$t" || missing+=("$t")
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "❌ Missing SoT trailers in last commit:"
  for m in "${missing[@]}"; do echo "  - $m"; done
  exit 2
fi

echo "✅ SoT trailers present."
