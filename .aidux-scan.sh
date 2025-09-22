#!/usr/bin/env bash
set -euo pipefail

SNAPDIR=".aidux-snapshot"; mkdir -p "$SNAPDIR"
SNAP="$SNAPDIR/aidux-cto-snapshot_$(date +"%Y%m%d_%H%M%S").txt"

detect_pm(){ 
  if [ -f pnpm-lock.yaml ]; then echo pnpm;
  elif [ -f bun.lockb ]; then echo bun;
  elif [ -f yarn.lock ]; then echo yarn;
  else echo npm; fi
}
PM=$(detect_pm)

{
  echo "=== AIDUXCARE CTO SNAPSHOT ==="
  echo "Date: $(date -Is)"
  echo "Dir : $(pwd)"
  echo

  echo "## System"
  echo "OS: $(uname -a || true)"
  echo "Node: $(command -v node >/dev/null && node -v || echo no-node)"
  echo "NPM : $(command -v npm  >/dev/null && npm -v  || echo -)"
  echo "PNPM: $(command -v pnpm >/dev/null && pnpm -v || echo -)"
  echo "Yarn: $(command -v yarn >/dev/null && yarn -v || echo -)"
  echo "Bun : $(command -v bun  >/dev/null && bun -v  || echo -)"
  echo

  echo "## Git"
  echo "Remote origin: $(git remote get-url origin 2>/dev/null || echo '-')"
  echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '-')"
  echo "Last 5 commits:"; git --no-pager log --oneline -n 5 || true
  echo
  echo "Tags:"; git --no-pager tag --list | tail -n 20 || true
  echo
  echo "Status:"; git status --porcelain=v1 || true
  echo

  echo "## Package manifest"
  test -f package.json && cat package.json || echo "package.json not found"
  echo
  echo "## Lockfiles present"; ls -1 | grep -E "lock|pnpm-lock|bun.lockb|yarn.lock" || true
  echo

  echo "## TypeScript config (if any)"
  test -f tsconfig.json && cat tsconfig.json || echo "tsconfig.json not found"
  echo

  echo "## ESLint config (top-level hints)"
  ls -1a | grep -E "^\.eslintrc|^eslint\.config\.(js|cjs|mjs|ts|json)$" || true
  for f in .eslintrc .eslintrc.json eslint.config.js eslint.config.cjs eslint.config.mjs eslint.config.ts; do
    [ -f "$f" ] && { echo "--- $f ---"; sed -n "1,200p" "$f"; echo; }
  done
  echo

  echo "## Vite config"
  for f in vite.config.ts vite.config.js; do [ -f "$f" ] && { echo "--- $f ---"; sed -n "1,200p" "$f"; echo; }; done
  echo

  echo "## Env templates"
  ls -1 | grep -E "env" || true
  for f in .env .env.local .env.example .env.production; do
    [ -f "$f" ] && { echo "--- showing variable names for $f ---"; sed -E "s/=.*/=/g" "$f"; echo; }
  done
  echo

  echo "## Firebase files (glance)"
  grep -RIn --line-number --include="*.ts" --include="*.tsx" -E "getApps|initializeApp|getFunctions|getAuth|connect(.*Emulator)" src 2>/dev/null | head -n 200 || true
  echo

  echo "## Quick smells scan"
  echo "- TODO/FIXME:"; grep -RIn -E "TODO|FIXME" . --exclude-dir=node_modules 2>/dev/null | head -n 200 || true
  echo "- eslint-disable occurrences:"; grep -RIn "eslint-disable" src 2>/dev/null | head -n 200 || true
  echo "- any types (approx):"; grep -RIn --include="*.ts*" -E ":\s*any\b" src 2>/dev/null | head -n 200 || true
  echo "- vitest vi imports (approx):"; grep -RIn --include="*.ts*" -E "import\s*\{\s*vi\s*\}" src 2>/dev/null | head -n 200 || true
  echo

  echo "## Scripts in package.json (for later)"
  test -f package.json && node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts||{}).map(s=>'- '+s+' → '+p.scripts[s]).join('\n'))" || true
  echo
} > "$SNAP"

# Health checks (si existen scripts)
export CI=true
LOGDIR="$SNAPDIR/logs_$(date +%H%M%S)"; mkdir -p "$LOGDIR"

run_script(){ local name="$1"; local cmd="$2"; echo "▶ $name ($cmd)"; (eval "$cmd") >"$LOGDIR/$name.log" 2>&1 || echo "❗$name tuvo errores (ver $LOGDIR/$name.log)"; }
has_script(){ node -e "const p=require('./package.json'); process.exit((p.scripts&&p.scripts['$1'])?0:1)" 2>/dev/null; }

[ ! -d node_modules ] && echo "[nota] node_modules no existe. Usa tu PM preferido ($(if [ -f pnpm-lock.yaml ]; then echo pnpm; elif [ -f bun.lockb ]; then echo bun; elif [ -f yarn.lock ]; then echo yarn; else echo npm; fi)) para instalar." | tee -a "$SNAP"

has_script lint       && run_script lint       "$(detect_pm) run -s lint"       || true
has_script typecheck  && run_script typecheck  "$(detect_pm) run -s typecheck"  || has_script tsc && run_script tsc "$(detect_pm) run -s tsc -- --noEmit" || true
has_script test       && run_script test       "$(detect_pm) run -s test -- --run" || true
has_script build      && run_script build      "$(detect_pm) run -s build"      || true

{
  echo
  echo "## Logs summary ($LOGDIR)"
  for f in "$LOGDIR"/*.log; do
    echo "--- $(basename "$f") ---"
    tail -n 50 "$f" || true
    echo
  done
} >> "$SNAP"

echo "✅ Snapshot generado: $SNAP"
echo "🗂  Logs en: $LOGDIR"
echo "Comparte ese .txt y, si hubo fallos, los .log."
