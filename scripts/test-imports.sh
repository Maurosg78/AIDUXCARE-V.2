#!/bin/bash
# Test de imports para detectar imports circulares o problemáticos

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 TEST DE IMPORTS"
echo "=================="
echo ""

# TEST 1: Verificar imports en main.tsx
echo "TEST 1: Analizar imports en main.tsx"
echo "-------------------------------------"
if [ -f src/main.tsx ]; then
    echo "Imports encontrados:"
    grep -E "^import" src/main.tsx | head -10
    echo ""
    
    # Verificar que los archivos importados existen
    echo "Verificando existencia de archivos importados:"
    grep -E "^import.*from" src/main.tsx | while read line; do
        # Extraer path del import
        path=$(echo "$line" | sed -E "s/.*from ['\"](.*)['\"].*/\1/")
        if [[ "$path" == @/* ]]; then
            # Convertir alias @ a src/
            filepath=$(echo "$path" | sed "s|@/|src/|")
            if [ -f "$filepath" ] || [ -f "${filepath}.ts" ] || [ -f "${filepath}.tsx" ]; then
                echo "  ✅ $path"
            else
                echo "  ❌ $path (no encontrado)"
            fi
        elif [[ "$path" == ./ ]]; then
            echo "  ✅ $path (relativo)"
        else
            echo "  ✅ $path (paquete npm)"
        fi
    done
else
    echo "❌ src/main.tsx no existe"
fi
echo ""

# TEST 2: Buscar imports circulares potenciales
echo "TEST 2: Buscar imports circulares potenciales"
echo "----------------------------------------------"
echo "Buscando patrones sospechosos..."
# Buscar archivos que se importan a sí mismos indirectamente
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    # Verificar si el archivo importa algo que eventualmente importa este archivo
    # (análisis básico)
    if grep -q "import.*from.*$(basename $file .tsx | sed 's/.ts$//')" "$file" 2>/dev/null; then
        echo "  ⚠️ Posible import circular en: $file"
    fi
done | head -5
echo ""

# TEST 3: Verificar imports de Firebase
echo "TEST 3: Verificar imports de Firebase"
echo "--------------------------------------"
if grep -q "firebase" src/main.tsx 2>/dev/null || find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "firebase" 2>/dev/null | head -1; then
    echo "✅ Firebase encontrado en imports"
    echo "Archivos que importan Firebase:"
    find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "firebase" 2>/dev/null | head -5
else
    echo "⚠️ Firebase no encontrado en imports"
fi
echo ""

# TEST 4: Verificar imports de React Router
echo "TEST 4: Verificar imports de React Router"
echo "------------------------------------------"
if find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "react-router" 2>/dev/null | head -1; then
    echo "✅ React Router encontrado"
    echo "Archivos que importan React Router:"
    find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "react-router" 2>/dev/null | head -5
else
    echo "⚠️ React Router no encontrado"
fi
echo ""

echo "✅ Tests de imports completados"

