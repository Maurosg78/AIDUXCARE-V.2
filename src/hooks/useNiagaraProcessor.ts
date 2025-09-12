import { useState, useCallback } from 'react';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { PromptVersions } from '../core/prompts/PromptVersions';
import { ClinicalEvaluationMatrix } from '../core/prompts/EvaluationMatrix';
import { PromptTracker } from '../core/prompts/PromptTracker';
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { ResponseValidator } from '../utils/responseValidator';

export const useNiagaraProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluationScore, setEvaluationScore] = useState<number | null>(null);

  const processTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return null;
    
    setIsProcessing(true);
    try {
      const prompt = PromptVersions.getPrompt('v3_structured', transcript, 'en');
      const rawResponse = await callVertexAI(prompt);
      const normalizedResponse = normalizeVertexResponse(rawResponse);
      
      // Validar y limpiar la respuesta
      const cleanedResponse = ResponseValidator.validateAndClean(normalizedResponse);
      
      const evaluation = ClinicalEvaluationMatrix.evaluate(cleanedResponse, transcript);
      setEvaluationScore(evaluation.score);
      
      PromptTracker.saveAnalysis({
        timestamp: Date.now(),
        transcript: transcript.substring(0, 200),
        response: cleanedResponse,
        score: evaluation.score,
        version: 'v3_structured'
      });
      
      console.log(`✅ Análisis completado - Score: ${evaluation.score}/100`);
      
      return cleanedResponse;
    } catch (error) {
      console.error('[ERROR]:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processTranscript,
    isProcessing,
    evaluationScore
  };
};
