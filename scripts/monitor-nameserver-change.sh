#!/bin/bash

# Script to monitor nameserver change and notify when Cloudflare detects it
# Usage: ./scripts/monitor-nameserver-change.sh [interval_seconds]

INTERVAL=${1:-30}  # Default 30 seconds

echo "🔍 Monitoring Nameserver Change"
echo "================================"
echo "Checking every $INTERVAL seconds..."
echo "Press Ctrl+C to stop"
echo ""

CLOUDFLARE_NS=("aida.ns.cloudflare.com" "phil.ns.cloudflare.com")

while true; do
    echo ""
    echo "[$(date +%H:%M:%S)] Checking..."
    
    # Check current nameservers
    CURRENT_NS=$(dig NS aiduxcare.com +short 2>/dev/null)
    
    # Count Cloudflare nameservers
    CLOUDFLARE_COUNT=0
    for ns in "${CLOUDFLARE_NS[@]}"; do
        if echo "$CURRENT_NS" | grep -q "$ns"; then
            ((CLOUDFLARE_COUNT++))
        fi
    done
    
    if [ "$CLOUDFLARE_COUNT" -eq 2 ]; then
        echo "✅ SUCCESS! Cloudflare nameservers are active!"
        echo "   Domain should be 'Active' in Cloudflare dashboard"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Check Cloudflare dashboard - status should be 'Active'"
        echo "   2. Wait 2-3 minutes for full propagation"
        echo "   3. Test: https://dev.aiduxcare.com"
        break
    elif [ "$CLOUDFLARE_COUNT" -eq 1 ]; then
        echo "⚠️  Partial: Only 1 Cloudflare nameserver found"
        echo "   Current: $CURRENT_NS"
    else
        echo "⏳ Waiting... Porkbun nameservers still active"
        echo "   Current: $CURRENT_NS"
    fi
    
    sleep $INTERVAL
done

