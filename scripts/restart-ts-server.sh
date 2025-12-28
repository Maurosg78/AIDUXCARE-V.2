#!/bin/bash
# Script para reiniciar TypeScript Server matando los procesos

echo "🔄 Buscando procesos de TypeScript Server..."

# Buscar procesos de tsserver
PIDS=$(ps aux | grep -i "tsserver\|typescript" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "ℹ️  No se encontraron procesos de TypeScript Server activos"
    echo "💡 El servidor se reiniciará automáticamente cuando abras un archivo .ts/.tsx"
    exit 0
fi

echo "📋 Procesos encontrados:"
ps aux | grep -i "tsserver\|typescript" | grep -v grep

echo ""
echo "🔄 Terminando procesos..."
for PID in $PIDS; do
    kill -9 "$PID" 2>/dev/null && echo "  ✅ Proceso $PID terminado" || echo "  ⚠️  No se pudo terminar proceso $PID"
done

echo ""
echo "⏳ Esperando 2 segundos..."
sleep 2

echo ""
echo "🔍 Verificando si se reiniciaron..."
NEW_PIDS=$(ps aux | grep -i "tsserver\|typescript" | grep -v grep | awk '{print $2}')

if [ -z "$NEW_PIDS" ]; then
    echo "✅ Procesos terminados. Cursor los reiniciará automáticamente cuando sea necesario."
else
    echo "✅ Servidor reiniciado. Nuevos procesos:"
    ps aux | grep -i "tsserver\|typescript" | grep -v grep
fi
