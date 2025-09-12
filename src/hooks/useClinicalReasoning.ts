import { useState, useCallback } from 'react';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { ClinicalReasoningSystem } from '../core/prompts/ClinicalReasoningSystem';
import { ReasoningEvaluator } from '../core/evaluation/ReasoningEvaluator';
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';

export const useClinicalReasoning = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const analyzeWithReasoning = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return null;
    
    setIsProcessing(true);
    try {
      // Prompt que pide razonamiento
      const prompt = ClinicalReasoningSystem.generatePrompt(transcript);
      console.log('�� Solicitando razonamiento clínico...');
      
      // Llamar a IA
      const rawResponse = await callVertexAI(prompt);
      const normalized = normalizeVertexResponse(rawResponse);
      
      // Evaluar razonamiento
      const eval_result = ReasoningEvaluator.evaluate(normalized, transcript);
      setEvaluation(eval_result);
      
      console.log('📊 Evaluación del razonamiento:');
      console.log(`   Score: ${eval_result.score}/100`);
      console.log(`   ✅ Fortalezas: ${eval_result.strengths.join(', ') || 'Ninguna'}`);
      console.log(`   ❌ Gaps: ${eval_result.gaps.join(', ') || 'Ninguno'}`);
      
      return {
        analysis: normalized,
        evaluation: eval_result
      };
      
    } catch (error) {
      console.error('Error en razonamiento:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    analyzeWithReasoning,
    isProcessing,
    evaluation
  };
};
