#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="aiduxcare-v2-uat-dev"
BASE="http://127.0.0.1:5001/$PROJECT_ID/europe-west1"

echo "== Smoke: assistantQuery (espera 503 si ALLOW_EXTERNAL_LLM != true) =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/assistantQuery" \
  -H "Content-Type: application/json" \
  -d '{"input":"hola","userId":"tester"}'

echo "== Smoke: assistantDataLookup (espera ok:true) =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/assistantDataLookup" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","userId":"tester"}'
