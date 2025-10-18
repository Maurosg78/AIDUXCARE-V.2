#!/usr/bin/env bash
set -euo pipefail
set +H 2>/dev/null || true
set +o histexpand 2>/dev/null || true

PROJ='demo-aiduxcare'
AUTH='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
API_KEY='fake-local-key'
EMAIL='qa@aiduxcare.test'
PASS='Passw0rd!'
FS_BASE="http://127.0.0.1:8080/v1/projects/${PROJ}/databases/(default)/documents"

req() { curl -sS "$@"; }

echo "✅ Verificando emuladores…"
nc -z 127.0.0.1 9099 || { echo "❌ Auth emulator NO está en :9099"; exit 1; }
nc -z 127.0.0.1 8080 || { echo "❌ Firestore emulator NO está en :8080"; exit 1; }

echo "➕ signUp (ignorable si ya existe)…"
req -H "Content-Type: application/json" -X POST \
  "${AUTH}/accounts:signUp?key=${API_KEY}" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"returnSecureToken\":true}" >/dev/null || true

echo "🔐 signIn → AUTH_UID…"
AUTH_UID="$(req -H "Content-Type: application/json" -X POST \
  "${AUTH}/accounts:signInWithPassword?key=${API_KEY}" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"returnSecureToken\":true}" \
  | jq -r '.localId')"

if [[ -z "${AUTH_UID}" || "${AUTH_UID}" == "null" ]]; then
  echo "❌ No se obtuvo AUTH_UID. ¿Auth emulator arriba? ¿API_KEY=fake-local-key?" ; exit 1
fi
echo "   AUTH_UID=${AUTH_UID}"

echo "📧 Marcando emailVerified=true…"
req -H "Authorization: Bearer owner" -H "Content-Type: application/json" -X POST \
  "${AUTH}/accounts:update?key=${API_KEY}" \
  -d "{\"localId\":\"${AUTH_UID}\",\"emailVerified\":true,\"disableUser\":false}" >/dev/null

echo "🗂️ users/${AUTH_UID} en Firestore…"
req -X PATCH "${FS_BASE}/users/${AUTH_UID}" \
  -H "Authorization: Bearer owner" -H "Content-Type: application/json" \
  -d "{
    \"fields\": {
      \"uid\":          {\"stringValue\":\"${AUTH_UID}\"},
      \"email\":        {\"stringValue\":\"${EMAIL}\"},
      \"displayName\":  {\"stringValue\":\"QA Tester\"},
      \"role\":         {\"stringValue\":\"clinician\"},
      \"emailVerified\":{\"booleanValue\":true},
      \"isActive\":     {\"booleanValue\":true}
    }
  }" >/dev/null

echo "🧪 Smoke signIn final…"
req -H "Content-Type: application/json" -X POST \
  "${AUTH}/accounts:signInWithPassword?key=${API_KEY}" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"returnSecureToken\":true}" \
  | jq '{localId, email, error}'
echo "✅ Listo. Login en UI: ${EMAIL} / ${PASS}"
