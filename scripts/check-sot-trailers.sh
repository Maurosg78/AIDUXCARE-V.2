#!/usr/bin/env bash
set -euo pipefail

TRAILERS=("Market: CA" "Language: en-CA" "Signed-off-by: ROADMAP_READ" "COMPLIANCE_CHECKED")

check_commit() {
  local sha="$1"
  local msg
  msg="$(git log -1 --pretty=%B "$sha")"
  local missing=()
  for t in "${TRAILERS[@]}"; do
    echo "$msg" | grep -qF "$t" || missing+=("$t")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "❌ Missing SoT trailers in commit $sha:"
    for m in "${missing[@]}"; do echo "  - $m"; done
    return 1
  fi
  echo "✅ SoT trailers present in commit $sha"
}

# Detecta rango de commits según evento
EVENT="${GITHUB_EVENT_NAME:-}"
BASE="${GITHUB_BASE_SHA:-}"
HEAD="${GITHUB_HEAD_SHA:-${GITHUB_SHA:-}}"

if [ "$EVENT" = "pull_request" ] && [ -n "$BASE" ] && [ -n "$HEAD" ]; then
  echo "🔎 Checking PR commit range: $BASE..$HEAD"
  COMMITS=$(git rev-list --no-merges "$BASE..$HEAD")
else
  echo "🔎 Checking single commit: ${HEAD:-HEAD}"
  COMMITS="${HEAD:-HEAD}"
fi

failed=0
for c in $COMMITS; do
  if ! check_commit "$c"; then
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  exit 2
fi

echo "🎉 All checked commits have required SoT trailers."
