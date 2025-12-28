#!/bin/bash

echo "🧹 Limpiando archivos prematuros y temporales..."

# Archivos/carpetas creados prematuramente
PREMATURE_DIRS=(
  "src/modules/workflow"
)

PREMATURE_FILES=(
  "src/components/PhysicalEvaluationTab.tsx"
  "src/core/audit/auditLogger.ts"
  "docs/blueprints/PROFESSIONAL_WORKFLOW_V1.md"
)

# Archivos temporales y basura
TEMP_FILES=(
  "*.backup"
  "*.backup.*"
  "test-*.ts"
  "cleanup_whisper_only.sh"
  "sample-audio.webm"
  "vertex_token.txt"
  "tsc"
)

# Eliminar directorios prematuros
for dir in "${PREMATURE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "Eliminando directorio: $dir"
    rm -rf "$dir"
  fi
done

# Eliminar archivos prematuros
for file in "${PREMATURE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Eliminando archivo: $file"
    rm "$file"
  fi
done

# Eliminar archivos temporales
for pattern in "${TEMP_FILES[@]}"; do
  find . -name "$pattern" -type f -delete 2>/dev/null
done

# Limpiar archivos raros con nombres corruptos
rm -f "D1[Texto" "D2[Grabaci*" "E[Whisper" "F[FileProcessor]" "G" "G[Texto" "H[Vertex" "I[Parser" "J1[Hallazgos" "J2[Advertencias]" "J3[Evaluaciones" "K" "K[Selecci*" "L[Generaci*" "M[Almacenamiento" "C[Entrada" 2>/dev/null

echo "✅ Limpieza completada"
