#!/bin/bash

# Setup HTTPS for Development
# Generates self-signed certificate for Vite dev server

set -e

echo "🔒 Setting up HTTPS for development..."

# Create certs directory
mkdir -p certs

# Check if certificate already exists
if [ -f "certs/cert.pem" ] && [ -f "certs/key.pem" ]; then
    echo "✅ Certificate already exists. Skipping generation."
    exit 0
fi

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl req -x509 \
    -newkey rsa:4096 \
    -keyout certs/key.pem \
    -out certs/cert.pem \
    -days 365 \
    -nodes \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"

echo "✅ Certificate generated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start HTTPS dev server:"
echo "   npm run dev:https"
echo ""
echo "2. Find your local IP address:"
echo "   ifconfig | grep 'inet ' | grep -v 127.0.0.1"
echo ""
echo "3. Access from iPhone/Android:"
echo "   https://YOUR_IP:5174"
echo "   (Example: https://172.20.10.11:5174)"
echo ""
echo "4. Trust the certificate on mobile:"
echo "   • Safari (iPhone): Advanced → Proceed to [IP] (unsafe)"
echo "   • Chrome (Android): Advanced → Proceed to [IP] (unsafe)"
echo ""
echo "✅ Ready! The vite.config.https.ts is already configured."

