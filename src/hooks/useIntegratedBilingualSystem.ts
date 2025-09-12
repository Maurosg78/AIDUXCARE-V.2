import { useState, useCallback } from 'react';
import { BilingualSystem } from '../core/i18n/BilingualSystem';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { useLanguage } from '../contexts/LanguageContext';

export const useIntegratedBilingualSystem = () => {
  const { language: uiLanguage } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  
  const processTranscript = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      // 1. Generar prompt en idioma correcto
      const prompt = BilingualSystem.generatePrompt(transcript);
      
      // 2. Llamar a IA
      const { text } = await callVertexAI(prompt);
      const aiResponse = JSON.parse(text);
      
      // 3. Procesar y limpiar respuesta
      const processed = BilingualSystem.processAIResponse(aiResponse, uiLanguage);
      
      // 4. Formatear para UI
      const formatted = {
        redFlags: processed.redFlags,
        yellowFlags: processed.yellowFlags,
        entities: [
          ...processed.symptoms.map((s, i) => ({
            id: `symptom-${i}`,
            text: s,
            type: 'symptom'
          })),
          ...processed.medications.map((m, i) => ({
            id: `med-${i}`,
            text: m,
            type: 'medication'
          }))
        ],
        physicalTests: processed.physicalTests
      };
      
      setResults(formatted);
      return formatted;
      
    } catch (error) {
      console.error('Error processing transcript:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [uiLanguage]);
  
  return {
    processTranscript,
    isProcessing,
    results
  };
};
