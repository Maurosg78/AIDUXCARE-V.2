#!/usr/bin/env bash
set -euo pipefail

OUTFILE=".env.local"
BACKUP="${OUTFILE}.bak.$(date +%s)"

echo "🔐 Interactive env builder for AiDuxCare (UAT-DEV)"
if [ -f "$OUTFILE" ]; then
  echo "⚠️  $OUTFILE already exists — creating backup -> $BACKUP"
  cp "$OUTFILE" "$BACKUP"
fi

ask() {
  local name="$1"
  local prompt="$2"
  local secret="${3:-false}"
  local default="${4:-}"
  local value
  if [ "$secret" = "true" ]; then
    read -r -s -p "$prompt: " value
    echo
  else
    read -r -p "$prompt${default:+ [$default]}: " value
    value="${value:-$default}"
  fi
  echo "$value"
}

# --- Non-secret / defaults
VITE_ENV=$(ask "VITE_ENV" "Environment (eg. uat-dev)" "false" "uat-dev")
VITE_MARKET=$(ask "VITE_MARKET" "Market (eg. CA)" "false" "CA")
VITE_LANGUAGE=$(ask "VITE_LANGUAGE" "Language (eg. en-CA)" "false" "en-CA")

# --- Vertex / Gemini
VITE_VERTEX_PROJECT_ID=$(ask "VITE_VERTEX_PROJECT_ID" "Vertex project id" "false" "aiduxcare-v2-uat-dev")
VITE_VERTEX_LOCATION=$(ask "VITE_VERTEX_LOCATION" "Vertex location" "false" "us-central1")
VITE_VERTEX_MODEL=$(ask "VITE_VERTEX_MODEL" "Vertex model" "false" "gemini-1.5-pro")
VITE_VERTEX_API_KEY=$(ask "VITE_VERTEX_API_KEY" "Vertex API key (SECRET)" "true")

# --- Firebase
VITE_FIREBASE_API_KEY=$(ask "VITE_FIREBASE_API_KEY" "Firebase API key (SECRET)" "true")
VITE_FIREBASE_AUTH_DOMAIN=$(ask "VITE_FIREBASE_AUTH_DOMAIN" "Firebase auth domain" "false" "aiduxcare-v2-uat-dev.firebaseapp.com")
VITE_FIREBASE_PROJECT_ID=$(ask "VITE_FIREBASE_PROJECT_ID" "Firebase project id" "false" "aiduxcare-v2-uat-dev")
VITE_FIREBASE_STORAGE_BUCKET=$(ask "VITE_FIREBASE_STORAGE_BUCKET" "Firebase storage bucket" "false" "aiduxcare-v2-uat-dev.appspot.com")
VITE_FIREBASE_MESSAGING_SENDER_ID=$(ask "VITE_FIREBASE_MESSAGING_SENDER_ID" "Firebase messaging sender id" "false" "981266232345")
VITE_FIREBASE_APP_ID=$(ask "VITE_FIREBASE_APP_ID" "Firebase app id" "false" "1:981266232345:web:prod-uatsim-2e34b1")
VITE_FIREBASE_MEASUREMENT_ID=$(ask "VITE_FIREBASE_MEASUREMENT_ID" "Firebase measurement id" "false" "G-UATDEV2025")

# --- Supabase
VITE_SUPABASE_URL=$(ask "VITE_SUPABASE_URL" "Supabase URL" "false" "https://aiduxcare-v2.supabase.co")
VITE_SUPABASE_ANON_KEY=$(ask "VITE_SUPABASE_ANON_KEY" "Supabase anon key (SECRET)" "true")

# --- OpenAI / Whisper
VITE_OPENAI_API_KEY=$(ask "VITE_OPENAI_API_KEY" "OpenAI API key (SECRET) - whisper/fallback" "true")
VITE_OPENAI_MODEL=$(ask "VITE_OPENAI_MODEL" "OpenAI model" "false" "gpt-4o-mini")
VITE_WHISPER_MODEL=$(ask "VITE_WHISPER_MODEL" "Whisper model" "false" "gpt-4o-mini-transcribe")

# --- SoT & debug flags
VITE_MARKET_CANONICAL=$(ask "VITE_MARKET_CANONICAL" "Market canonical" "false" "CA")
VITE_COMPLIANCE=$(ask "VITE_COMPLIANCE" "Compliance flags" "false" "PHIPA,PIPEDA")
VITE_SOT_TAG=$(ask "VITE_SOT_TAG" "SoT tag" "false" "guardian-uat-20251107")
VITE_DEBUG_VERTEX=$(ask "VITE_DEBUG_VERTEX" "VITE_DEBUG_VERTEX (true/false)" "false" "true")
VITE_DEBUG_FIREBASE=$(ask "VITE_DEBUG_FIREBASE" "VITE_DEBUG_FIREBASE (true/false)" "false" "false")
VITE_DEBUG_AUTH=$(ask "VITE_DEBUG_AUTH" "VITE_DEBUG_AUTH (true/false)" "false" "true")

# --- Write file
cat > "$OUTFILE" <<EOF
# 🌎 Environment
VITE_ENV=${VITE_ENV}
VITE_MARKET=${VITE_MARKET}
VITE_LANGUAGE=${VITE_LANGUAGE}

# 🧠 Vertex AI / Gemini integration
VITE_VERTEX_PROJECT_ID=${VITE_VERTEX_PROJECT_ID}
VITE_VERTEX_LOCATION=${VITE_VERTEX_LOCATION}
VITE_VERTEX_MODEL=${VITE_VERTEX_MODEL}
VITE_VERTEX_API_KEY=${VITE_VERTEX_API_KEY}

# 🔥 Firebase (UAT-DEV)
VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}

# 🧱 Supabase (Metrics + Audit)
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# 🤖 OpenAI (Fallback / Whisper)
VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}
VITE_OPENAI_MODEL=${VITE_OPENAI_MODEL}
VITE_WHISPER_MODEL=${VITE_WHISPER_MODEL}

# 🧭 SoT / Compliance
VITE_MARKET_CANONICAL=${VITE_MARKET_CANONICAL}
VITE_COMPLIANCE=${VITE_COMPLIANCE}
VITE_SOT_TAG=${VITE_SOT_TAG}

# 🧰 Debug flags
VITE_DEBUG_VERTEX=${VITE_DEBUG_VERTEX}
VITE_DEBUG_FIREBASE=${VITE_DEBUG_FIREBASE}
VITE_DEBUG_AUTH=${VITE_DEBUG_AUTH}
EOF

chmod 600 "$OUTFILE"
echo "✅ .env.local written and permissions set to 600"

# --- Final clean exit & optional validation
if npm run -s check:env >/dev/null 2>&1; then
  echo "🔎 Running npm run check:env..."
  (set +e; npm run check:env || true)
else
  echo "ℹ️ Validation script not found — skipping check."
fi

echo "✅ Environment file created successfully!"
exit 0

