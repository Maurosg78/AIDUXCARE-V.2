import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { analyzeWithVertexProxy } from '../services/vertex-ai-service-firebase';

// Flag para evitar logs duplicados
let _loggedOnce = false;

export const useNiagaraProcessor = () => {
  const processText = async (text: string) => {
    try {
      if (!_loggedOnce) {
        console.debug('[OK] useNiagaraProcessor.ts integrated');
        _loggedOnce = true;
      }
      
      console.log('Processing text with Vertex AI...');
      const response = await analyzeWithVertexProxy({
        action: 'analyze',
        prompt: text,
        traceId: `trace-${Date.now()}`
      });
      
      console.log('Response from Vertex:', response);
      console.log('Response text:', response.text);
      
      // Pasar el texto original al normalizador para aplicar guardrail
      const cleaned = normalizeVertexResponse(response, text);
      console.log('Cleaned response:', cleaned);
      
      return cleaned;
    } catch (error) {
      console.error('Error processing text:', error);
      throw error;
    }
  };
  
  return { processText };
};
