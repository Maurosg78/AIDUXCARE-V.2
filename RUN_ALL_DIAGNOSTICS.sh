#!/bin/bash
# Ejecutar todos los diagnósticos en orden

cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

echo "🔍 EJECUTANDO SUITE COMPLETA DE DIAGNÓSTICOS"
echo "=============================================="
echo ""
echo "Esto puede tardar varios minutos..."
echo ""

# Capa 1: Sistema básico
echo "═══════════════════════════════════════════════"
echo "CAPA 1: Sistema Básico"
echo "═══════════════════════════════════════════════"
bash scripts/diagnose-system.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "CAPA 2: Node.js y Volta"
echo "═══════════════════════════════════════════════"
bash scripts/diagnose-node.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "CAPA 3: Vite Específico"
echo "═══════════════════════════════════════════════"
bash scripts/diagnose-vite.sh

echo ""
echo "═══════════════════════════════════════════════"
echo "RESUMEN FINAL"
echo "═══════════════════════════════════════════════"
echo ""
echo "✅ Todos los diagnósticos completados"
echo ""
echo "Revisa los resultados arriba para identificar:"
echo "  - Tests que fallaron (❌)"
echo "  - Tests con TIMEOUT"
echo "  - Tests que funcionaron (✅)"
echo ""
echo "La primera capa con problemas es donde está el fallo."

