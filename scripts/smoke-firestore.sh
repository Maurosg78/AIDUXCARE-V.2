#!/usr/bin/env bash
set -euo pipefail
HOST="$(jq -r '.emulators.firestore.host // "127.0.0.1"' firebase.json)"
PORT="$(jq -r '.emulators.firestore.port // 8080' firebase.json)"
PROJECT="$(jq -r '.projects.default // "aiduxcare-v2-uat-dev"' .firebaserc)"
BASE="http://${HOST}:${PORT}/v1/projects/${PROJECT}/databases/(default)/documents"
COL="smoke_notes"; ID="note_$(date +%s)"
echo "Firestore => ${BASE}"

require_code () { exp="$1"; got="$2"; name="$3"; [[ "$got" == "$exp" ]] && echo "✅ $name -> $got" || { echo "❌ $name -> $got (esperado $exp)"; exit 1; }; }

code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"fields":{"patientId":{"stringValue":"p001"},"status":{"stringValue":"draft"},"n":{"integerValue":"1"}}}' \
  "${BASE}/${COL}?documentId=${ID}")"
require_code 200 "$code" "CREATE ${COL}/${ID}"

code="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE}/${COL}/${ID}")"
require_code 200 "$code" "GET ${COL}/${ID}"

code="$(curl -sS -o /dev/null -w '%{http_code}' -X PATCH -H 'Content-Type: application/json' \
  -d '{"fields":{"status":{"stringValue":"signed"}}}' \
  "${BASE}/${COL}/${ID}?updateMask.fieldPaths=status")"
require_code 200 "$code" "UPDATE ${COL}/${ID}"

code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE "${BASE}/${COL}/${ID}")"
require_code 200 "$code" "DELETE ${COL}/${ID}"

echo "🎉 Firestore smoke OK"
