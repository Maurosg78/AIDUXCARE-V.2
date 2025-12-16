#!/bin/bash

# 🔍 Pre-flight validation script for CTO
# Verifies that the dev environment is ready for iPhone validation

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🔍 PRE-FLIGHT VALIDATION – SPRINT 1                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Check if dev server is running
echo "1. Checking dev server..."
if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server is running on port 5174${NC}"
else
    echo -e "${RED}❌ Dev server is NOT running on port 5174${NC}"
    echo "   Run: npm run dev"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Check .env file exists
echo "2. Checking .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${RED}❌ .env file NOT found${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Check VITE_DEV_PUBLIC_URL is set
echo "3. Checking VITE_DEV_PUBLIC_URL..."
if grep -q "VITE_DEV_PUBLIC_URL" .env 2>/dev/null; then
    URL=$(grep "VITE_DEV_PUBLIC_URL" .env | cut -d '=' -f2)
    echo -e "${GREEN}✅ VITE_DEV_PUBLIC_URL is set${NC}"
    echo "   URL: $URL"
    
    # Extract IP from URL
    IP=$(echo $URL | sed -E 's|https?://([^:]+).*|\1|')
    echo "   IP: $IP"
else
    echo -e "${RED}❌ VITE_DEV_PUBLIC_URL NOT set in .env${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check local IP matches
echo "4. Checking local IP..."
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -n "$LOCAL_IP" ]; then
    echo -e "${GREEN}✅ Local IP found: $LOCAL_IP${NC}"
    if [ -n "$IP" ] && [ "$IP" != "$LOCAL_IP" ]; then
        echo -e "${YELLOW}⚠️  Warning: VITE_DEV_PUBLIC_URL IP ($IP) doesn't match local IP ($LOCAL_IP)${NC}"
    fi
else
    echo -e "${RED}❌ Could not determine local IP${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Check HTTPS certificate
echo "5. Checking HTTPS certificate..."
if [ -f "cert.pem" ] && [ -f "key.pem" ]; then
    echo -e "${GREEN}✅ HTTPS certificate files exist${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS certificate files not found${NC}"
    echo "   Run: openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365 -subj \"/CN=localhost\""
fi
echo ""

# 6. Check node_modules
echo "6. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
else
    echo -e "${RED}❌ node_modules NOT found${NC}"
    echo "   Run: npm install"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 7. Check Firebase config
echo "7. Checking Firebase configuration..."
if grep -q "VITE_FIREBASE" .env 2>/dev/null; then
    echo -e "${GREEN}✅ Firebase config found in .env${NC}"
else
    echo -e "${YELLOW}⚠️  Firebase config not found in .env${NC}"
fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
if [ $ERRORS -eq 0 ]; then
    echo -e "║  ${GREEN}✅ PRE-FLIGHT CHECK PASSED${NC}                                    ║"
    echo "║  Ready for iPhone validation!                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Open Safari on iPhone"
    echo "   2. Navigate to: https://$LOCAL_IP:5174"
    echo "   3. Accept certificate if prompted"
    echo "   4. Follow CTO_VALIDATION_QUICK_START.md"
    exit 0
else
    echo -e "║  ${RED}❌ PRE-FLIGHT CHECK FAILED${NC}                                    ║"
    echo "║  Found $ERRORS error(s) - fix before validation              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    exit 1
fi

