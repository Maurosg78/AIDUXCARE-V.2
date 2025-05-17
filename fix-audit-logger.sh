#!/bin/bash

echo "🛠 Reemplazando llamadas incorrectas a AuditLogger.log(...) por la versión válida con 2 argumentos..."

# Aplica reemplazo solo en archivos .ts o .tsx que tengan esa llamada con 3 argumentos
grep -rl --include=\*.ts --include=\*.tsx 'AuditLogger.log(' ./src | while read file; do
  echo "✔️  Revisando $file"
  sed -i '' -E 's/AuditLogger\.log\(([^,]+), ([^,]+), [^)]+\)/AuditLogger.log(\1, \2)/g' "$file"
done

echo "✅ Fix aplicado. Ahora puedes ejecutar: npx tsc --noEmit"
