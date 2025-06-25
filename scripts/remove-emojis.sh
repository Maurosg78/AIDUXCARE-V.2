#!/bin/bash

# Script para eliminar todos los emojis del código AiDuxCare
echo "Iniciando limpieza de emojis en el código..."

# Función para procesar archivos
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    echo "Procesando: $file"
    
    # Reemplazos específicos de emojis por texto
    sed -i '' \
        -e 's/💡/TIP/g' \
        -e 's/🔍/SEARCH/g' \
        -e 's/📝/NOTES/g' \
        -e 's/💊/TREAT/g' \
        -e 's/📅/FOLLOW/g' \
        -e 's/ℹ️/INFO/g' \
        -e 's/🚨/ALERT/g' \
        -e 's/⚠️/WARNING/g' \
        -e 's/✅/SUCCESS/g' \
        -e 's/❌/ERROR/g' \
        -e 's/🔐/SECURITY/g' \
        -e 's/🏥/MEDICAL/g' \
        -e 's/📊/STATS/g' \
        -e 's/📈/METRICS/g' \
        -e 's/🎯/TARGET/g' \
        -e 's/🔒/SECURE/g' \
        -e 's/📋/FORM/g' \
        -e 's/🟢/GREEN/g' \
        -e 's/🟡/YELLOW/g' \
        -e 's/🔴/RED/g' \
        -e 's/⚪/WHITE/g' \
        -e 's/🔥/FIRE/g' \
        -e 's/⏰/TIME/g' \
        -e 's/⏱️/TIMER/g' \
        -e 's/🧹/CLEAN/g' \
        "$file"
done

echo "Limpieza de emojis completada"
