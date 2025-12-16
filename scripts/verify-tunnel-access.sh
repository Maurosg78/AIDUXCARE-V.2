#!/bin/bash

# Script to verify tunnel access and DNS resolution
# Usage: ./scripts/verify-tunnel-access.sh

echo "🔍 Verifying Tunnel Access"
echo "=========================="
echo ""

# Check DNS resolution
echo "1. Checking DNS resolution..."
echo ""

echo "   Public DNS (Google 8.8.8.8):"
DIG_GOOGLE=$(dig @8.8.8.8 dev.aiduxcare.com +short 2>/dev/null)
if [ -n "$DIG_GOOGLE" ]; then
    echo "   ✅ $DIG_GOOGLE"
else
    echo "   ❌ No resolution"
fi

echo ""
echo "   Public DNS (Cloudflare 1.1.1.1):"
DIG_CLOUDFLARE=$(dig @1.1.1.1 dev.aiduxcare.com +short 2>/dev/null)
if [ -n "$DIG_CLOUDFLARE" ]; then
    echo "   ✅ $DIG_CLOUDFLARE"
else
    echo "   ❌ No resolution"
fi

echo ""
echo "   Local DNS:"
DIG_LOCAL=$(dig dev.aiduxcare.com +short 2>/dev/null)
if [ -n "$DIG_LOCAL" ]; then
    echo "   ✅ $DIG_LOCAL"
else
    echo "   ⏳ Not resolved yet (normal during propagation)"
fi

echo ""
echo "2. Checking tunnel status..."
TUNNEL_RUNNING=$(ps aux | grep "cloudflared tunnel run" | grep -v grep)
if [ -n "$TUNNEL_RUNNING" ]; then
    echo "   ✅ Tunnel is running"
else
    echo "   ❌ Tunnel is not running"
fi

echo ""
echo "3. Checking local server..."
SERVER_RUNNING=$(lsof -i :5174 2>/dev/null | grep LISTEN)
if [ -n "$SERVER_RUNNING" ]; then
    echo "   ✅ Server is running on port 5174"
else
    echo "   ❌ Server is not running"
fi

echo ""
echo "4. Testing HTTPS access..."
HTTP_TEST=$(curl -I https://dev.aiduxcare.com 2>&1 | head -1)
if echo "$HTTP_TEST" | grep -q "HTTP"; then
    echo "   ✅ HTTPS accessible: $HTTP_TEST"
elif echo "$HTTP_TEST" | grep -q "Could not resolve host"; then
    echo "   ⏳ DNS not resolved locally yet (normal during propagation)"
    echo "   💡 Try: iPhone with mobile data (should work immediately)"
else
    echo "   ⚠️  $HTTP_TEST"
fi

echo ""
echo "=========================="
echo ""
echo "📋 RECOMMENDATIONS:"
echo ""
if [ -n "$DIG_GOOGLE" ] && [ -n "$DIG_CLOUDFLARE" ]; then
    echo "✅ Public DNS working - Tunnel should be accessible from:"
    echo "   • iPhone with mobile data"
    echo "   • External networks"
    echo "   • Other devices"
fi

if [ -z "$DIG_LOCAL" ]; then
    echo "⏳ Local DNS pending - Try:"
    echo "   sudo dscacheutil -flushcache"
    echo "   sudo killall -HUP mDNSResponder"
fi

echo ""
echo "⏱️  Expected timeline: 15-30 minutes for full propagation"

