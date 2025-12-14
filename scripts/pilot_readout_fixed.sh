#!/usr/bin/env bash
set -euo pipefail

OUT="pilot_readout.md"
rm -f "$OUT"

{
  echo "# Pilot Readout"
  echo ""
  echo "Generated: $(date -Iseconds)"
  echo ""
  
  echo "## 1) Repo & toolchain"
  echo '```'
  node -v 2>&1 || echo "node not found"
  pnpm -v 2>&1 || echo "pnpm not found"
  git rev-parse --short HEAD 2>&1 || echo "git not available"
  echo ""
  echo "Git status:"
  git status --porcelain 2>&1 | head -n 20 || echo "git status failed"
  echo '```'
  echo ""
  
  echo "## 2) Commands (evidence)"
  echo '```'
  echo "=== pnpm install --frozen-lockfile ==="
  timeout 30 pnpm install --frozen-lockfile 2>&1 | tail -n 10 || echo "Install timeout/failed"
  echo ""
  echo "=== pnpm run lint ==="
  timeout 60 pnpm run lint 2>&1 | tail -n 20 || echo "Lint timeout/failed"
  echo ""
  echo "=== pnpm run build ==="
  timeout 120 pnpm run build 2>&1 | tail -n 30 || echo "Build timeout/failed"
  echo '```'
  echo ""
  
  echo "## 3) Crash scan (frontend)"
  echo '```'
  rg -n "Uncaught|Cannot read properties of null|TypeError:" src/ 2>&1 | head -20 || echo "No crash patterns found"
  echo '```'
  echo ""
  
  echo "## 4) Known blockers (from logs)"
  echo ""
  echo "### 4.1 TranscriptArea null access"
  echo '```'
  rg -n "TranscriptArea" src/components src/pages src/ -S 2>&1 | head -10 || echo "Not found"
  echo '```'
  echo ""
  
  echo "### 4.2 Deidentification audit logger undefined"
  echo '```'
  rg -n "logDeidentification|Deidentification|audit|Failed to log audit event" src/services -S 2>&1 | head -10 || echo "Not found"
  echo '```'
  echo ""
  
  echo "### 4.3 Prompt professional context undefined"
  echo '```'
  rg -n "Building professional context|No professional context|professional context" src/core/ai -S 2>&1 | head -10 || echo "Not found"
  echo '```'
  echo ""
  
  echo "## 5) Logging of PHI risk (console)"
  echo '```'
  rg -n "console\\.log|console\\.warn|console\\.error|\\[DEBUG\\]" src/ -S 2>&1 | head -n 50 || echo "No console.log found"
  echo '```'
  echo ""
  
  echo "## 6) Snapshot quarantine check"
  echo '```'
  TRACKED=$(git ls-files | rg "^canonical_snapshots/" 2>&1 | wc -l || echo "0")
  if [ "$TRACKED" -gt 0 ]; then
    echo "⚠️  WARNING: $TRACKED snapshot files still tracked"
    git ls-files | rg "^canonical_snapshots/" | head -5
  else
    echo "✅ OK: no tracked snapshots"
  fi
  echo ""
  echo "Config references:"
  rg -n "canonical_snapshots" vitest.config.* eslint.config.* tsconfig*.json package.json .github/workflows -S 2>&1 | head -10 || echo "Not found in configs"
  echo '```'
  echo ""
  
  echo "## 7) Env surface area (what a pilot needs)"
  echo '```'
  rg -n "VITE_|AIDUX_|SUPABASE_|FIREBASE_" src/ scripts/ .github/ -S 2>&1 | head -n 100 || echo "No env vars found"
  echo '```'
  echo ""
  
  echo "## 8) Pilot entry points"
  echo '```'
  rg -n "ProfessionalWorkflowPage|OnboardingPage|Login|router" src/pages src/router* src/main* -S 2>&1 | head -30 || echo "Not found"
  echo '```'
  echo ""
  echo "Done."
} > "$OUT"

echo "✅ Generated $OUT"
