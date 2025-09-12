#!/bin/bash

echo "🔧 Arreglando import en useNiagaraProcessor.ts..."

# Corregir el import
sed -i.bak "s|import { callVertexAI } from '../services/vertex-ai-firebase-function';|import { callVertexAI } from '../services/vertex-ai-service-firebase';|g" src/hooks/useNiagaraProcessor.ts

echo "✅ Import corregido"
echo "🔨 Compilando..."

npm run build

if [ $? -eq 0 ]; then
 echo "✅ Build exitoso"
else
 echo "⚠️ Verificando otros archivos con imports incorrectos..."
 grep -r "vertex-ai-firebase-function" src/ || echo "No hay más referencias"
fi
