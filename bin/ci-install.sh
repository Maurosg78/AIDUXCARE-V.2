#!/usr/bin/env bash
echo "::notice::ci-install.sh START (auto-detect pm)"
set -euo pipefail
export HUSKY=0
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PUPPETEER_SKIP_DOWNLOAD=1
export CYPRESS_INSTALL_BINARY=0

if [[ -f pnpm-lock.yaml ]]; then
  corepack enable
  pnpm install --frozen-lockfile
elif [[ -f yarn.lock ]]; then
  corepack enable
  yarn install --frozen-lockfile
elif [[ -f package-lock.json ]]; then
  # si el lock no calza, cae a install
  npm ci --legacy-peer-deps --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund
else
  npm install --legacy-peer-deps --no-audit --no-fund
fi
