#!/bin/bash

# Script para iniciar el servidor de monitoreo de AiDuxCare

echo "🔍 Iniciando servidor de monitoreo remoto..."

# Navegar al directorio del servidor
cd monitoring-server

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Iniciar el servidor
echo "🚀 Iniciando servidor en puerto 3001..."
echo "📊 Dashboard disponible en: http://localhost:3001/dashboard"
echo "🔗 API disponible en: http://localhost:3001/api/monitoring"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

node server.js 