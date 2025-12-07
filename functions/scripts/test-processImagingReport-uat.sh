#!/bin/bash

# ✅ WO-IR-03: Test script para processImagingReport en UAT
# 
# Usage:
#   ./test-processImagingReport-uat.sh <ID_TOKEN> [STORAGE_PATH]
#
# Example:
#   ./test-processImagingReport-uat.sh "eyJhbGc..." "imaging-reports/EFNbuCh9WQXBvJaaAUTC/unassigned/2019-greisman-MRI Results.pdf"

set -e

ID_TOKEN="${1:-}"
STORAGE_PATH="${2:-imaging-reports/EFNbuCh9WQXBvJaaAUTC/unassigned/1765012740473-3d34548a-c261-4c30-8a97-b94a7e2ad1c5-2019-greisman-MRI_Results.pdf}"

if [ -z "$ID_TOKEN" ]; then
  echo "❌ Error: ID_TOKEN is required"
  echo ""
  echo "Usage:"
  echo "  ./test-processImagingReport-uat.sh <ID_TOKEN> [STORAGE_PATH]"
  echo ""
  echo "To get ID_TOKEN:"
  echo "  1. Open https://aiduxcare-v2-uat-dev.web.app"
  echo "  2. Login"
  echo "  3. Open DevTools → Console"
  echo "  4. Run: firebase.auth().currentUser.getIdToken().then(token => console.log(token));"
  echo "  5. Copy the token"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  🧪 WO-IR-03: Test processImagingReport en UAT                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Storage Path: $STORAGE_PATH"
echo ""

# Extract patientId from path
PATIENT_ID=$(echo "$STORAGE_PATH" | cut -d'/' -f2)
EPISODE_SEGMENT=$(echo "$STORAGE_PATH" | cut -d'/' -f3)
EPISODE_ID=$( [ "$EPISODE_SEGMENT" = "unassigned" ] && echo "null" || echo "$EPISODE_SEGMENT" )

echo "Request data:"
echo "  patientId: $PATIENT_ID"
echo "  episodeId: $EPISODE_ID"
echo "  storagePath: $STORAGE_PATH"
echo ""

echo "▶️ Calling processImagingReport in UAT..."
echo ""

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d "{
    \"data\": {
      \"patientId\": \"$PATIENT_ID\",
      \"episodeId\": $EPISODE_ID,
      \"fileStoragePath\": \"$STORAGE_PATH\",
      \"modality\": \"MRI\",
      \"bodyRegion\": \"lumbar\",
      \"userId\": \"$PATIENT_ID\",
      \"source\": \"upload\"
    }
  }" \
  "https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/processImagingReport")

# Check if response contains error
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Error response:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

# Pretty print response
echo "✅ Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Extract and check DoD criteria
echo ""
echo "── DoD Checks ──"

if echo "$RESPONSE" | grep -q '"success":\s*true'; then
  echo "  ✅ success: true"
else
  echo "  ❌ success: true (NOT FOUND)"
fi

RAW_TEXT_LENGTH=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('result', {}).get('report', {}).get('rawText', '') or ''))" 2>/dev/null || echo "0")
if [ "$RAW_TEXT_LENGTH" -ge 200 ]; then
  echo "  ✅ rawText (≥200 chars): $RAW_TEXT_LENGTH chars"
else
  echo "  ❌ rawText (≥200 chars): $RAW_TEXT_LENGTH chars (TOO SHORT)"
fi

AI_SUMMARY=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('report', {}).get('aiSummary', '') or '')" 2>/dev/null || echo "")
if [ -n "$AI_SUMMARY" ] && [ ${#AI_SUMMARY} -gt 0 ]; then
  echo "  ✅ aiSummary: ${#AI_SUMMARY} chars"
else
  echo "  ❌ aiSummary: EMPTY"
fi

MODALITY=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('report', {}).get('modality', '') or '')" 2>/dev/null || echo "")
if [ "$MODALITY" = "MRI" ]; then
  echo "  ✅ modality: $MODALITY"
else
  echo "  ❌ modality: $MODALITY (EXPECTED: MRI)"
fi

BODY_REGION=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('report', {}).get('bodyRegion', '') or '')" 2>/dev/null || echo "")
if [ "$BODY_REGION" = "Lumbar spine" ]; then
  echo "  ✅ bodyRegion: $BODY_REGION"
else
  echo "  ⚠️  bodyRegion: $BODY_REGION (EXPECTED: Lumbar spine)"
fi

echo ""
echo "✅ Test completed!"
echo ""
echo "Next steps:"
echo "  1. Check Firestore collection 'imaging_reports'"
echo "  2. Verify logs: firebase functions:log --only processImagingReport --limit 20"

