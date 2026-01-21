#!/bin/bash
# Script para eliminar functions duplicadas en us-central1
# ⚠️ SOLO EJECUTAR DESPUÉS DE CONFIRMAR QUE TODO FUNCIONA EN TESTING
#
# Estas functions tienen versiones activas en northamerica-northeast1
# y el código actual usa exclusivamente la región canadiense.

set -e  # Exit on error

echo "🧹 Limpiando functions duplicadas en us-central1..."
echo "⚠️  Estas functions tienen versiones activas en northamerica-northeast1"
echo ""

# Functions duplicadas (100% seguro eliminar)
echo "1/4 Eliminando processWithVertexAI(us-central1)..."
firebase functions:delete processWithVertexAI --region=us-central1 --force || echo "⚠️  Error eliminando processWithVertexAI (puede que ya no exista)"

echo "2/4 Eliminando receiveSMS(us-central1)..."
firebase functions:delete receiveSMS --region=us-central1 --force || echo "⚠️  Error eliminando receiveSMS (puede que ya no exista)"

echo "3/4 Eliminando sendConsentSMS(us-central1)..."
firebase functions:delete sendConsentSMS --region=us-central1 --force || echo "⚠️  Error eliminando sendConsentSMS (puede que ya no exista)"

echo "4/4 Eliminando smsDeliveryReceipt(us-central1)..."
firebase functions:delete smsDeliveryReceipt --region=us-central1 --force || echo "⚠️  Error eliminando smsDeliveryReceipt (puede que ya no exista)"

echo ""
echo "✅ Limpieza completada"
echo "📊 Ahorro estimado: ~$1.60/mes"
echo ""
echo "⚠️  Functions que necesitan investigación (NO eliminadas):"
echo "   - dailyMetricsRollup(us-central1)"
echo "   - updateRealTimeMetrics(us-central1)"
echo "   - 7 functions huérfanas en northamerica-northeast1"
echo ""
echo "📋 Para verificar, ejecuta: firebase functions:list"
