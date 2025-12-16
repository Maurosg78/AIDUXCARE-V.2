#!/bin/bash

# Verify HTTPS Setup
# Checks if HTTPS is properly configured

set -e

echo "🔒 Verifying HTTPS setup..."

# Check if certificate files exist
if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
    echo "❌ Certificate files not found!"
    echo "Run: bash scripts/setup-https-dev.sh"
    exit 1
fi

echo "✅ Certificate files found"

# Check if vite.config.ts has HTTPS configured
if grep -q "https:" vite.config.ts; then
    echo "✅ vite.config.ts has HTTPS configuration"
else
    echo "⚠️  vite.config.ts does not have HTTPS configuration"
    echo "Update vite.config.ts to use certificates"
fi

# Check certificate validity
echo ""
echo "📋 Certificate details:"
openssl x509 -in certs/cert.pem -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After" || true

echo ""
echo "✅ HTTPS setup verification complete"
echo ""
echo "📋 Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Access via: https://localhost:5174"
echo "3. Trust certificate on mobile device"

