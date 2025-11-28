#!/bin/bash

# Script to start dev server with Cloudflare Tunnel
# This enables testing from anywhere via dev.aiduxcare.com

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting AiduxCare Dev Server with Cloudflare Tunnel"
echo "========================================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found"
    echo "Run: ./scripts/setup-cloudflare-tunnel.sh"
    exit 1
fi

# Check if tunnel exists
if ! cloudflared tunnel list 2>/dev/null | grep -q "aiduxcare-dev"; then
    echo "⚠️  Tunnel 'aiduxcare-dev' not found"
    echo "Run: ./scripts/setup-cloudflare-tunnel.sh"
    exit 1
fi

# Update VITE_DEV_PUBLIC_URL
echo "🌐 Updating VITE_DEV_PUBLIC_URL..."
bash "$SCRIPT_DIR/update-dev-url.sh" 2>/dev/null || true

# Set URL to dev.aiduxcare.com
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^VITE_DEV_PUBLIC_URL=.*|VITE_DEV_PUBLIC_URL=https://dev.aiduxcare.com|" "$PROJECT_ROOT/.env.local"
    else
        sed -i "s|^VITE_DEV_PUBLIC_URL=.*|VITE_DEV_PUBLIC_URL=https://dev.aiduxcare.com|" "$PROJECT_ROOT/.env.local"
    fi
    echo "✅ VITE_DEV_PUBLIC_URL set to https://dev.aiduxcare.com"
fi

echo ""
echo "🎯 Starting services..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $VITE_PID $TUNNEL_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Vite dev server in background
echo "📦 Starting Vite dev server..."
cd "$PROJECT_ROOT"
npm run dev:https > /tmp/vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to start
sleep 3

# Start Cloudflare Tunnel
echo "🌐 Starting Cloudflare Tunnel..."
cloudflared tunnel run aiduxcare-dev > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!

echo ""
echo "✅ Services started!"
echo ""
echo "🌐 Access URLs:"
echo "   • Local: https://localhost:5174"
echo "   • Public: https://dev.aiduxcare.com"
echo ""
echo "📱 For physiotherapists:"
echo "   Open Safari → https://dev.aiduxcare.com"
echo ""
echo "📋 Logs:"
echo "   • Vite: tail -f /tmp/vite.log"
echo "   • Tunnel: tail -f /tmp/tunnel.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait

