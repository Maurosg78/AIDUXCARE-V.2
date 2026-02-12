#!/bin/bash
# Fix "Unable to Load Consent" - Access denied (domain)
# Run from project root: ./scripts/fix-consent-domain.sh

set -e
PROJECT_ID="aiduxcare-v2-uat-dev"

echo "=== 1. Firebase login (if needed) ==="
firebase login --reauth

echo ""
echo "=== 2. Deploy Firestore rules ==="
firebase deploy --only firestore:rules --project "$PROJECT_ID"

echo ""
echo "=== 3. API Key: add pilot domain ==="
KEY_ID=$(gcloud services api-keys list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | head -1)
if [ -n "$KEY_ID" ]; then
  echo "Updating key: $KEY_ID"
  gcloud services api-keys update "$KEY_ID" --project="$PROJECT_ID" \
    --allowed-referrers="https://pilot.aiduxcare.com/*,https://pilot.aiduxcare.com,https://aiduxcare-v2-uat-dev.web.app/*,https://aiduxcare-v2-uat-dev.firebaseapp.com/*,http://localhost:*" 2>/dev/null || true
else
  echo "Run manually: gcloud services api-keys list --project=$PROJECT_ID"
  echo "Then: gcloud services api-keys update KEY_ID --project=$PROJECT_ID --allowed-referrers='https://pilot.aiduxcare.com/*,...'"
fi

echo ""
echo "=== 4. Firebase Auth - Authorized domains (manual) ==="
echo "Add pilot.aiduxcare.com in: Firebase Console > Authentication > Settings > Authorized domains"
