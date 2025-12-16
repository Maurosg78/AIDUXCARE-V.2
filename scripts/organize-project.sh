#!/bin/bash

# Script de Organización del Proyecto AIDUXCARE-V.2
# Este script organiza archivos duplicados, obsoletos y temporales

set -e  # Salir si hay errores

echo "🧹 Iniciando organización del proyecto..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Crear directorios necesarios
echo "📁 Creando estructura de directorios..."
mkdir -p backups/configs
mkdir -p scripts/{build,fix,cleanup,test,setup,utils}
mkdir -p docs/{config,deployment,troubleshooting,testing}
echo -e "${GREEN}✅ Directorios creados${NC}"
echo ""

# Fase 1: Eliminar archivos temporales/erróneos
echo "🗑️  Fase 1: Eliminando archivos temporales/erróneos..."
FILES_TO_DELETE=(
    "--filter=bindings 2.members:serviceAccount:*"
    "--filter=bindings.members:serviceAccount:*"
    "--flatten=bindings[] 2.members"
    "--flatten=bindings[].members"
    "--format=table(bindings 2.role)"
    "--format=table(bindings.role)"
    "70%"
    "aiduxcare-v2@0.1.0"
    "aiduxcare.mobileconfig"
    "D2[Grabación"
    "K[Selección"
    "L[Generación"
    "eslint"
    "firebase"
    "npm"
    "tsx"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "./$file" ] || [ -d "./$file" ]; then
        rm -rf -- "./$file"
        echo -e "${YELLOW}  Eliminado: $file${NC}"
    fi
done
echo -e "${GREEN}✅ Fase 1 completada${NC}"
echo ""

# Fase 2: Mover backups de configuración
echo "📦 Fase 2: Moviendo backups de configuración..."
CONFIG_BACKUPS=(
    "package-lock 2.json"
    "vite.config.ts.backup"
    "vite.config.backup.20251113-224219"
    "vite.config.working.js"
    "vite.config.minimal.js"
    "vite.config.minimal.ts"
    "vite.config.https.ts"
    "vite-simple.config.js"
)

for file in "${CONFIG_BACKUPS[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "backups/configs/"
        echo -e "${YELLOW}  Movido a backups/configs/: $file${NC}"
    fi
done

# Arreglar tsconfig.node.json con espacio
if [ -f "tsconfig.node.json " ]; then
    mv "tsconfig.node.json " "backups/configs/tsconfig.node.json.backup"
    echo -e "${YELLOW}  Movido: tsconfig.node.json (con espacio)${NC}"
fi
echo -e "${GREEN}✅ Fase 2 completada${NC}"
echo ""

# Fase 3: Mover scripts a carpetas organizadas
echo "📜 Fase 3: Organizando scripts..."

# Scripts de build
BUILD_SCRIPTS=(
    "BUILD_AND_SERVE.sh"
    "TEST_BUILD_SIMPLE.sh"
    "DEPLOY_FIXED.sh"
)

for script in "${BUILD_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/build/"
        echo -e "${YELLOW}  Movido a scripts/build/: $script${NC}"
    fi
done

# Scripts de fix
FIX_SCRIPTS=(
    "FIX_DEV_HANG.sh"
    "FIX_HANGING_PROCESSES.sh"
    "fix_complete_system.sh"
    "fix_manual.sh"
    "fix_mapping.sh"
    "fix_tests_display.sh"
    "fix_workflow_tab.sh"
    "fix_yellowflags.sh"
    "fix-clinical-component.js"
    "fix-duplicate-imports.sh"
    "fix-workflow-tab-complete.sh"
    "update-clinical-results.sh"
    "update-professional-page.sh"
    "update-workflow-tab.sh"
)

for script in "${FIX_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/fix/"
        echo -e "${YELLOW}  Movido a scripts/fix/: $script${NC}"
    fi
done

# Scripts de cleanup
CLEANUP_SCRIPTS=(
    "CLEAN_AND_FIX.sh"
    "cleanup.sh"
    "cleanup_project.sh"
    "KILL_PROCESSES.sh"
)

for script in "${CLEANUP_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/cleanup/"
        echo -e "${YELLOW}  Movido a scripts/cleanup/: $script${NC}"
    fi
done

# Scripts de test
TEST_SCRIPTS=(
    "RUN_ALL_TESTS.sh"
    "RUN_ALL_DIAGNOSTICS.sh"
    "test-v2-implementation.sh"
    "verify-v2.sh"
)

