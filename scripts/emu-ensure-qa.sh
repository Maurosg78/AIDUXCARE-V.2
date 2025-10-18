#!/usr/bin/env bash
set -euo pipefail
AUTH='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
API='fake-local-key'
EMAIL='qa@aiduxcare.test'
PASS='Passw0rd!'
FS="http://127.0.0.1:8080/v1/projects/demo-aiduxcare/databases/(default)/documents"

curl -sS -H "Content-Type: application/json" -X POST "$AUTH/accounts:signUp?key=$API" \
  -d '{"email":"'"$EMAIL"'","password":"'"$PASS"'","returnSecureToken":true}' >/dev/null || true

UID="$(curl -sS -H "Content-Type: application/json" -X POST "$AUTH/accounts:signInWithPassword?key=$API" \
  -d '{"email":"'"$EMAIL"'","password":"'"$PASS"'","returnSecureToken":true}' | jq -r '.localId')"

[ -n "$UID" ] || { echo "❌ Auth emulator not ready"; exit 1; }

curl -sS -H "Content-Type: application/json" -X POST "$AUTH/accounts:update?key=$API" \
  -d '{"localId":"'"$UID"'","emailVerified":true,"disableUser":false}' >/dev/null

curl -sS -X PATCH "$FS/users/$UID" -H "Authorization: Bearer owner" -H "Content-Type: application/json" \
  -d '{"fields":{"uid":{"stringValue":"'"$UID"'"},"email":{"stringValue":"'"$EMAIL"'"},"displayName":{"stringValue":"QA Tester"},"role":{"stringValue":"clinician"},"emailVerified":{"booleanValue":true},"isActive":{"booleanValue":true}}}' >/dev/null

echo "✅ QA ready: $EMAIL ($UID)"
