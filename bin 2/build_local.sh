#!/usr/bin/env bash
set -euo pipefail

echo "▶️  Habilitando Corepack…"
corepack enable >/dev/null 2>&1 || true

# Descubre packageManager del proyecto
PKG_PM="$(node -e "try{console.log(require('./package.json').packageManager||'')}catch(e){console.log('')}" || true)"

# Si el proyecto declara pnpm, preparamos esa versión; si no, usamos una estable
if [[ "$PKG_PM" == pnpm@* ]]; then
  ver="${PKG_PM#pnpm@}"
else
  ver="8.15.4"
fi
echo "▶️  Activando pnpm@${ver} con Corepack…"
corepack prepare "pnpm@${ver}" --activate

# Helper para correr pnpm vía Corepack (evita shim de Volta)
pnpmc () { corepack pnpm "$@"; }

echo "▶️  Instalando dependencias…"
rm -rf node_modules
if [[ "$PKG_PM" == pnpm@* ]] || pnpmc -v >/dev/null 2>&1; then
  pnpmc install
else
  if [ -f package-lock.json ]; then npm ci; else npm i; fi
fi

echo "▶️  Compilando (build)…"
set -o pipefail
( (pnpmc -s build) || npm run -s build ) 2>&1 | tee build.log || true

echo
echo "📄 Primeras 120 líneas del log:"
sed -n '1,120p' build.log || true

echo
echo "🔎 Últimas 80 líneas del log:"
tail -n 80 build.log || true

# Señaliza con exit code 1 si detecta errores
if grep -qiE '(error|fail|TS[0-9]{3,5})' build.log; then
  exit 1
fi
