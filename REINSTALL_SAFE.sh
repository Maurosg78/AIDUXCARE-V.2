#!/bin/bash
# Reinstalación segura de dependencias con timeouts y verificación

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔧 REINSTALACIÓN SEGURA DE DEPENDENCIAS"
echo "========================================"
echo ""

# Paso 1: Verificar estado actual
echo "1. Verificando estado actual..."
echo "-------------------------------"
if [ -d "node_modules" ]; then
    echo "⚠️ node_modules existe - será eliminado"
    rm -rf node_modules
    echo "✅ node_modules eliminado"
else
    echo "✅ node_modules no existe"
fi

if [ -f "package-lock.json" ]; then
    echo "⚠️ package-lock.json existe - será eliminado"
    rm -f package-lock.json
    echo "✅ package-lock.json eliminado"
else
    echo "✅ package-lock.json no existe"
fi

# Backup de package.json si no existe
if [ ! -f "package.json.backup" ]; then
    cp package.json package.json.backup
    echo "✅ Backup de package.json creado"
fi

echo ""

# Paso 2: Limpiar cache de npm
echo "2. Limpiando cache de npm..."
echo "----------------------------"
npm cache clean --force 2>&1 | tail -5
echo "✅ Cache limpiado"
echo ""

# Paso 3: Verificar npm funciona
echo "3. Verificando npm..."
echo "----------------------"
npm --version 2>&1
if [ $? -eq 0 ]; then
    echo "✅ npm funciona"
else
    echo "❌ npm no funciona"
    exit 1
fi
echo ""

# Paso 4: Instalación con timeout y logging
echo "4. Instalando dependencias..."
echo "-----------------------------"
echo "⚠️ Esto puede tardar varios minutos..."
echo ""

# Instalar en background con timeout
timeout 600 npm install --verbose 2>&1 | tee /tmp/npm-install.log &
INSTALL_PID=$!

# Monitorear progreso
for i in {1..60}; do
    sleep 10
    if ! ps -p $INSTALL_PID > /dev/null 2>&1; then
        echo ""
        echo "✅ Instalación completada"
        break
    fi
    echo -n "."
done

# Verificar resultado
wait $INSTALL_PID 2>/dev/null
INSTALL_EXIT=$?

echo ""
echo ""

if [ $INSTALL_EXIT -eq 0 ]; then
    echo "✅ Instalación exitosa"
    echo ""
    echo "Verificando instalación..."
    [ -d "node_modules/vite" ] && echo "✅ Vite instalado" || echo "❌ Vite no instalado"
    [ -d "node_modules/react" ] && echo "✅ React instalado" || echo "❌ React no instalado"
elif [ $INSTALL_EXIT -eq 124 ]; then
    echo "❌ Instalación se colgó (timeout 10 minutos)"
    echo ""
    echo "Últimas líneas del log:"
    tail -20 /tmp/npm-install.log
    echo ""
    echo "⚠️ Puede haber un problema con npm o la red"
else
    echo "❌ Instalación falló con código $INSTALL_EXIT"
    echo ""
    echo "Errores encontrados:"
    grep -i "error\|fail" /tmp/npm-install.log | tail -10
fi

echo ""
echo "Log completo en: /tmp/npm-install.log"

