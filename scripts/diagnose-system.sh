#!/bin/bash
# Suite de diagnóstico por capas - De superficial a profundo

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 DIAGNÓSTICO DEL SISTEMA POR CAPAS"
echo "======================================"
echo ""

# CAPA 1: Sistema Operativo y Entorno Básico
echo "📋 CAPA 1: Sistema Operativo y Entorno Básico"
echo "---------------------------------------------"
echo "OS: $(uname -a)"
echo "Shell: $SHELL"
echo "User: $(whoami)"
echo "PWD: $(pwd)"
echo ""

# CAPA 2: Node.js y npm
echo "📋 CAPA 2: Node.js y npm"
echo "---------------------------------------------"
echo -n "Node version: "
timeout 2 node --version 2>&1 || echo "TIMEOUT o ERROR"
echo -n "npm version: "
timeout 2 npm --version 2>&1 || echo "TIMEOUT o ERROR"
echo -n "Node path: "
which node
echo -n "npm path: "
which npm
echo ""

# CAPA 3: Archivos y Permisos
echo "📋 CAPA 3: Archivos y Permisos"
echo "---------------------------------------------"
echo -n "package.json existe: "
[ -f package.json ] && echo "✅" || echo "❌"
echo -n "node_modules existe: "
[ -d node_modules ] && echo "✅" || echo "❌"
echo -n "vite.config.ts existe: "
[ -f vite.config.ts ] && echo "✅" || echo "❌"
echo -n "Permisos de ejecución en scripts: "
[ -x scripts/check-env.cjs ] && echo "✅" || echo "❌"
echo ""

# CAPA 4: Scripts Básicos
echo "📋 CAPA 4: Scripts Básicos"
echo "---------------------------------------------"
echo -n "check-env.cjs ejecutable: "
timeout 3 node scripts/check-env.cjs > /dev/null 2>&1 && echo "✅" || echo "❌ TIMEOUT o ERROR"
echo ""

# CAPA 5: Vite Básico
echo "📋 CAPA 5: Vite Básico"
echo "---------------------------------------------"
echo -n "Vite bin existe: "
[ -f node_modules/vite/bin/vite.js ] && echo "✅" || echo "❌"
echo -n "Vite --version: "
timeout 3 node node_modules/vite/bin/vite.js --version 2>&1 || echo "TIMEOUT o ERROR"
echo ""

# CAPA 6: Dependencias Críticas
echo "📋 CAPA 6: Dependencias Críticas"
echo "---------------------------------------------"
echo -n "react instalado: "
[ -d node_modules/react ] && echo "✅" || echo "❌"
echo -n "react-dom instalado: "
[ -d node_modules/react-dom ] && echo "✅" || echo "❌"
echo -n "@vitejs/plugin-react instalado: "
[ -d node_modules/@vitejs/plugin-react ] && echo "✅" || echo "❌"
echo ""

# CAPA 7: Configuración Vite
echo "📋 CAPA 7: Configuración Vite"
echo "---------------------------------------------"
echo -n "vite.config.ts válido (syntax check): "
timeout 2 node -e "import('./vite.config.ts').then(() => console.log('✅')).catch(() => console.log('❌'))" 2>&1 || echo "TIMEOUT o ERROR"
echo ""

# CAPA 8: Procesos y Recursos
echo "📋 CAPA 8: Procesos y Recursos"
echo "---------------------------------------------"
echo "Procesos vite corriendo:"
ps aux | grep -E "vite|node.*vite" | grep -v grep || echo "  Ninguno"
echo ""
echo "Puerto 5174 en uso:"
lsof -ti:5174 && echo "  ⚠️ Puerto ocupado" || echo "  ✅ Puerto libre"
echo ""
echo "Memoria disponible:"
vm_stat | head -5
echo ""

# CAPA 9: Build Test (Sin Watch)
echo "📋 CAPA 9: Build Test (Sin Watch)"
echo "---------------------------------------------"
echo "Intentando build básico (timeout 10s)..."
timeout 10 node node_modules/vite/bin/vite.js build --mode development 2>&1 | head -20 || echo "TIMEOUT después de 10 segundos"
echo ""

# CAPA 10: Resumen
echo "📋 CAPA 10: Resumen"
echo "---------------------------------------------"
echo "✅ Tests completados"
echo ""
echo "Si algún test falló o tuvo TIMEOUT, esa es la capa problemática."
echo ""

