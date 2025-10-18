#!/usr/bin/env bash
set -euo pipefail

# --- util para sed inline en mac/linux ---
SEDI() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

# 1) Encontrar candidato en ./src (initializeApp/getFirestore)
if command -v rg >/dev/null 2>&1; then
  candidates="$(rg -l '(initializeApp|getFirestore|connectFirestoreEmulator)' src 2>/dev/null || true)"
else
  candidates="$(find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) -exec grep -Il 'initializeApp\|getFirestore\|connectFirestoreEmulator' {} + 2>/dev/null || true)"
fi

if [ -z "${candidates}" ]; then
  echo "❌ No se encontró archivo de inicialización Firebase en ./src"
  exit 1
fi

# Heurística: prioriza nombres comunes tipo firebase.*
target=""
while IFS= read -r f; do
  base="$(basename "$f")"
  case "$base" in
    firebase.ts|firebase.js|firebase.tsx|firebase.jsx|firebase.config.ts|firebaseConfig.ts|firebase.config.js|firebaseConfig.js)
      target="$f"; break;;
  esac
done <<< "$candidates"

# Si no hay match, usa el primero
if [ -z "${target:-}" ]; then
  target="$(echo "$candidates" | head -n1)"
fi

[ -f "$target" ] || { echo "❌ No existe $target"; exit 1; }
echo "🔎 Archivo detectado: $target"

# 2) Asegurar import de Firestore con initializeFirestore + connectFirestoreEmulator
if grep -q "from 'firebase/firestore'" "$target"; then
  perl -0777 -i -pe "s/import\s*{\s*[^}]*}\s*from\s*'firebase\/firestore';/import { initializeFirestore, connectFirestoreEmulator, getFirestore } from 'firebase\/firestore';/g" "$target"
else
  SEDI "1i\\
import { initializeFirestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
" "$target"
fi

# 3) Reemplazar getFirestore(app) por initializeFirestore(app, { long-polling... })
perl -0777 -i -pe 's/\b(const|let|var|export\s+const)\s+db\s*=\s*getFirestore\s*\(\s*app\s*\)\s*;/$1 db = initializeFirestore(app, { experimentalForceLongPolling: true, experimentalAutoDetectLongPolling: true, useFetchStreams: false });/g' "$target"

# 4) Conectar emulador (127.0.0.1:8080) si no está
grep -q "connectFirestoreEmulator(db" "$target" || \
  perl -0777 -i -pe "s/(db\s*=\s*initializeFirestore\([^\)]*\)\s*;)/\1\nconnectFirestoreEmulator(db, '127.0.0.1', 8080);\n/g" "$target"

echo "✅ Patch aplicado en: $target"
