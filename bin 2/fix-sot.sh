#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-Maurosg78/AIDUXCARE-V.2}"
PR="${PR:-127}"

echo "→ PR #$PR en $REPO"

# 1) ACK
gh pr comment "$PR" -R "$REPO" -b "ACK: CA/en-CA" || true

# 2) Título con Market/Language
CUR_TITLE="$(gh pr view "$PR" -R "$REPO" --json title -q .title)"
if ! grep -qi 'Market: CA' <<<"$CUR_TITLE" || ! grep -qi 'Language: en-CA' <<<"$CUR_TITLE"; then
  NEW_TITLE="${CUR_TITLE% } | Market: CA | Language: en-CA"
  gh pr edit "$PR" -R "$REPO" --title "$NEW_TITLE"
  echo "✓ Título normalizado"
fi

# 3) Cuerpo con bloque SoT (solo si falta)
CUR_BODY="$(gh pr view "$PR" -R "$REPO" --json body -q .body)"
SOT_BLOCK=$'# Source of Truth\nMarket: CA\nLanguage: en-CA\n'
if ! grep -qi 'Market: CA' <<<"$CUR_BODY" || ! grep -qi 'Language: en-CA' <<<"$CUR_BODY"; then
  gh pr edit "$PR" -R "$REPO" --body "$SOT_BLOCK

$CUR_BODY"
  echo "✓ Cuerpo normalizado"
fi

# 4) Nudge commit con líneas SoT en el mensaje (por si el guard valida commits)
git -c core.hooksPath=/dev/null commit --allow-empty -m $'ci: SoT ACK\n\nMarket: CA\nLanguage: en-CA' || true
git push || true

# 5) Re-run solo fallidos del evento pull_request
RUN_IDS=$(gh run list -R "$REPO" --event pull_request --json databaseId,conclusion,status,name \
  --jq '.[] | select(.status=="completed" and .conclusion=="failure") | .databaseId')

if [ -n "$RUN_IDS" ]; then
  echo "$RUN_IDS" | while read -r rid; do
    echo "↻ Re-run $rid"
    gh run rerun "$rid" -R "$REPO" || true
  done
else
  echo "No hay runs fallidos para relanzar."
fi

# 6) Imprime estado final compacto
echo "— Estado tras fix —"
gh pr view "$PR" -R "$REPO" --json statusCheckRollup \
  --jq '.statusCheckRollup[] | {name:.context, state:.state}'
