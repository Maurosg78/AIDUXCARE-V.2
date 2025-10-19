#!/usr/bin/env bash
set -euo pipefail

# repo-hygiene.sh — rutina de higiene del repo
# - Alinea main (FF-only) y hace prune remoto
# - Borra ramas locales ya fusionadas (excepto main)
# - Conserva solo N stashes (default: 2)
# - Verifica ignores clave
# - (Opcional) corre tests si pnpm está disponible
#
# Flags:
#   --keep-stashes=N   (default: 2)
#   --no-tests         (omite tests)
#   --no-prune         (omite git remote prune origin)
#   --branch=main      (rama base, default: main)

KEEP_STASHES=2
RUN_TESTS=1
DO_PRUNE=1
BASE_BRANCH="main"

for arg in "$@"; do
  case "$arg" in
    --keep-stashes=*) KEEP_STASHES="${arg#*=}";;
    --no-tests) RUN_TESTS=0;;
    --no-prune) DO_PRUNE=0;;
    --branch=*) BASE_BRANCH="${arg#*=}";;
    *) echo "Unknown arg: $arg" >&2; exit 2;;
  esac
done

# 1) Alinear la rama base con remoto, FF-only
git fetch origin
git switch "$BASE_BRANCH"
git reset --hard "origin/$BASE_BRANCH"

# 2) Prune remoto (opcional)
if [ "$DO_PRUNE" -eq 1 ]; then
  git remote prune origin
fi

# 3) Borrar ramas locales ya fusionadas (excepto base)
merged=$(git branch --merged | grep -v '^\*' | sed 's/^..//' | grep -v "^$BASE_BRANCH$" || true)
if [ -n "$merged" ]; then
  echo "$merged" | while read -r b; do
    [ -z "$b" ] && continue
    git branch -d "$b" || true
  done
fi

# 4) Limpiar stashes (dejar solo KEEP_STASHES)
count=$(git stash list | wc -l | tr -d ' ')
if [ "$count" -gt "$KEEP_STASHES" ]; then
  drop_n=$((count-KEEP_STASHES))
  for _ in $(seq 1 "$drop_n"); do git stash drop "stash@{$KEEP_STASHES}"; done
fi

# 5) Verificar ignores clave
git check-ignore -v .worktrees/ tmp/ tmp/foo docs/_archive/mirror/.DS_Store || true

# 6) Tests (si pnpm disponible y no desactivado)
if [ "$RUN_TESTS" -eq 1 ] && command -v pnpm >/dev/null 2>&1; then
  pnpm -s vitest run
else
  echo "ℹ️ Tests omitidos (pnpm no encontrado o --no-tests)."
fi

echo "✅ Repo hygiene complete on branch '$BASE_BRANCH'."
