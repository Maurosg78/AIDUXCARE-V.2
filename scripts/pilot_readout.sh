#!/usr/bin/env bash
set -euo pipefail

OUT="pilot_readout.md"
rm -f "$OUT"

echo "# Pilot Readout" >> "$OUT"
echo "" >> "$OUT"
echo "Generated: $(date -Iseconds)" >> "$OUT"
echo "" >> "$OUT"

echo "## 1) Repo & toolchain" >> "$OUT"
echo "\`\`\`" >> "$OUT"
node -v 2>/dev/null || true
pnpm -v 2>/dev/null || true
git rev-parse --short HEAD 2>/dev/null || true
git status --porcelain 2>/dev/null | head -n 50 || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "## 2) Commands (evidence)" >> "$OUT"
echo "\`\`\`" >> "$OUT"
pnpm install --frozen-lockfile 2>&1 | tail -n 30 || true
pnpm run lint 2>&1 | tail -n 60 || true
pnpm run build 2>&1 | tail -n 80 || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "## 3) Crash scan (frontend)" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "Uncaught|Cannot read properties of null|TypeError:" src/ || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "## 4) Known blockers (from logs)" >> "$OUT"

echo "### 4.1 TranscriptArea null access" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "TranscriptArea" src/components src/pages src/ -S || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "### 4.2 Deidentification audit logger undefined" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "logDeidentification|Deidentification|audit|Failed to log audit event" src/services -S || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "### 4.3 Prompt professional context undefined" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "Building professional context|No professional context|professional context" src/core/ai -S || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "## 5) Logging of PHI risk (console)" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "console\\.log|console\\.warn|console\\.error|\\[DEBUG\\]|logger\\.ts" src/ -S | head -n 200 || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "## 6) Snapshot quarantine check" >> "$OUT"
echo "\`\`\`" >> "$OUT"
git ls-files | rg "^canonical_snapshots/" || echo "OK: no tracked snapshots"
rg -n "canonical_snapshots" vitest.config.* eslint.config.* tsconfig*.json package.json .github/workflows -S || true
echo "\`\`\`" >> "$OUT"
echo "" >> "$OUT"

echo "## 7) Env surface area (what a pilot needs)" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "VITE_|AIDUX_|SUPABASE_|FIREBASE_" src/ scripts/ .github/ -S | head -n 200 || true
echo "\`\`\`" >> "$OUT"

echo "" >> "$OUT"
echo "## 8) Pilot entry points" >> "$OUT"
echo "\`\`\`" >> "$OUT"
rg -n "ProfessionalWorkflowPage|OnboardingPage|Login|router" src/pages src/router* src/main* -S || true
echo "\`\`\`" >> "$OUT"

echo "" >> "$OUT"
echo "Done." >> "$OUT"
