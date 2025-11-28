#!/bin/bash

# Run Emulator Tests
# Executes comprehensive mobile testing using available emulators

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  📱 EMULATOR TESTING SUITE                                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check pre-flight
echo "🔍 Running pre-flight check..."
npm run mobile:preflight || {
    echo -e "${RED}❌ Pre-flight check failed. Fix issues before proceeding.${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Pre-flight check passed${NC}"
echo ""

# Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📡 Local IP: $LOCAL_IP"
echo ""

# Check available emulators
echo "🔍 Checking available emulators..."
echo ""

# Check Xcode Simulator
if command -v xcrun &> /dev/null; then
    echo -e "${GREEN}✅ Xcode Simulator available${NC}"
    echo "   Available devices:"
    xcrun simctl list devices available | grep -E "iPhone|iPad" | head -5 | sed 's/^/      /'
else
    echo -e "${YELLOW}⚠️  Xcode Simulator not available${NC}"
fi

echo ""

# Check Android Emulator
if command -v emulator &> /dev/null; then
    echo -e "${GREEN}✅ Android Emulator available${NC}"
    echo "   Available AVDs:"
    emulator -list-avds 2>/dev/null | sed 's/^/      /' || echo "      No AVDs found"
else
    echo -e "${YELLOW}⚠️  Android Emulator not available${NC}"
fi

echo ""

# Check Playwright
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✅ Playwright available${NC}"
else
    echo -e "${YELLOW}⚠️  Playwright not available${NC}"
fi

echo ""
echo "────────────────────────────────────────────────────────────"
echo ""
echo "📋 TESTING OPTIONS:"
echo ""
echo "1. Xcode Simulator (iOS)"
echo "   • Open Simulator manually"
echo "   • Navigate to: https://$LOCAL_IP:5174"
echo "   • Run Mobile Test Harness"
echo ""
echo "2. Android Emulator"
echo "   • Start emulator: emulator -avd <AVD_NAME>"
echo "   • Open Chrome in emulator"
echo "   • Navigate to: https://$LOCAL_IP:5174"
echo "   • Run Mobile Test Harness"
echo ""
echo "3. Playwright Automated Tests"
echo "   • Run: npm run test:e2e"
echo "   • Tests: 45+ automated viewport tests"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""
echo "🚀 To start HTTPS server:"
echo "   npm run dev:https"
echo ""
echo "📋 Then follow instructions above for each emulator"
echo ""

