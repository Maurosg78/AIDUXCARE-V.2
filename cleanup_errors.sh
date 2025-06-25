#!/bin/bash

# Script de limpieza de errores sin interrumpir maratón
echo "🧹 LIMPIEZA DE ERRORES"
echo "======================"

# Verificar que la maratón esté ejecutándose
MARATHON_RUNNING=$(ps aux | grep -E "(marathon|warmup)" | grep -v grep | wc -l)
if [ $MARATHON_RUNNING -gt 0 ]; then
    echo "✅ Maratón ejecutándose - NO se interrumpirá"
else
    echo "⚠️ Maratón no detectada"
fi

# 1. Limpiar procesos de Firebase conflictivos
echo "🔄 Limpiando procesos de Firebase..."
pkill -f "firebase emulators" 2>/dev/null || true
pkill -f "functionsEmulatorRuntime" 2>/dev/null || true

# 2. Liberar puertos ocupados
echo "🔓 Liberando puertos..."
lsof -ti:5001,4000,4001,4400,4401,4500,4501 | xargs kill -9 2>/dev/null || true

# 3. Limpiar archivos temporales
echo "🗑️ Limpiando archivos temporales..."
rm -f temp_vertex_test.js 2>/dev/null || true
rm -f *.tmp 2>/dev/null || true
rm -f firebase-debug.log 2>/dev/null || true

# 4. Verificar y corregir permisos
echo "🔧 Verificando permisos..."
chmod +x run_warmup_marathon.sh 2>/dev/null || true
chmod +x start_firebase.sh 2>/dev/null || true

# 5. Verificar configuración de Firebase
echo "📋 Verificando configuración..."
if [ -f "firebase.json" ]; then
    echo "✅ firebase.json encontrado"
else
    echo "❌ firebase.json no encontrado"
fi

if [ -d "functions" ]; then
    echo "✅ Directorio functions encontrado"
else
    echo "❌ Directorio functions no encontrado"
fi

# 6. Verificar logs de maratón
echo "📊 Estado de la maratón:"
if [ -f "warmup_marathon_log.txt" ]; then
    echo "✅ Log de maratón encontrado"
    echo "📅 Última actividad: $(tail -1 warmup_marathon_log.txt | cut -d' ' -f1-3 2>/dev/null || echo 'N/A')"
else
    echo "⚠️ Log de maratón no encontrado"
fi

echo ""
echo "✅ Limpieza completada"
echo "💡 Para iniciar Firebase: ./start_firebase.sh"
echo "💡 Para verificar maratón: tail -f warmup_marathon_log.txt" 