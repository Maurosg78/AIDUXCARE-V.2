#!/bin/bash

# Script to check current nameservers for aiduxcare.com
# Usage: ./scripts/check-nameservers.sh

echo "🔍 Checking Nameservers for aiduxcare.com"
echo "=========================================="
echo ""

echo "Current Nameservers (from DNS):"
echo ""

# Check nameservers via DNS
NS_RESULT=$(dig NS aiduxcare.com +short 2>/dev/null)

if [ -z "$NS_RESULT" ]; then
    echo "   ⚠️  Could not resolve nameservers"
else
    echo "$NS_RESULT" | while read ns; do
        if echo "$ns" | grep -q "cloudflare.com"; then
            echo "   ✅ $ns (Cloudflare)"
        elif echo "$ns" | grep -q "porkbun.com"; then
            echo "   ⚠️  $ns (Porkbun - needs change)"
        else
            echo "   ℹ️  $ns"
        fi
    done
fi

echo ""
echo "Expected Cloudflare Nameservers:"
echo "   • aida.ns.cloudflare.com"
echo "   • phil.ns.cloudflare.com"
echo ""

# Check if Cloudflare nameservers are active
CLOUDFLARE_COUNT=$(echo "$NS_RESULT" | grep -c "cloudflare.com" || echo "0")

if [ "$CLOUDFLARE_COUNT" -ge 2 ]; then
    echo "✅ Status: Cloudflare nameservers active"
    echo "   Domain should be 'Active' in Cloudflare dashboard"
elif [ "$CLOUDFLARE_COUNT" -eq 1 ]; then
    echo "⚠️  Status: Partial - Only 1 Cloudflare nameserver found"
    echo "   Need to add second nameserver"
else
    echo "❌ Status: Porkbun nameservers still active"
    echo "   Need to change nameservers in Porkbun"
fi

echo ""
echo "📋 To change nameservers:"
echo "   1. Go to Porkbun → aiduxcare.com → Nameservers"
echo "   2. Replace with: aida.ns.cloudflare.com, phil.ns.cloudflare.com"
echo "   3. Save and wait 5-15 minutes"

