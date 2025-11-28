#!/bin/bash

# Script to generate SSL certificate for local development with IP addresses
# Usage: ./scripts/generate-ssl-cert.sh [IP_ADDRESS]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$PROJECT_ROOT/certs"

# Get current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

# Use provided IP or current IP
IP_ADDRESS="${1:-$CURRENT_IP}"

echo "🔐 Generating SSL Certificate for Development"
echo "=============================================="
echo "IP Address: $IP_ADDRESS"
echo "Certs Directory: $CERTS_DIR"
echo ""

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

# Generate certificate with IP address
echo "📝 Creating certificate configuration..."

# Create openssl config file
cat > "$CERTS_DIR/cert.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN = aiduxcare.local

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = aiduxcare.local
DNS.4 = *.aiduxcare.local
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = $IP_ADDRESS
EOF

echo "✅ Configuration file created"

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out "$CERTS_DIR/key.pem" 2048

# Generate certificate signing request
echo "📋 Generating certificate signing request..."
openssl req -new -key "$CERTS_DIR/key.pem" -out "$CERTS_DIR/cert.csr" -config "$CERTS_DIR/cert.conf"

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
openssl x509 -req -in "$CERTS_DIR/cert.csr" -signkey "$CERTS_DIR/key.pem" -out "$CERTS_DIR/cert.pem" \
  -days 365 -extensions v3_req -extfile "$CERTS_DIR/cert.conf"

# Set proper permissions
chmod 600 "$CERTS_DIR/key.pem"
chmod 644 "$CERTS_DIR/cert.pem"

# Clean up temporary files
rm -f "$CERTS_DIR/cert.csr" "$CERTS_DIR/cert.conf"

echo ""
echo "✅ SSL Certificate generated successfully!"
echo ""
echo "📋 Certificate Details:"
openssl x509 -in "$CERTS_DIR/cert.pem" -text -noout | grep -A 5 "Subject Alternative Name"
echo ""
echo "🌐 Use this URL on your iPhone:"
echo "   https://$IP_ADDRESS:5174"
echo ""
echo "📱 To install certificate on iPhone:"
echo "   1. Open Safari on iPhone"
echo "   2. Navigate to: https://$IP_ADDRESS:5174"
echo "   3. Tap 'Advanced' → 'Proceed to site'"
echo "   4. Go to Settings → General → About → Certificate Trust Settings"
echo "   5. Enable trust for the certificate"
echo ""

