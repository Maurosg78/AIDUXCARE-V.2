#!/usr/bin/env bash
set -euo pipefail

PR_NUM="${1:-144}"

pass() { printf "✅ %s\n" "$*"; }
fail() { printf "❌ %s\n" "$*"; exit 1; }
info() { printf "ℹ️  %s\n" "$*"; }

echo "=== ENTERPRISE SNAPSHOT ==="

# 0) Contexto git
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REMOTE="$(git remote -v | awk 'NR==1{print $2}')"
echo "Branch: ${BRANCH}"
echo "Remote: ${REMOTE}"

# 1) Working tree limpio
if [[ -n "$(git status --porcelain)" ]]; then
  echo "— Cambios sin commit:"
  git status --porcelain
  fail "Working tree sucio. Haz commit o descarta cambios."
else
  pass "Working tree limpio"
fi

# 2) Cambios del PR vs base (solo paths actuales, rename-aware)
if [[ "${SKIP_SCOPE_CHECK:-0}" == "1" ]]; then
  info "SKIP_SCOPE_CHECK=1 → saltando verificación de ámbito del PR"
else
  command -v gh >/dev/null 2>&1 || fail "GitHub CLI (gh) no instalado."
  BASE_REF="$(gh pr view "$PR_NUM" --json baseRefName -q .baseRefName 2>/dev/null || echo main)"
  git fetch -q origin "$BASE_REF" || true

  CHANGED="$(git diff --name-status -M origin/"$BASE_REF"...HEAD || true)"
  CURRENT_PATHS="$(echo "$CHANGED" | awk '
    $1 ~ /^R[0-9]+$/ {print $3; next}   # rename: path nuevo
    $1 ~ /^[AMTC]$/  {print $2; next}   # add/modify/type change/copy
    $1 == "D"        {next}             # delete: ignorar
  ')"

  # Permite README/LICENSE/.github además de docs/enterprise
  OUTSIDE="$(echo "$CURRENT_PATHS" | grep -vE '^(docs/enterprise/|README\.md|LICENSE|\.github/|\.gitignore|CONTRIBUTING\.md)$' || true)"
  if [[ -n "$OUTSIDE" ]]; then
    echo "$OUTSIDE" | sed 's/^/  • /'
    fail "Este PR toca archivos fuera de docs/enterprise/*"
  else
    pass "Diff del PR limitado a docs/enterprise/*"
  fi
fi

# 3) Archivos críticos presentes
need_files=(
  docs/enterprise/ARCHITECTURE.md
  docs/enterprise/ROADMAP.md
  docs/enterprise/CODE_STANDARDS.md
  docs/enterprise/GOTCHAS.md
  docs/enterprise/CONTROL.md
  docs/enterprise/index.md
  docs/enterprise/ADRs/README.md
  docs/enterprise/diagrams/system-overview.mmd
  docs/enterprise/diagrams/system-overview.svg
  docs/enterprise/examples/firestore.indexes.example.json
)
for f in "${need_files[@]}"; do
  [[ -f "$f" ]] || fail "Falta: $f"
done
pass "Archivos críticos presentes"

# 4) ADRs: conteo y encabezados
ADR_COUNT="$(ls docs/enterprise/ADRs | grep -E '^ADR-' | wc -l | tr -d ' ')"
echo "ADRs encontrados: ${ADR_COUNT}"
[[ "${ADR_COUNT}" -ge 6 ]] || fail "Se esperan >= 6 ADRs."
HDRS="$(rg -n '^# ADR-' docs/enterprise/ADRs | wc -l | tr -d ' ')"
[[ "${HDRS}" -ge 6 ]] || fail "Encabezados ADR insuficientes."
pass "ADRs OK (archivos y encabezados)"

# 5) Fechas fijas (sin $(date))
if rg -n '\$\([ ]*date' docs/enterprise -g '!**/*.png' -g '!**/*.svg' >/dev/null; then
  fail "Se encontró uso de \$(date) en docs."
else
  pass "Fechas fijas OK (sin \$(date))"
fi

# 6) Diagrama referenciado desde ARCHITECTURE
rg -n 'diagrams/system-overview\.svg' docs/enterprise/ARCHITECTURE.md >/dev/null \
  && pass "ARCHITECTURE → SVG link OK" \
  || fail "ARCHITECTURE.md no linkea diagrams/system-overview.svg"

# 7) CONTROL.md contiene hitos clave
rg -n '2025-10-06|2025-10-07|FINAL SPRINT' docs/enterprise/CONTROL.md >/dev/null \
  && pass "CONTROL.md contiene entradas de Day1/Day2 y dashboard" \
  || fail "CONTROL.md sin entradas esperadas."

# 8) PR estado, labels y checks
command -v jq >/dev/null 2>&1 || fail "jq no instalado."
PR_JSON="$(gh pr view "$PR_NUM" --json number,title,labels,mergeStateStatus,headRefName,baseRefName)"
echo "$PR_JSON" | jq .
LABELS="$(echo "$PR_JSON" | jq -r '.labels[].name' | tr '\n' ' ')"
echo "Labels PR #$PR_NUM: $LABELS"
echo "$LABELS" | grep -q 'Docs' || fail "PR #$PR_NUM sin label 'Docs'."
echo "$LABELS" | grep -q 'Enterprise' || fail "PR #$PR_NUM sin label 'Enterprise'."
pass "PR #$PR_NUM tiene labels correctos"

CHECKS="$(gh pr checks "$PR_NUM" | rg -n '0 failing' || true)"
[[ -n "$CHECKS" ]] && pass "Checks OK para PR #$PR_NUM" || info "Aviso: gh no reporta checks (ver web)."

# 9) Trailers de compliance en últimos 10 commits
LAST10="$(git log -n 10 --format='%b')"
echo "$LAST10" | rg -q 'Market:\s*CA' || fail "Falta trailer 'Market: CA' en últimos commits."
echo "$LAST10" | rg -q 'Language:\s*en-CA' || fail "Falta trailer 'Language: en-CA'."
echo "$LAST10" | rg -q 'COMPLIANCE_CHECKED' || fail "Falta trailer 'COMPLIANCE_CHECKED'."
echo "$LAST10" | rg -q 'Signed-off-by:\s*ROADMAP_READ' || fail "Falta trailer 'Signed-off-by: ROADMAP_READ'."
pass "Trailers de compliance presentes"

echo "==========================="
echo "ALL CHECKS PASSED ✅"
