import { useState, useCallback } from 'react';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { ControlledReasoningSystem } from '../core/prompts/ControlledReasoningSystem';
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { useLanguage } from '../contexts/LanguageContext';

export const useControlledReasoning = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reasoningQuality, setReasoningQuality] = useState<any>(null);
  const { language } = useLanguage();

  const analyzeWithControlledReasoning = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return null;
    
    setIsProcessing(true);
    try {
      const prompt = ControlledReasoningSystem.generateControlledPrompt(transcript);
      
      // Logs en el idioma actual
      if (language === 'es') {
        console.log('🧠 Permitiendo razonamiento controlado...');
        console.log(`📏 Longitud del prompt: ${prompt.length} caracteres`);
      } else {
        console.log('🧠 Allowing controlled reasoning...');
        console.log(`📏 Prompt length: ${prompt.length} chars`);
      }
      
      const response = await callVertexAI(prompt);
      const normalized = normalizeVertexResponse(response);
      
      const validation = ControlledReasoningSystem.validateReasoning(normalized);
      setReasoningQuality(validation);
      
      if (language === 'es') {
        console.log('📊 Calidad del razonamiento:', validation.quality);
        if (normalized.reasoning) {
          console.log('🔍 Razonamiento clínico de la IA:');
          console.log(normalized.reasoning);
        }
      } else {
        console.log('📊 Reasoning quality:', validation.quality);
        if (normalized.reasoning) {
          console.log('🔍 AI clinical reasoning:');
          console.log(normalized.reasoning);
        }
      }
      
      return {
        analysis: normalized,
        quality: validation,
        hasReasoning: validation.hasReasoning
      };
      
    } catch (error) {
      console.error(language === 'es' ? 'Error en razonamiento:' : 'Reasoning error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [language]);

  return {
    analyzeWithControlledReasoning,
    isProcessing,
    reasoningQuality
  };
};
