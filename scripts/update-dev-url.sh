#!/bin/bash

# Script to automatically update VITE_DEV_PUBLIC_URL with current IP
# Usage: ./scripts/update-dev-url.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

# Get current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$CURRENT_IP" ]; then
  echo "❌ Error: Could not detect IP address"
  exit 1
fi

DEV_URL="https://$CURRENT_IP:5174"

echo "🌐 Updating VITE_DEV_PUBLIC_URL"
echo "   Current IP: $CURRENT_IP"
echo "   URL: $DEV_URL"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

# Update or add VITE_DEV_PUBLIC_URL
if grep -q "^VITE_DEV_PUBLIC_URL=" "$ENV_FILE"; then
  # Update existing entry
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^VITE_DEV_PUBLIC_URL=.*|VITE_DEV_PUBLIC_URL=$DEV_URL|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|^VITE_DEV_PUBLIC_URL=.*|VITE_DEV_PUBLIC_URL=$DEV_URL|" "$ENV_FILE"
  fi
  echo "✅ Updated VITE_DEV_PUBLIC_URL in .env.local"
else
  # Add new entry
  echo "" >> "$ENV_FILE"
  echo "# 🌐 Development Public URL (auto-updated)" >> "$ENV_FILE"
  echo "VITE_DEV_PUBLIC_URL=$DEV_URL" >> "$ENV_FILE"
  echo "✅ Added VITE_DEV_PUBLIC_URL to .env.local"
fi

echo ""
echo "📋 Current configuration:"
grep "VITE_DEV_PUBLIC_URL" "$ENV_FILE"