for script in "${TEST_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/test/"
        echo -e "${YELLOW}  Movido a scripts/test/: $script${NC}"
    fi
done

# Scripts de setup
SETUP_SCRIPTS=(
    "REINSTALL_SAFE.sh"
    "INICIAR_SIN_NPM.sh"
    "INICIAR_VITE_SIN_CONFIG.sh"
)

for script in "${SETUP_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/setup/"
        echo -e "${YELLOW}  Movido a scripts/setup/: $script${NC}"
    fi
done

# Scripts de utilidad
UTILS_SCRIPTS=(
    "insert-validation-metrics.sh"
)

for script in "${UTILS_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "scripts/utils/"
        echo -e "${YELLOW}  Movido a scripts/utils/: $script${NC}"
    fi
done
echo -e "${GREEN}✅ Fase 3 completada${NC}"
echo ""

# Fase 4: Mover documentos a docs/
echo "📚 Fase 4: Organizando documentación..."

# Documentos de troubleshooting
TROUBLESHOOTING_DOCS=(
    "DIAGNOSTICO.md"
    "DIAGNOSTICO_FINAL.md"
    "DIAGNOSTICO_VITE.md"
    "PROBLEMA_NPM.md"
    "CONCLUSIONES_FINALES.md"
    "CONCLUSION_FINAL_COMPLETA.md"
)

for doc in "${TROUBLESHOOTING_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/troubleshooting/"
        echo -e "${YELLOW}  Movido a docs/troubleshooting/: $doc${NC}"
    fi
done

# Documentos de solución
SOLUTION_DOCS=(
    "SOLUCION_COMPLETA.md"
    "SOLUCION_FINAL.md"
    "SOLUCION_FINAL_DEV.md"
    "SOLUCION_EMERGENCIA.md"
    "SOLUCION_ALTERNATIVA.md"
    "SOLUCION_NPM.md"
    "SOLUCION_AUTH_INVALID_CREDENTIALS.md"
)

for doc in "${SOLUTION_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/troubleshooting/"
        echo -e "${YELLOW}  Movido a docs/troubleshooting/: $doc${NC}"
    fi
done

# Documentos de configuración
CONFIG_DOCS=(
    "VONAGE_CREDENTIALS_CHECK.md"
    "VONAGE_NUMBER_CONFIG.md"
    "VONAGE_SECRET_SETUP.md"
    "VONAGE_WEBHOOKS_SETUP.md"
    "VONAGE_WEBHOOKS_URLS.md"
    "WEBHOOKS_CONFIGURATION_STEPS.md"
    "VERIFY_FUNCTION_CREDENTIALS.md"
    "COMO_VERIFICAR_SMS_FIRESTORE.md"
    "VERIFICAR_SMS_ENVIADO.md"
)

for doc in "${CONFIG_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/config/"
        echo -e "${YELLOW}  Movido a docs/config/: $doc${NC}"
    fi
done

# Documentos de deployment
DEPLOYMENT_DOCS=(
    "RESUMEN_BUILD.md"
    "RESUMEN_FINAL_EJECUCION.md"
    "PASOS_DESPUES_REINICIO.md"
    "AUDITORIA_COMPLETA_RESULTADOS.md"
)

for doc in "${DEPLOYMENT_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/deployment/"
        echo -e "${YELLOW}  Movido a docs/deployment/: $doc${NC}"
    fi
done

# Documentos de testing
TESTING_DOCS=(
    "TEST_PATIENT_DATA.md"
)

for doc in "${TESTING_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/testing/"
        echo -e "${YELLOW}  Movido a docs/testing/: $doc${NC}"
    fi
done
echo -e "${GREEN}✅ Fase 4 completada${NC}"
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Organización completada${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resumen:"
echo "  • Archivos temporales eliminados"
echo "  • Backups movidos a backups/configs/"
echo "  • Scripts organizados en scripts/"
echo "  • Documentos organizados en docs/"
echo ""
echo "📋 Próximos pasos manuales:"
echo "  1. Revisar y eliminar duplicados en src/"
echo "  2. Revisar _deprecated/ y _quarantine/"
echo "  3. Consolidar documentación en docs/troubleshooting/"
echo ""
echo "📖 Ver ESTADO_PROYECTO_Y_ORGANIZACION.md para más detalles"

