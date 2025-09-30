import { useState, useCallback } from 'react';
import ClinicalOrchestrationService from '../services/clinical-orchestration-service';

export const useNiagaraProcessorV2 = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const processTranscript = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('[NiagaraProcessor V2] Iniciando análisis con validación');
      const result = await ClinicalOrchestrationService.analyzeWithValidation(transcript);
      
      setResults(result.data);
      setValidation(result.validation);
      setMetrics(result.metrics);
      
      console.log('[NiagaraProcessor V2] Análisis completo:', {
        valid: result.validation.valid,
        completeness: result.validation.completenessScore,
        autoSelected: result.metrics.autoSelectedCount
      });
      
      return result.data;
    } catch (err) {
      console.error('[NiagaraProcessor V2] Error:', err);
      setError(err instanceof Error ? err.message : 'Error processing transcript');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processTranscript,
    isProcessing,
    results,
    validation,
    metrics,
    error
  };
};

export default useNiagaraProcessorV2;
