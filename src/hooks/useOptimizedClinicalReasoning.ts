import { useState, useCallback } from 'react';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { TokenManager } from '../core/prompts/TokenManager';
import { ReasoningEvaluator } from '../core/evaluation/ReasoningEvaluator';
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';

export const useOptimizedClinicalReasoning = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [progressInfo, setProgressInfo] = useState<string>('');

  const analyzeWithOptimization = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return null;
    
    setIsProcessing(true);
    try {
      // Estimar tokens
      const estimatedTokens = TokenManager.estimateTokens(transcript);
      console.log(`📝 Transcripción: ${transcript.length} chars (~${estimatedTokens} tokens)`);
      
      // Procesar transcripción larga
      const processed = TokenManager.processLongTranscript(transcript);
      
      if (processed.segments.length > 1) {
        console.log(`🔄 Dividido en ${processed.segments.length} segmentos`);
        setProgressInfo(`Procesando transcripción larga: ${processed.segments.length} segmentos`);
      }
      
      // Si hay hallazgos críticos inmediatos, mostrarlos
      if (processed.criticalFindings.length > 0) {
        console.log('🚨 Hallazgos críticos detectados:', processed.criticalFindings);
      }
      
      let allFindings = {
        redFlags: [],
        entities: [],
        yellowFlags: [],
        physicalTests: []
      };
      
      // Procesar cada segmento
      for (let i = 0; i < Math.min(processed.segments.length, 3); i++) {
        setProgressInfo(`Analizando segmento ${i + 1}/${processed.segments.length}`);
        
        const prompt = TokenManager.generateOptimizedPrompt(
          processed.segments[i],
          i > 0 ? allFindings : undefined
        );
        
        const response = await callVertexAI(prompt);
        const normalized = normalizeVertexResponse(response);
        
        // Acumular hallazgos sin duplicar
        allFindings = mergeFindings(allFindings, normalized);
      }
      
      // Evaluar resultado final
      const eval_result = ReasoningEvaluator.evaluate(allFindings, transcript);
      setEvaluation(eval_result);
      
      setProgressInfo('');
      
      return {
        analysis: allFindings,
        evaluation: eval_result,
        metadata: {
          totalTokens: estimatedTokens,
          segments: processed.segments.length,
          criticalFindings: processed.criticalFindings.length
        }
      };
      
    } catch (error) {
      console.error('Error:', error);
      setProgressInfo('');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Función helper para combinar hallazgos sin duplicar
  const mergeFindings = (existing: any, newFindings: any) => {
    const merged = {
      redFlags: [...new Set([...existing.redFlags, ...newFindings.redFlags])],
      entities: mergeEntities(existing.entities, newFindings.entities),
      yellowFlags: [...new Set([...existing.yellowFlags, ...newFindings.yellowFlags])],
      physicalTests: mergeTests(existing.physicalTests, newFindings.physicalTests)
    };
    return merged;
  };
  
  const mergeEntities = (existing: any[], newEntities: any[]) => {
    const seen = new Set(existing.map(e => `${e.type}-${e.name}`));
    const merged = [...existing];
    
    newEntities.forEach(entity => {
      const key = `${entity.type}-${entity.name}`;
      if (!seen.has(key)) {
        merged.push(entity);
        seen.add(key);
      }
    });
    
    return merged;
  };
  
  const mergeTests = (existing: any[], newTests: any[]) => {
    const seen = new Set(existing.map(t => t.name));
    const merged = [...existing];
    
    newTests.forEach(test => {
      if (!seen.has(test.name)) {
        merged.push(test);
        seen.add(test.name);
      }
    });
    
    return merged;
  };

  return {
    analyzeWithOptimization,
    isProcessing,
    evaluation,
    progressInfo
  };
};
