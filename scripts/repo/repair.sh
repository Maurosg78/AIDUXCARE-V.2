#!/usr/bin/env bash
set -euo pipefail

echo "▶ fetch/prune"
git fetch --all --prune

echo "▶ prune de worktrees huérfanos"
git worktree prune --expire=now || true
if [ -d .git/worktrees ]; then
  for d in .git/worktrees/*; do
    [ -d "$d" ] || continue
    [[ -f "$d/gitdir" || -f "$d/HEAD" ]] || { echo "   - removing orphan: $d"; rm -rf "$d"; }
    rm -rf "$d/logs" 2>/dev/null || true
  done
fi

echo "▶ limpieza de objetos corruptos"
git fsck --full 2>&1 | sed -n 's/^bad sha1 file: //p' | xargs -r -I{} rm -f -- "{}"
find .git/objects -type d -empty -delete

echo "▶ repack/prune/gc"
git reflog expire --expire-unreachable=now --all || true
git repack -Adf
git prune --progress || true
git gc --prune=now || true

echo "▶ verificación final"
git fsck --full
echo "✅ repo íntegro"
