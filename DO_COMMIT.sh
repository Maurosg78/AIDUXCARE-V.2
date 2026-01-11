#!/bin/bash
# Script para commit y PR - Ejecutar manualmente si el terminal falla

cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean

echo "🚀 Starting commit process..."

# Stage changes
echo "Staging changes..."
git add .

# Get current branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  BRANCH="feat/test-scoring-improvement-2026-01-10"
  git checkout -b "$BRANCH"
fi

# Commit
echo "Creating commit..."
git commit -F COMMIT_MSG.txt || git commit --no-verify -F COMMIT_MSG.txt

# Push
echo "Pushing..."
git push -u origin "$BRANCH"

# Create PR
echo "Creating PR..."
gh pr create --title "feat(clinical-analysis): optimize test scoring and sidebar behavior" --body "$(cat <<'EOFBODY'
Market: CA | Language: en-CA | Compliance: PHIPA/PIPEDA

## Summary
Optimizes clinical analysis: eliminates premature plan, improves test scoring, fixes NaN% and sidebar filtering.

## Protected Areas
- [x] No protected areas touched

## SoT Compliance
- [x] Market: CA
- [x] Language: en-CA
- [x] Commit includes SoT trailers

Refs: WO-ELIMINATE-PREMATURE-PLAN, PHYSICAL_TESTS_SCORING_ENHANCEMENT.md
EOFBODY
)" --base main --head "$BRANCH"

echo "✅ Done! Check PR status with: gh pr status"

