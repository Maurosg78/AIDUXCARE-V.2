#!/bin/bash

# Comprehensive verification script for Cloudflare Tunnel setup
# Usage: ./scripts/verify-cloudflare-setup.sh

echo "🔍 Cloudflare Tunnel Setup Verification"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check Nameservers
echo "1. Nameservers:"
NS_RESULT=$(dig NS aiduxcare.com +short 2>/dev/null)
CLOUDFLARE_COUNT=$(echo "$NS_RESULT" | grep -c "cloudflare.com" || echo "0")

if [ "$CLOUDFLARE_COUNT" -ge 2 ]; then
    echo -e "   ${GREEN}✅ Cloudflare nameservers active${NC}"
    echo "   $NS_RESULT" | grep cloudflare.com | sed 's/^/      /'
elif [ "$CLOUDFLARE_COUNT" -eq 1 ]; then
    echo -e "   ${YELLOW}⚠️  Partial - Only 1 Cloudflare nameserver${NC}"
else
    echo -e "   ${RED}❌ Porkbun nameservers still active${NC}"
    echo "   Need to change in Porkbun"
fi
echo ""

# 2. Check DNS CNAME
echo "2. DNS CNAME for dev.aiduxcare.com:"
CNAME_RESULT=$(dig CNAME dev.aiduxcare.com +short 2>/dev/null)
if echo "$CNAME_RESULT" | grep -q "cfargotunnel.com"; then
    echo -e "   ${GREEN}✅ CNAME configured correctly${NC}"
    echo "   $CNAME_RESULT" | sed 's/^/      /'
else
    echo -e "   ${RED}❌ CNAME not found or incorrect${NC}"
fi
echo ""

# 3. Check Tunnel Status
echo "3. Cloudflare Tunnel:"
if ps aux | grep -q "[c]loudflared tunnel run aiduxcare-dev"; then
    echo -e "   ${GREEN}✅ Tunnel is running${NC}"
else
    echo -e "   ${RED}❌ Tunnel is not running${NC}"
    echo "   Run: cloudflared tunnel run aiduxcare-dev"
fi
echo ""

# 4. Check Local Server
echo "4. Local Server:"
if lsof -i :5174 | grep -q LISTEN; then
    echo -e "   ${GREEN}✅ Server running on port 5174${NC}"
else
    echo -e "   ${RED}❌ Server not running${NC}"
    echo "   Run: npm run dev:https"
fi
echo ""

# 5. Test DNS Resolution
echo "5. DNS Resolution:"
if dig dev.aiduxcare.com @1.1.1.1 +short 2>/dev/null | grep -q "cfargotunnel.com"; then
    echo -e "   ${GREEN}✅ Resolves correctly via Cloudflare DNS${NC}"
else
    echo -e "   ${RED}❌ Does not resolve${NC}"
fi
echo ""

# 6. Test HTTPS Access
echo "6. HTTPS Access:"
HTTP_TEST=$(curl -I https://dev.aiduxcare.com 2>&1 | head -1)
if echo "$HTTP_TEST" | grep -q "HTTP"; then
    echo -e "   ${GREEN}✅ HTTPS accessible${NC}"
    echo "   $HTTP_TEST" | sed 's/^/      /'
elif echo "$HTTP_TEST" | grep -q "Could not resolve host"; then
    echo -e "   ${YELLOW}⏳ DNS not resolved locally (may be cache)${NC}"
    echo "   Try: iPhone with mobile data"
else
    echo -e "   ${YELLOW}⚠️  $HTTP_TEST${NC}"
fi
echo ""

# Summary
echo "================================"
echo "Summary:"
echo ""

if [ "$CLOUDFLARE_COUNT" -ge 2 ] && \
   echo "$CNAME_RESULT" | grep -q "cfargotunnel.com" && \
   ps aux | grep -q "[c]loudflared tunnel run" && \
   lsof -i :5174 | grep -q LISTEN; then
    echo -e "${GREEN}✅ Setup looks good!${NC}"
    echo ""
    echo "If https://dev.aiduxcare.com doesn't work:"
    echo "  • Try from iPhone with mobile data"
    echo "  • Wait 5-15 minutes for full propagation"
    echo "  • Check Cloudflare dashboard - domain should be 'Active'"
else
    echo -e "${YELLOW}⚠️  Some issues detected${NC}"
    echo ""
    echo "Check the items above and fix any ❌ issues"
fi

