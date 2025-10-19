#!/usr/bin/env bash
set -euo pipefail

# === Configuración canónica ===
CANONICAL=(
  "src/features/welcome/WelcomePage.tsx"
  "src/features/auth/LoginPage.tsx"
  "src/features/auth/RegisterPage.tsx"
  "src/pages/NotFound.tsx"
)

# === Utilidades ===
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

MODE="${1:-dry}" # dry | --dry | --apply
[[ "$MODE" == "--apply" ]] && MODE="apply"
TS="$(date +%Y%m%d_%H%M%S)"
AUDIT="scripts/.audit_dedupe_${TS}.txt"
QUAR=".quarantine/dupes_${TS}"

RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; BLU=$'\033[34m'; CLR=$'\033[0m'

is_tracked(){ git ls-files --error-unmatch "$1" >/dev/null 2>&1; }

echo "${BLU}>> Raíz del repo:${CLR} $ROOT"
echo "${BLU}>> Modo:${CLR} $MODE (usa --apply para ejecutar movimientos)"
echo

# === Construir lista de duplicados ===
TMP="$(mktemp)"
find src -type f \( -name 'Welcome*.*' -o -name 'Login*.*' -o -name 'Register*.*' \) \
  | grep -Ev '/(tests|__tests__)/|\.spec\.|\.test\.' \
  | while read -r f; do
      # Saltar exactos canónicos
      skip=false
      for c in "${CANONICAL[@]}"; do
        [[ "$f" == "$c" ]] && skip=true && break
      done
      $skip || echo "$f"
    done \
  | sort > "$TMP"

COUNT="$(wc -l < "$TMP" | tr -d ' ')"
echo "${BLU}>> Candidatos a duplicado encontrados:${CLR} $COUNT"
cat "$TMP" | tee "$AUDIT"

if [[ "$COUNT" -eq 0 ]]; then
  echo "${GRN}No hay duplicados fuera de rutas canónicas. Nada que hacer.${CLR}"
  exit 0
fi

# === Preview git clean controlado ===
echo
echo "${YLW}Sugerencia (preview):${CLR} git clean -fdxn   # untracked (vista previa)"
echo "${YLW}Sugerencia (preview):${CLR} git clean -fdXn  # ignored (vista previa)"
echo

if [[ "$MODE" == "dry" ]]; then
  echo "${YLW}DRY-RUN:${CLR} No se moverá nada. Revisa ${AUDIT}."
  echo "Para aplicar movimientos a cuarentena:  ${GRN}bash scripts/dedupe_welcome_auth.sh --apply${CLR}"
  exit 0
fi

# === Aplicar movimientos a cuarentena ===
# Seguridad: crear rama de trabajo
CURR_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
NEW_BRANCH="chore/dedupe-welcome-auth-${TS}"
git diff-index --quiet HEAD || { echo "${RED}Working tree sucio. Haz commit/stash antes.${CLR}"; exit 1; }
git checkout -b "$NEW_BRANCH"

mkdir -p "$QUAR"

while IFS= read -r f; do
  [[ -e "$f" ]] || continue
  dest="$QUAR/$f"
  mkdir -p "$(dirname "$dest")"
  if is_tracked "$f"; then
    git mv -v "$f" "$dest"
  else
    mv -v "$f" "$dest"
    git add -N "$dest" >/dev/null 2>&1 || true
  fi
done < "$TMP"

echo
echo "${BLU}>> Archivos movidos a:${CLR} $QUAR"
git status --porcelain

# Commit de seguridad
git add -A
git commit -m "chore(dedupe): mover duplicados Welcome/Login/Register a $QUAR"

# === Checks rápidos ===
echo
echo "${BLU}>> Typecheck y lint (rápidos)${CLR}"
npm run -s build:check || { echo "${RED}Typecheck falló. Revertir si es necesario.${CLR}"; exit 1; }
npm run -s lint || true

echo
echo "${GRN}Listo.${CLR} Rama: ${GRN}$NEW_BRANCH${CLR}"
echo "Reporte: ${BLU}$AUDIT${CLR}"
echo "Cuarentena: ${BLU}$QUAR${CLR}"
echo
echo "${YLW}Revertir completo:${CLR} git switch \"$CURR_BRANCH\" && git branch -D \"$NEW_BRANCH\" && git restore -SW . && git clean -fd"
