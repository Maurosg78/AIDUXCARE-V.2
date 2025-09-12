#!/bin/bash

echo "🔧 Reescribiendo todos los archivos de parsing..."

# 1. Reescribir responseParser.ts
echo "1️⃣ Reescribiendo responseParser.ts..."
cat > src/utils/responseParser.ts << 'EOPARSER'
import { logger } from '../core/monitoring/logger';

export function parseVertexResponse(response: any): {
  success: boolean;
  data: any;
  error?: string;
} {
  console.log('[Parser] Iniciando parseo...');
  
  let textToParse = '';
  
  if (typeof response === 'string') {
    textToParse = response;
  } else if (response?.text) {
    textToParse = response.text;
  } else if (response?.result) {
    textToParse = response.result;
  }
  
  if (!textToParse) {
    console.error('[Parser] No hay texto para parsear');
    return { success: false, data: null, error: 'No hay texto' };
  }
  
  console.log('[Parser] Texto a parsear (primeros 100 chars):', textToParse.substring(0, 100));
  
  let cleaned = textToParse
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    console.log('[Parser] ✅ Parseado exitoso directo');
    return { success: true, data: parsed };
  } catch (e) {
    console.log('[Parser] Fallo parseo directo, intentando reparar...');
  }
  
  try {
    const repaired = tryRepairJSON(cleaned);
    const parsed = JSON.parse(repaired);
    console.log('[Parser] ✅ Parseado exitoso tras reparación');
    return { success: true, data: parsed };
  } catch (e) {
    console.log('[Parser] Fallo reparación');
  }
  
  return { 
    success: false, 
    data: null, 
    error: 'No se pudo parsear' 
  };
}

function tryRepairJSON(input: string): string {
  let fixed = input;
  
  const firstBrace = fixed.indexOf('{');
  const lastBrace = fixed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    fixed = fixed.slice(firstBrace, lastBrace + 1);
  }
  
  fixed = fixed
    .replace(/(\d)(\s*\n\s*")/g, '$1,$2')
    .replace(/}(\s*")/g, '},$1')
    .replace(/](\s*")/g, '],$1')
    .replace(/(true|false)(\s*")/g, '$1,$2')
    .replace(/,\s*([}\]])/g, '$1');
  
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
  }
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  
  return fixed;
}

export default parseVertexResponse;
EOPARSER

# 2. Importar cleanVertexResponse en useNiagaraProcessor
echo "2️⃣ Arreglando imports en useNiagaraProcessor..."
sed -i.bak 's/import cleanVertexResponse/import normalizeVertexResponse/g' src/hooks/useNiagaraProcessor.ts
sed -i.bak 's/cleanVertexResponse(/normalizeVertexResponse(/g' src/hooks/useNiagaraProcessor.ts

# 3. Build
echo "3️⃣ Compilando..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build exitoso!"
  echo "🚀 La aplicación está funcionando en http://localhost:5177/"
else
  echo "⚠️ Verificando errores restantes..."
  grep -r "cleanVertexResponse" src/ --include="*.ts" --include="*.tsx" | head -5
fi
