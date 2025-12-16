#!/bin/bash

# ✅ FASE 1: Feedback System Tests
# Ejecuta todos los tests del sistema de feedback

echo "🧪 Ejecutando tests del sistema de feedback (FASE 1)..."
echo ""

npm run test:run -- \
  src/services/__tests__/feedbackService.test.ts \
  src/components/feedback/__tests__/FeedbackWidget.test.tsx \
  src/components/feedback/__tests__/FeedbackModal.test.tsx \
  --reporter=verbose

echo ""
echo "✅ Tests del sistema de feedback completados"

