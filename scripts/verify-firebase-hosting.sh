#!/bin/bash

# Script para verificar configuración de Firebase Hosting
# y obtener información necesaria para configurar dominio en Porkbun

echo "🔍 VERIFICACIÓN DE FIREBASE HOSTING"
echo "===================================="
echo ""

# Verificar que Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado"
    echo "   Instalar con: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI instalado: $(firebase --version)"
echo ""

# Verificar que está autenticado
echo "📋 Verificando autenticación..."
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  No estás autenticado. Ejecutando login..."
    firebase login
fi

echo "✅ Autenticado correctamente"
echo ""

# Listar proyectos disponibles
echo "📦 Proyectos disponibles:"
firebase projects:list
echo ""

# Obtener proyecto actual
CURRENT_PROJECT=$(firebase use 2>&1 | grep -oP 'Using \K[^\s]+' || echo "Ninguno")
echo "🎯 Proyecto actual: $CURRENT_PROJECT"
echo ""

# Verificar configuración de hosting
echo "🌐 Configuración de Firebase Hosting:"
if [ -f "firebase.json" ]; then
    if grep -q "hosting" firebase.json; then
        echo "✅ Hosting configurado en firebase.json"
        echo ""
        echo "Configuración:"
        grep -A 10 '"hosting"' firebase.json | head -15
    else
        echo "⚠️  Hosting no está configurado en firebase.json"
    fi
else
    echo "⚠️  firebase.json no encontrado"
fi
echo ""

# Verificar directorio dist
if [ -d "dist" ]; then
    echo "✅ Directorio dist existe"
    echo "   Tamaño: $(du -sh dist 2>/dev/null | cut -f1)"
else
    echo "⚠️  Directorio dist no existe. Ejecuta 'npm run build' primero."
fi
echo ""

# Información sobre configuración de dominio
echo "💡 Para configurar dominio personalizado:"
echo "   1. Ve a Firebase Console: https://console.firebase.google.com"
echo "   2. Selecciona tu proyecto: $CURRENT_PROJECT"
echo "   3. Ve a Hosting > Configuración del sitio"
echo "   4. Click en 'Agregar dominio personalizado'"
echo "   5. Ingresa: aiduxcare.com"
echo "   6. Firebase te dará los registros DNS específicos"
echo ""

echo "✅ Verificación completada"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar dominio en Firebase Console"
echo "   2. Configurar DNS en Porkbun con los registros que Firebase proporcione"
echo "   3. Esperar 24-48 horas para propagación DNS y SSL"
echo "   4. Verificar que aiduxcare.com/hospital funciona correctamente"

