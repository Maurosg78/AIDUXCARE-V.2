#!/bin/bash

# Script para actualizar VITE_OPENAI_API_KEY en .env.local y .env.local.bak
# Fecha: 2026-01-12

set -e

NEW_API_KEY="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"

cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean

echo "🔧 Actualizando VITE_OPENAI_API_KEY en archivos .env.local..."

# Actualizar .env.local
if [ -f ".env.local" ]; then
    echo "📝 Actualizando .env.local..."
    
    # Si la línea existe, reemplazarla; si no, agregarla al final
    if grep -q "^VITE_OPENAI_API_KEY=" .env.local; then
        # Reemplazar la línea existente
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=${NEW_API_KEY}|" .env.local
        else
            # Linux
            sed -i "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=${NEW_API_KEY}|" .env.local
        fi
        echo "✅ .env.local actualizado (línea existente reemplazada)"
    else
        # Agregar al final del archivo
        echo "" >> .env.local
        echo "VITE_OPENAI_API_KEY=${NEW_API_KEY}" >> .env.local
        echo "✅ .env.local actualizado (línea agregada)"
    fi
else
    echo "⚠️  .env.local no existe, creándolo..."
    echo "VITE_OPENAI_API_KEY=${NEW_API_KEY}" > .env.local
    echo "✅ .env.local creado"
fi

# Actualizar .env.local.bak
if [ -f ".env.local.bak" ]; then
    echo "📝 Actualizando .env.local.bak..."
    
    # Si la línea existe, reemplazarla; si no, agregarla al final
    if grep -q "^VITE_OPENAI_API_KEY=" .env.local.bak; then
        # Reemplazar la línea existente
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=${NEW_API_KEY}|" .env.local.bak
        else
            # Linux
            sed -i "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=${NEW_API_KEY}|" .env.local.bak
        fi
        echo "✅ .env.local.bak actualizado (línea existente reemplazada)"
    else
        # Agregar al final del archivo
        echo "" >> .env.local.bak
        echo "VITE_OPENAI_API_KEY=${NEW_API_KEY}" >> .env.local.bak
        echo "✅ .env.local.bak actualizado (línea agregada)"
    fi
else
    echo "⚠️  .env.local.bak no existe, creándolo..."
    echo "VITE_OPENAI_API_KEY=${NEW_API_KEY}" > .env.local.bak
    echo "✅ .env.local.bak creado"
fi

echo ""
echo "✅ Actualización completada!"
echo ""
echo "📋 Verificación:"
echo "--- .env.local ---"
grep "^VITE_OPENAI_API_KEY=" .env.local | head -1 | sed 's/\(.\{20\}\).*\(.\{20\}\)/\1...\2/'
echo ""
echo "--- .env.local.bak ---"
grep "^VITE_OPENAI_API_KEY=" .env.local.bak | head -1 | sed 's/\(.\{20\}\).*\(.\{20\}\)/\1...\2/'





