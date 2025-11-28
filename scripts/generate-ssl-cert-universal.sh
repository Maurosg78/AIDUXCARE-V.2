#!/bin/bash

# Script to generate UNIVERSAL SSL certificate for local development
# This certificate works with multiple IP addresses and .local domain
# Usage: ./scripts/generate-ssl-cert-universal.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$PROJECT_ROOT/certs"

echo "🔐 Generating UNIVERSAL SSL Certificate for Development"
echo "========================================================"
echo "This certificate will work with:"
echo "  • Multiple local IP addresses (192.168.x.x)"
echo "  • localhost and 127.0.0.1"
echo "  • aiduxcare.local domain (via mDNS)"
echo ""

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

# Get current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "📝 Creating universal certificate configuration..."
echo "   Current IP detected: $CURRENT_IP"

# Create openssl config file with multiple IPs
cat > "$CERTS_DIR/cert-universal.conf" << 'EOF'
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
# Localhost variants
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = aiduxcare.local
DNS.4 = *.aiduxcare.local

# IPv4 localhost
IP.1 = 127.0.0.1

# IPv6 localhost
IP.2 = ::1

# Common local network IP ranges (192.168.0.x - 192.168.255.x)
# We'll add the most common ones
IP.3 = 192.168.0.1
IP.4 = 192.168.0.2
IP.5 = 192.168.0.3
IP.6 = 192.168.0.10
IP.7 = 192.168.0.20
IP.8 = 192.168.0.30
IP.9 = 192.168.0.100
IP.10 = 192.168.0.200
IP.11 = 192.168.0.203
IP.12 = 192.168.1.1
IP.13 = 192.168.1.10
IP.14 = 192.168.1.20
IP.15 = 192.168.1.100
IP.16 = 192.168.1.171
IP.17 = 192.168.1.200
IP.18 = 192.168.2.1
IP.19 = 192.168.2.100
IP.20 = 10.0.0.1
IP.21 = 10.0.0.2
IP.22 = 10.0.0.100
EOF

# Add current IP if not already in the list
if [ -n "$CURRENT_IP" ]; then
  if ! grep -q "$CURRENT_IP" "$CERTS_DIR/cert-universal.conf"; then
    echo "   Adding current IP: $CURRENT_IP"
    # Count existing IP entries
    LAST_IP_NUM=$(grep -c "^IP\." "$CERTS_DIR/cert-universal.conf" || echo "0")
    NEXT_IP_NUM=$((LAST_IP_NUM + 1))
    echo "IP.$NEXT_IP_NUM = $CURRENT_IP" >> "$CERTS_DIR/cert-universal.conf"
  fi
fi

echo "✅ Configuration file created with multiple IPs"

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out "$CERTS_DIR/key.pem" 2048

# Generate certificate signing request
echo "📋 Generating certificate signing request..."
openssl req -new -key "$CERTS_DIR/key.pem" -out "$CERTS_DIR/cert.csr" -config "$CERTS_DIR/cert-universal.conf"

# Generate self-signed certificate (valid for 10 years)
echo "📜 Generating self-signed certificate (valid for 10 years)..."
openssl x509 -req -in "$CERTS_DIR/cert.csr" -signkey "$CERTS_DIR/key.pem" -out "$CERTS_DIR/cert.pem" \
  -days 3650 -extensions v3_req -extfile "$CERTS_DIR/cert-universal.conf"

# Set proper permissions
chmod 600 "$CERTS_DIR/key.pem"
chmod 644 "$CERTS_DIR/cert.pem"

# Clean up temporary files
rm -f "$CERTS_DIR/cert.csr" "$CERTS_DIR/cert-universal.conf"

echo ""
echo "✅ UNIVERSAL SSL Certificate generated successfully!"
echo ""
echo "📋 Certificate Details:"
openssl x509 -in "$CERTS_DIR/cert.pem" -text -noout | grep -A 10 "Subject Alternative Name" | head -15
echo ""
echo "🌐 This certificate works with:"
echo "   • https://localhost:5174"
echo "   • https://127.0.0.1:5174"
echo "   • https://aiduxcare.local:5174 (via mDNS)"
echo "   • https://192.168.x.x:5174 (most common local IPs)"
echo ""
echo "📱 To use on iPhone:"
echo "   1. Use IP address: https://$CURRENT_IP:5174"
echo "   OR use domain: https://aiduxcare.local:5174"
echo "   2. Install certificate (Settings → Certificate Trust)"
echo ""
echo "💡 TIP: Add this to your /etc/hosts for domain access:"
echo "   $CURRENT_IP  aiduxcare.local"
echo ""

