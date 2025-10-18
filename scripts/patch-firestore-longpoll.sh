#!/usr/bin/env bash
set -euo pipefail

TARGET="src/firebase.ts"
[ -f "$TARGET" ] || { echo "❌ No existe $TARGET"; exit 1; }

# Asegura imports de Firestore incluyendo initializeFirestore y connectFirestoreEmulator
# - Elimina duplicados de firestore import
sed -i '' '/from .firebase\/firestore/d' "$TARGET" || true
# - Inserta/normaliza la línea de import
grep -q "from 'firebase/firestore'" "$TARGET" \
  || sed -i '' $'1i\\\nimport { initializeApp, getApps } from \'firebase/app\';\n' "$TARGET"

# Inserta o reemplaza el import de firestore con lo que necesitamos
if grep -q "import .*from 'firebase/firestore'" "$TARGET"; then
  perl -0777 -i -pe "s/import\s*{\s*([^}]*)\s*}\s*from\s*'firebase\/firestore';/import { initializeFirestore, connectFirestoreEmulator, getFirestore } from 'firebase\/firestore';/g" "$TARGET"
else
  sed -i '' $'2i\\\nimport { initializeFirestore, connectFirestoreEmulator, getFirestore } from \'firebase/firestore\';\n' "$TARGET"
fi

# 2) Reemplaza la obtención de db para usar initializeFirestore con long-polling
# Casos a cubrir: const db = getFirestore(app)  / export const db = getFirestore(app)  / let/var
perl -0777 -i -pe 's/\b(const|let|var|export\s+const)\s+db\s*=\s*getFirestore\s*\(\s*app\s*\)\s*;/$1 db = initializeFirestore(app, { experimentalForceLongPolling: true, experimentalAutoDetectLongPolling: true, useFetchStreams: false });/g' "$TARGET"

# 3) Asegura conexión al emulador (127.0.0.1:8080), sin duplicar
grep -q "connectFirestoreEmulator(db, '127.0.0.1', 8080)" "$TARGET" || \
  sed -i '' $'/$db\s*=\s*initializeFirestore.*$/a\\\nconnectFirestoreEmulator(db, '\''127.0.0.1'\'', 8080);\n' "$TARGET"

echo "✅ Firestore forzado a long-polling en $TARGET"
