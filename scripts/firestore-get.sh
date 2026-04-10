#!/usr/bin/env bash
# Read Firestore documents via REST + gcloud user credentials (no service account required).
# Requires: gcloud logged in, permission to read Firestore on the project.
#
# Usage:
#   pnpm firestore:get -- treatment_plans/plan-XXX
#   pnpm firestore:get -- get treatment_plans/plan-XXX
#   pnpm firestore:get -- list treatment_plans
#   pnpm firestore:get -- list treatment_plans 50
#   FIRESTORE_PROJECT=my-proj pnpm firestore:get -- encounters/docId
#
# Paths can include subcollections, e.g. parent/doc/subcol/subdoc
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# npm/pnpm run ... -- args may forward a literal "--"
while [[ $# -gt 0 && "$1" == "--" ]]; do
  shift
done

resolve_project() {
  if [[ -n "${FIRESTORE_PROJECT:-}" ]]; then
    echo "$FIRESTORE_PROJECT"
    return
  fi
  if [[ -n "${GCLOUD_PROJECT:-}" ]]; then
    echo "$GCLOUD_PROJECT"
    return
  fi
  if [[ -f .firebaserc ]]; then
    node -e "const j=require('./.firebaserc'); process.stdout.write(j.projects?.default||'')" 2>/dev/null || true
  fi
}

PROJECT="$(resolve_project)"
PROJECT="${PROJECT:-aiduxcare-v2-uat-dev}"

if ! command -v gcloud &>/dev/null; then
  echo "firestore-get: gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

TOKEN="$(gcloud auth print-access-token --quiet)"
BASE="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents"

usage() {
  cat >&2 <<EOF
Firestore read (project: ${PROJECT}, override with FIRESTORE_PROJECT=...)

  $(basename "$0") get <collection/docId[/subcollection/subDocId...]>
  $(basename "$0") list <collection> [pageSize]

Examples:
  $(basename "$0") treatment_plans/plan-X6ErUXRRkVkVr3d33jiN-1774648525734
  $(basename "$0") get consultations/note_abc123
  $(basename "$0") list treatment_plans 25

Pretty-print: pipe to jq, e.g. ... | jq .
EOF
}

pretty_json() {
  if command -v jq &>/dev/null; then
    jq .
  else
    cat
  fi
}

cmd_get() {
  local path="$1"
  path="${path#/}"
  path="${path%/}"
  if [[ -z "$path" || "$path" == *".."* ]]; then
    echo "firestore-get: invalid path" >&2
    exit 1
  fi
  local url="${BASE}/${path}"
  curl -sS -H "Authorization: Bearer ${TOKEN}" "$url" | pretty_json
}

cmd_list() {
  local coll="$1"
  local limit="${2:-50}"
  coll="${coll#/}"
  if [[ -z "$coll" || "$coll" == *"/"* || "$coll" == *".."* ]]; then
    echo "firestore-get: list expects a top-level collection id only" >&2
    exit 1
  fi
  local url="${BASE}/${coll}?pageSize=${limit}"
  curl -sS -H "Authorization: Bearer ${TOKEN}" "$url" | pretty_json
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  -h|--help|help)
    usage
    exit 0
    ;;
  get)
    shift
    if [[ $# -lt 1 ]]; then usage; exit 1; fi
    cmd_get "$1"
    ;;
  list)
    shift
    if [[ $# -lt 1 ]]; then usage; exit 1; fi
    cmd_list "$1" "${2:-50}"
    ;;
  *)
    # Single argument: treat as get path collection/doc
    if [[ "$1" == *"/"* ]]; then
      cmd_get "$1"
    else
      echo "firestore-get: for a single segment use: get <collection>/<docId>" >&2
      usage
      exit 1
    fi
    ;;
esac
