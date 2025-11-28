#!/bin/bash
# Ejecutar todos los tests de diagnóstico

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🧪 EJECUTANDO SUITE COMPLETA DE TESTS"
echo "======================================"
echo ""

# Limpiar procesos colgados primero
echo "Limpiando procesos colgados..."
pkill -9 -f "vite" 2>/dev/null
pkill -9 -f "node.*build" 2>/dev/null
sleep 2
echo "✅ Limpieza completada"
echo ""

# Test 1: Configuración progresiva
echo "═══════════════════════════════════════════════"
echo "TEST 1: Configuración Progresiva"
echo "═══════════════════════════════════════════════"
bash scripts/test-vite-config.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "TEST 2: Archivos Fuente"
echo "═══════════════════════════════════════════════"
bash scripts/test-source-files.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "TEST 3: Imports"
echo "═══════════════════════════════════════════════"
bash scripts/test-imports.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "TEST 4: Build Detallado con Logging"
echo "═══════════════════════════════════════════════"
echo "⚠️ Este test puede tardar hasta 2 minutos..."
bash scripts/test-vite-detailed.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "RESUMEN FINAL"
echo "═══════════════════════════════════════════════"
echo ""
echo "✅ Todos los tests completados"
echo ""
echo "Revisa los resultados arriba para identificar:"
echo "  - Qué test de configuración falló primero"
echo "  - Qué archivos fuente pueden tener problemas"
echo "  - Qué imports pueden estar causando problemas"
echo "  - Dónde exactamente se cuelga el build (ver log)"

