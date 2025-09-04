import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { cleanVertexResponse } from '../utils/cleanVertexResponse';

export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<any>(null);

  const processText = async (text: string) => {
    if (!text?.trim()) return null;

    setIsAnalyzing(true);
    try {
      const response = await VertexAIServiceViaFirebase.processWithNiagara(text);
      console.log('Respuesta RAW de Vertex:', response);
      
      const cleanedResponse = cleanVertexResponse(response);
      console.log('Respuesta LIMPIA:', cleanedResponse);
      
      // CRITICAL: Si no hay entidades, es un fallo grave
      if (!cleanedResponse.entities || cleanedResponse.entities.length === 0) {
        console.error('❌ VERTEX AI FALLÓ - Devolvió 0 entidades para un caso complejo');
        
        // En lugar de usar un parser local, devolver un error claro
        const errorResponse = {
          entities: [{
            id: 'error-1',
            text: 'Error: El sistema no pudo procesar esta transcripción',
            type: 'error',
            clinicalRelevance: 'critical'
          }],
          redFlags: [{
            pattern: 'Procesamiento fallido',
            action: 'Revisar manualmente la transcripción y contactar soporte técnico'
          }],
          yellowFlags: ['Sistema requiere revisión manual'],
          physicalTests: ['Evaluación completa manual requerida'],
          rawResponse: JSON.stringify({
            error: 'Vertex AI returned empty response',
            transcript_length: text.length,
            timestamp: new Date().toISOString()
          })
        };
        
        setNiagaraResults(errorResponse);
        return errorResponse;
      }
      
      const cleanedEntities = cleanedResponse.entities.filter(e => 
        e && e.text && e.text !== 'undefined'
      );
      console.log('Entidades después de limpieza:', cleanedEntities);
      
      cleanedResponse.entities = cleanedEntities;
      setNiagaraResults(cleanedResponse);
      return cleanedResponse;
      
    } catch (error) {
      console.error('Error procesando con Niagara:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    processText,
    generateSOAPNote: async () => null,
    niagaraResults,
    soapNote: null,
    isProcessing: isAnalyzing
  };
};
