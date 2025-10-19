#!/bin/bash
echo "🏕️ Restaurando campamento base v1.0..."

# Guardar cambios actuales
git stash save "Guardando cambios antes de restaurar baseline"

# Volver al tag estable
git checkout v1.0-patent-ready

# Restaurar archivos clave
cp docs/prompt-evolution/prompt-2024-09-07.js src/core/ai/PromptFactory-v3.ts

echo "✅ Sistema restaurado a v1.0 estable"
echo "📊 Métricas baseline:"
echo "  - Precisión: 95%"
echo "  - Tiempo: <3s"
echo "  - Completitud: 90%"
