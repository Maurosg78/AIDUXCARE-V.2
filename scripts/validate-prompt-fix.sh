#!/bin/bash

# Script de Validación: Prompt Fix Quirúrgico
# Valida que el prompt restaurado es genérico y contiene instrucciones críticas

set -e

PROMPT_FILE="src/core/ai/PromptFactory-Canada.ts"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

echo "🧪 PLAN DE VALIDACIÓN: Prompt Fix Quirúrgico"
echo "============================================================"
echo ""

# ============================================================================
# TEST 1: Validar que NO hay hardcodeos específicos (L4, L5, S1)
# ============================================================================
echo "TEST 1: Validación de Genericidad (NO hardcodeos específicos)"
echo "------------------------------------------------------------"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -q "L4\|L5\|S1" "$PROMPT_FILE"; then
    echo "❌ FAIL: Encontrado hardcodeo específico L4, L5, S1"
    grep -n "L4\|L5\|S1" "$PROMPT_FILE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo "✅ PASS: No contiene hardcodeo L4, L5, S1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

if grep -qi "matt\|proctor\|2019\|laminectomy" "$PROMPT_FILE"; then
    echo "❌ FAIL: Encontrado hardcodeo específico al caso de prueba"
    grep -ni "matt\|proctor\|2019\|laminectomy" "$PROMPT_FILE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo "✅ PASS: No contiene hardcodeos específicos al caso de prueba"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Verificar que contiene instrucciones genéricas
if grep -q "spinal/neural levels\|dermatomes\|myotomes" "$PROMPT_FILE"; then
    echo "✅ PASS: Contiene instrucciones genéricas sobre niveles neurales"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No se encontraron instrucciones genéricas sobre niveles neurales"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# TEST 2: Validar instrucciones sobre Medication Interactions
# ============================================================================
echo "TEST 2: Validación de Medication Interactions (NSAIDs + SSRIs)"
echo "------------------------------------------------------------"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -qi "NSAIDs.*SSRIs\|SSRIs.*NSAIDs\|NSAIDs.*SNRIs\|SNRIs.*NSAIDs" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona NSAIDs + SSRIs/SNRIs"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ FAIL: No menciona NSAIDs + SSRIs/SNRIs (CRÍTICO)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if grep -qi "red_flags.*MUST\|MUST.*red_flags" "$PROMPT_FILE"; then
    echo "✅ PASS: Instrucción clara de que interactions van en red_flags"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No se encontró instrucción explícita MUST para red_flags"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -qi "bleeding\|GI\|gastrointestinal" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona riesgo de bleeding/GI"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No menciona explícitamente riesgo de GI bleeding"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -qi "dosage.*frequency\|frequency.*duration" "$PROMPT_FILE"; then
    echo "✅ PASS: Contiene instrucciones sobre formato de medications"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ FAIL: Falta instrucciones sobre formato de medications"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# ============================================================================
# TEST 3: Validar instrucciones sobre Red Flags
# ============================================================================
echo "TEST 3: Validación de Red Flags Detection"
echo "------------------------------------------------------------"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

RED_FLAGS_FOUND=0

if grep -qi "night pain" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona 'night pain' como red flag"
    RED_FLAGS_FOUND=$((RED_FLAGS_FOUND + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

if grep -qi "weight loss" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona 'weight loss' como red flag"
    RED_FLAGS_FOUND=$((RED_FLAGS_FOUND + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

if grep -qi "age.*65\|65.*trauma" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona criterio 'age >65 + trauma'"
    RED_FLAGS_FOUND=$((RED_FLAGS_FOUND + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

if grep -qi "red_flags\|red flags" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona red_flags array"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ FAIL: No menciona red_flags array"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if grep -qi "legal_exposure\|legal exposure" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona legal_exposure field"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No menciona legal_exposure field"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -qi "clinical concern\|referral urgency\|referral" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona clinical concern y referral urgency"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No menciona explícitamente clinical concern y referral urgency"
    WARNINGS=$((WARNINGS + 1))
fi

if [ $RED_FLAGS_FOUND -lt 2 ]; then
    echo "⚠️  WARNING: Solo se encontraron $RED_FLAGS_FOUND red flags específicos (esperado: ≥2)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# TEST 4: Validar instrucciones sobre Chief Complaint
# ============================================================================
echo "TEST 4: Validación de Chief Complaint Capture"
echo "------------------------------------------------------------"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -qi "anatomical location\|radiation\|temporal evolution" "$PROMPT_FILE"; then
    echo "✅ PASS: Contiene instrucciones sobre captura detallada de chief complaint"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: Instrucciones sobre chief complaint podrían ser más específicas"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -qi "intensity.*scale\|active symptoms" "$PROMPT_FILE"; then
    echo "✅ PASS: Menciona intensity scales y active symptoms"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No menciona explícitamente intensity scales"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# TEST 5: Validar instrucciones sobre Physical Tests
# ============================================================================
echo "TEST 5: Validación de Physical Tests Instructions"
echo "------------------------------------------------------------"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -qi "anatomical structures\|joint integrity\|functional capacity" "$PROMPT_FILE"; then
    echo "✅ PASS: Contiene instrucciones genéricas sobre physical tests"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ FAIL: Falta instrucciones sobre physical tests"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if grep -qi "Consider assessing\|Consider.*assessing" "$PROMPT_FILE"; then
    echo "✅ PASS: Instrucción de usar 'Consider assessing...' no 'Perform...'"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "⚠️  WARNING: No se encontró instrucción sobre 'Consider assessing...'"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo "============================================================"
echo "📊 RESUMEN DE RESULTADOS"
echo "============================================================"
echo ""
echo "Tests ejecutados: $TOTAL_TESTS"
echo "✅ Tests pasados: $PASSED_TESTS"
echo "❌ Tests fallidos: $FAILED_TESTS"
echo "⚠️  Advertencias: $WARNINGS"
echo ""

if [ $FAILED_TESTS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ TODOS LOS TESTS PASARON - Prompt está listo para producción"
    exit 0
elif [ $FAILED_TESTS -eq 0 ]; then
    echo "⚠️  TESTS PASARON CON ADVERTENCIAS - Revisar warnings"
    exit 0
else
    echo "❌ ALGUNOS TESTS FALLARON - Revisar errores críticos"
    exit 1
fi

