#!/bin/bash
# Validate environment configuration

echo "🔍 Validating environment configuration..."

required_vars=(
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_AUTH_DOMAIN"
  "VITE_FIREBASE_PROJECT_ID"
  "VITE_VERTEX_AI_ENDPOINT"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '%s\n' "${missing_vars[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"

# Validate prompt version
if [ -z "$VITE_PROMPT_VERSION" ]; then
  echo "⚠️ VITE_PROMPT_VERSION not set, using default"
fi

# Check Firebase emulators
if [ "$VITE_USE_EMULATORS" = "true" ] && [ "$VITE_ENV" = "production" ]; then
  echo "❌ ERROR: Emulators enabled in production!"
  exit 1
fi

echo "✅ Environment validation complete"
