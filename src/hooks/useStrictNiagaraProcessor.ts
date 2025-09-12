import { useState, useCallback } from 'react';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { PromptVersions } from '../core/prompts/PromptVersions';
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { StrictCategorizer } from '../utils/StrictCategorizer';
import { StrictEvaluationMatrix } from '../core/prompts/StrictEvaluationMatrix';
import { DynamicScoringSystem } from '../core/prompts/DynamicScoringSystem';

export const useStrictNiagaraProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluationDetails, setEvaluationDetails] = useState<any>(null);

  const processTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return null;
    
    setIsProcessing(true);
    try {
      // 1. Llamar a IA
      const prompt = PromptVersions.getPrompt('v3_structured', transcript, 'en');
      const rawResponse = await callVertexAI(prompt);
      
      // 2. Normalizar respuesta
      const normalized = normalizeVertexResponse(rawResponse);
      
      // 3. Categorizar estrictamente
      const categorized = StrictCategorizer.categorize(normalized);
      
      // 4. Evaluar con criterios estrictos
      const evaluation = StrictEvaluationMatrix.evaluate(categorized, transcript);
      
      // 5. Guardar y recalcular scores dinámicamente
      const savedAnalysis = DynamicScoringSystem.saveAndRecalculate({
        transcript: transcript.substring(0, 200),
        response: categorized,
        evaluation: evaluation,
        version: 'v3_strict'
      });
      
      setEvaluationDetails({
        ...evaluation,
        relativeScore: savedAnalysis.relativeScore,
        ranking: savedAnalysis.ranking,
        metadata: categorized.metadata
      });
      
      console.log(`📊 Score relativo: ${savedAnalysis.relativeScore}/100`);
      console.log(`📋 Metadata:`, categorized.metadata);
      
      return categorized;
      
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
    evaluationDetails
  };
};
