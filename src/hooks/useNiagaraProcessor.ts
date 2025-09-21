import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { mapVertexToSpanish } from '../utils/vertexFieldMapper';

let _loggedOnce = false;

export const useNiagaraProcessor = () => {
  const processText = async (text: string) => {
    try {
      if (!_loggedOnce) {
        console.debug('[OK] useNiagaraProcessor.ts integrated');
        _loggedOnce = true;
      }
      
      console.log('Processing text with Vertex AI...');
      const response = await callVertexAI(text);
      
      console.log('Raw Vertex response:', response);
      
      // Extraer y debug los datos
      let vertexData = response.text;
      if (typeof vertexData === 'string') {
        try {
          vertexData = JSON.parse(vertexData);
        } catch (e) {
          console.log('Text is not JSON, using as is');
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
