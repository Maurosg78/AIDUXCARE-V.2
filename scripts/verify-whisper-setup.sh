#!/bin/bash

# Script de verificación - Whisper Cloud Function Setup
# Ejecuta este script para verificar que todo está configurado correctamente

echo "=================================================="
echo "🔍 VERIFICACIÓN WHISPER CLOUD FUNCTION"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de checks
PASSED=0
FAILED=0

# ==================================================
# CHECK 1: Firebase CLI instalado
# ==================================================
echo "CHECK 1: Firebase CLI..."
if command -v firebase &> /dev/null; then
    echo -e "${GREEN}✅ Firebase CLI instalado${NC}"
    firebase --version
    ((PASSED++))
else
    echo -e "${RED}❌ Firebase CLI NO instalado${NC}"
    echo "   Instalar: npm install -g firebase-tools"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 2: Logged in Firebase
# ==================================================
echo "CHECK 2: Firebase login..."
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✅ Logged in Firebase${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ NO logged in Firebase${NC}"
    echo "   Ejecutar: firebase login"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 3: Carpeta functions existe
# ==================================================
echo "CHECK 3: Carpeta functions..."
if [ -d "functions" ]; then
    echo -e "${GREEN}✅ Carpeta functions existe${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Carpeta functions NO existe${NC}"
    echo "   Ejecutar: firebase init functions"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 4: whisperProxy.js existe
# ==================================================
echo "CHECK 4: Archivo whisperProxy.js..."
if [ -f "functions/src/whisperProxy.js" ]; then
    echo -e "${GREEN}✅ whisperProxy.js existe${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ whisperProxy.js NO existe${NC}"
    echo "   Copiar whisperProxy.js a functions/src/"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 5: Dependencias instaladas
# ==================================================
echo "CHECK 5: Dependencias npm..."
if [ -f "functions/package.json" ]; then
    if grep -q "form-data" functions/package.json && grep -q "node-fetch" functions/package.json; then
        echo -e "${GREEN}✅ Dependencias form-data y node-fetch en package.json${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Faltan dependencias en package.json${NC}"
        echo "   Ejecutar en functions/: npm install form-data node-fetch@2"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ functions/package.json NO existe${NC}"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 6: OpenAI API Key configurada
# ==================================================
echo "CHECK 6: OpenAI API Key en Firebase..."
if firebase functions:config:get openai &> /dev/null; then
    echo -e "${GREEN}✅ OpenAI config existe${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  OpenAI config NO configurada${NC}"
    echo "   Ejecutar: firebase functions:config:set openai.key=\"sk-proj-...\""
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 7: FirebaseWhisperService.ts existe
# ==================================================
echo "CHECK 7: FirebaseWhisperService.ts..."
if [ -f "src/services/FirebaseWhisperService.ts" ]; then
    echo -e "${GREEN}✅ FirebaseWhisperService.ts existe${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FirebaseWhisperService.ts NO existe${NC}"
    echo "   Copiar FirebaseWhisperService.ts a src/services/"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 8: useTranscript.ts modificado
# ==================================================
echo "CHECK 8: useTranscript.ts modificado..."
if [ -f "src/hooks/useTranscript.ts" ]; then
    if grep -q "FirebaseWhisperService" src/hooks/useTranscript.ts; then
        echo -e "${GREEN}✅ useTranscript.ts usa FirebaseWhisperService${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ useTranscript.ts NO modificado${NC}"
        echo "   Modificar según INSTRUCCIONES_MODIFICAR_useTranscript.md"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ useTranscript.ts NO existe${NC}"
    ((FAILED++))
fi
echo ""

# ==================================================
# CHECK 9: firebase.ts exporta functions
# ==================================================
echo "CHECK 9: firebase.ts exporta functions..."
if [ -f "src/lib/firebase.ts" ]; then
    if grep -q "export const functions" src/lib/firebase.ts && grep -q "getFunctions" src/lib/firebase.ts; then
        echo -e "${GREEN}✅ firebase.ts exporta functions${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ firebase.ts NO exporta functions${NC}"
        echo "   Agregar getFunctions y export const functions"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ src/lib/firebase.ts NO existe${NC}"
    ((FAILED++))
fi
echo ""

# ==================================================
# RESUMEN
# ==================================================
echo "=================================================="
echo "📊 RESUMEN"
echo "=================================================="
echo -e "Checks pasados: ${GREEN}$PASSED${NC}"
echo -e "Checks fallidos: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todo listo para deploy!${NC}"
    echo ""
    echo "Próximo paso:"
    echo "  firebase deploy --only functions:whisperProxy"
else
    echo -e "${RED}⚠️  Hay $FAILED checks fallidos${NC}"
    echo ""
    echo "Revisa los errores arriba y corrígelos antes de deploy"
fi
echo ""

