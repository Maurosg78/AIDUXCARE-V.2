#!/bin/bash

# Script to setup Cloudflare Tunnel for dev.aiduxcare.com
# This enables testing from anywhere with valid SSL certificate

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🌐 Cloudflare Tunnel Setup for dev.aiduxcare.com"
echo "=================================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found. Installing..."
    echo ""
    echo "Installing via Homebrew..."
    brew install cloudflared
    echo "✅ cloudflared installed"
else
    echo "✅ cloudflared already installed"
fi

echo ""
echo "📋 Setup Steps:"
echo ""
echo "1. Login to Cloudflare (opens browser):"
echo "   cloudflared tunnel login"
echo ""
echo "2. Create tunnel:"
echo "   cloudflared tunnel create aiduxcare-dev"
echo ""
echo "3. Configure DNS (run this after creating tunnel):"
echo "   cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com"
echo ""
echo "4. Configure tunnel (manual step):"
echo "   Edit: ~/.cloudflared/config.yml"
echo ""
echo "   Add this configuration:"
echo "   ---"
echo "   tunnel: [YOUR-TUNNEL-ID]"
echo "   credentials-file: /Users/[USER]/.cloudflared/[TUNNEL-ID].json"
echo ""
echo "   ingress:"
echo "     - hostname: dev.aiduxcare.com"
echo "       service: https://localhost:5174"
echo "       originRequest:"
echo "         noTLSVerify: true"
echo "     - service: http_status:404"
echo "   ---"
echo ""
echo "5. Test tunnel:"
echo "   cloudflared tunnel run aiduxcare-dev"
echo ""
echo "📚 Full documentation:"
echo "   • docs/north/DOMAIN_SETUP_FOR_TESTING.md"
echo "   • docs/north/IMPLEMENTATION_PLAN_SSL_TUNNEL.md (detailed step-by-step)"
echo ""
echo "✅ CTO APPROVED - Ready to execute!"
echo ""

