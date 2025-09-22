import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { mapVertexToSpanish } from '../utils/vertexFieldMapper';
import { generateSchemaConstrainedPrompt } from '../orchestration/prompts/schema-constrained-prompt';

let _loggedOnce = false;

export const useNiagaraProcessor = () => {
  const processText = async (text: string) => {
    try {
      if (!_loggedOnce) {
        console.debug('[OK] useNiagaraProcessor.ts integrated');
        _loggedOnce = true;
      }
      
      console.log('Processing text with Vertex AI...');
      // USAR EL PROMPT ESTRUCTURADO
      const structuredPrompt = generateSchemaConstrainedPrompt(text);
      const response = await callVertexAI(structuredPrompt);
      
            console.log('Raw Vertex response:', response);
      
      // Extract data from response
      let vertexData = response;
      
      // Handle nested text field
      if (response && response.text) {
        vertexData = response.text;
      }
      
      // Try to parse JSON if it's a string
      if (typeof vertexData === 'string') {
        // Check if it looks like JSON
        if (vertexData.trim().startsWith('{')) {
          try {
            // Try to fix truncated JSON
            let jsonStr = vertexData;
            
            // If truncated, try to close it
            if (!jsonStr.trim().endsWith('}')) {
              console.warn('JSON appears truncated, attempting to fix...');
              // Count open braces and close them
              const openBraces = (jsonStr.match(/{/g) || []).length;
              const closeBraces = (jsonStr.match(/}/g) || []).length;
              const openBrackets = (jsonStr.match(/\[/g) || []).length;
              const closeBrackets = (jsonStr.match(/\]/g) || []).length;
              
              // Add missing brackets and braces
              jsonStr += '"]'.repeat(Math.max(0, openBrackets - closeBrackets));
              jsonStr += '}'.repeat(Math.max(0, openBraces - closeBraces));
            }
            
            vertexData = JSON.parse(jsonStr);
            console.log('Successfully parsed JSON');
          } catch (e) {
            console.error('Failed to parse JSON:', e);
            // If can't parse, return empty structure
            return normalizeVertexResponse({});
          }
        }
      }
      
      // DEBUG COMPLETO: Ver TODOS los campos y valores
      console.log('🔍 VERTEX DATA FULL STRUCTURE:');
      console.log('Keys:', Object.keys(vertexData || {}));
      console.log('Full data:', JSON.stringify(vertexData, null, 2));
      
      // Específicamente buscar medicación
      console.log('📊 MEDICATION SEARCH:');
      console.log('current_medications:', vertexData?.current_medications);
      console.log('medications:', vertexData?.medications);
      console.log('medicacion_actual:', vertexData?.medicacion_actual);
      
      // Mapear campos de inglés a español
      const mappedData = mapVertexToSpanish(vertexData);
      console.log('Mapped data:', mappedData);
      
      // Crear estructura esperada
      const structuredResponse = {
        text: JSON.stringify(mappedData)
      };
      
      const cleaned = normalizeVertexResponse(structuredResponse, text);
      console.log('Final cleaned response:', cleaned);
      
      return cleaned;
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  };
  
  return { processText };
};
