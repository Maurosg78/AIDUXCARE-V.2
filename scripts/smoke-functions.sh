#!/usr/bin/env bash
# --- begin: auto-fallbacks (HOST/PORT/PROJECT/BASE) ---
HOST_FROM_CFG=$(jq -r '.emulators.functions.host // empty' firebase.json 2>/dev/null)
PORT_FROM_CFG=$(jq -r '.emulators.functions.port // empty' firebase.json 2>/dev/null)
PROJECT_FROM_RC=$(jq -r '.projects.default // "aiduxcare-v2-uat-dev"' .firebaserc 2>/dev/null)

HOST=${HOST:-${HOST_FROM_CFG:-127.0.0.1}}
PORT=${PORT:-${PORT_FROM_CFG:-5001}}
PROJECT=${PROJECT:-$PROJECT_FROM_RC}
BASE=${BASE:-"http://$HOST:$PORT/$PROJECT/us-central1"}

export HOST PORT PROJECT BASE
echo "Functions => $BASE"
# --- end: auto-fallbacks ---
set -euo pipefail
trap 'echo "❌ Error en línea $LINENO"; exit 1' ERR
set -euo pipefail
trap 'echo "❌ Error en línea $LINENO"; exit 1' ERR

PROJECT_ID="${PROJECT_ID:-aiduxcare-v2-uat-dev}"

# Descubre host:puerto del Functions emulator preguntando al Hub (tolerante)
FUN_HOSTPORT="$(
  curl -s http://127.0.0.1:4400/emulators 2>/dev/null \
  | jq -r '(.functions.host+":"+(.functions.port|tostring)) // empty' 2>/dev/null \
  || true
)"
if [[ -z "${FUN_HOSTPORT:-}" || "$FUN_HOSTPORT" == ":" ]]; then
  FUN_HOSTPORT="127.0.0.1:5001"
fi

BASE="http://$FUN_HOSTPORT/$PROJECT_ID/us-central1"
echo "Functions => $BASE"

# Helper: curl con status esperado
hit() {
  local method="$1" url="$2" expect="$3" body="${4:-}"
  local code
  if [[ -n "$body" ]]; then
    code="$(curl -sS --fail-with-body -o /dev/null -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" --data-binary "$body" "$url" || true)"
  else
    code="$(curl -sS -o /dev/null -w "%{http_code}" -X "$method" "$url" || true)"
  fi
  [[ "$code" == "$expect" ]] || { echo "❌ $method $url -> $code (esperado $expect)"; exit 1; }
  echo "✅ $method $url -> $code"
}
PROJECT_ID=${PROJECT_ID:-${PROJECT:-$(jq -r '.projects.default // "aiduxcare-v2-uat-dev"' .firebaserc 2>/dev/null)}}
FUN_HOSTPORT="$(curl -s http://127.0.0.1:4400/emulators 2>/dev/null | jq -r '(.functions.host+":"+(.functions.port|tostring)) // empty' 2>/dev/null || true)"

# Construye BASE solo si no está o si está mal (http://:null...).
if [[ -z "${BASE:-}" || "$BASE" == http://:null* ]]; then
  if [[ -n "$FUN_HOSTPORT" && "$FUN_HOSTPORT" != ":null" && "$FUN_HOSTPORT" == *:* ]]; then
    BASE="http://$FUN_HOSTPORT/$PROJECT_ID/us-central1"
  else
    HOST=${HOST:-$(jq -r '.emulators.functions.host // empty' firebase.json 2>/dev/null)}
    PORT=${PORT:-$(jq -r '.emulators.functions.port // empty' firebase.json 2>/dev/null)}
    HOST=${HOST:-127.0.0.1}
    PORT=${PORT:-5001}
    BASE="http://$HOST:$PORT/$PROJECT_ID/us-central1"
  fi
fi

echo "Functions => $BASE"

echo "== Salud (OPTIONS -> 204) =="
for fn in apiCreateNote apiUpdateNote apiSignNote apiAuditLog apiConsent vertexAIProxy processWithVertexAI; do
  hit OPTIONS "$BASE/$fn" 204
done
echo

NOW="$(date -u +%FT%TZ)"

echo "-- Create (201) --"
hit POST "$BASE/apiCreateNote" 201 "$(cat <<JSON
{
  "patientId":"p001","clinicianId":"c001","status":"draft",
  "subjective":"Pain","objective":"","assessment":"","plan":"",
  "createdAt":"$NOW"
}
JSON
)"

echo
echo "-- Sign (200) --"
hit POST "$BASE/apiSignNote" 200 "$(cat <<JSON
{
  "patientId":"p001","clinicianId":"c001","status":"submitted",
  "subjective":"a","objective":"b","assessment":"c","plan":"d",
  "immutable_hash":"sha256:0123456789abcdef","immutable_signed":true,
  "createdAt":"$NOW"
}
JSON
)"

echo
echo "-- Audit (201) --"
hit POST "$BASE/apiAuditLog" 201 '{"userId":"u1","action":"note.created","entityType":"note","entityId":"n1","timestamp":1697040000}'

echo
echo "-- Consent (201) --"
hit POST "$BASE/apiConsent" 201 "$(cat <<JSON
{
  "patientId":"p001","consentType":"data_processing","granted":true,
  "grantedAt":"$NOW"
}
JSON
)"
