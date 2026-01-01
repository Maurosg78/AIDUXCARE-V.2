// @ts-nocheck
/**
 * @fileoverview useProcessedEntities Hook - Clinical Entity Processing
 * @version 1.0.0 Enterprise
 * @author AiDuxCare Development Team
 */

import { useState, useEffect, useCallback } from 'react';

import { ClinicalEntity } from '../types/nlp';
import { ClinicalInsight } from '../types/clinical-analysis';
import { TranscriptProcessor } from '../services/TranscriptProcessor';

export interface ProcessedEntitiesState {
  entities: ClinicalEntity[];
  insights: ClinicalInsight[];
  loading: boolean;
  error: string | null;
}

export interface UseProcessedEntitiesOptions {
  sessionId?: string;
  transcript: string;
  autoProcess?: boolean;
}

/**
 * Hook for processing clinical entities and generating insights from transcriptions
 */
export const useProcessedEntities = ({ 
  transcript, 
  autoProcess = true 
}: UseProcessedEntitiesOptions): ProcessedEntitiesState & {
  processTranscript: () => void;
  clearEntities: () => void;
} => {
  const [entities, setEntities] = useState<ClinicalEntity[]>([]);
  const [insights, setInsights] = useState<ClinicalInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processTranscript = useCallback(() => {
    if (!transcript || transcript.trim().length === 0) {
      setError('No hay transcripción disponible para procesar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract clinical entities
      const extractedEntities = TranscriptProcessor.extractClinicalEntities(transcript);
      
      // Generate clinical insights
      const generatedInsights = TranscriptProcessor.generateClinicalInsights(extractedEntities);

      setEntities(extractedEntities);
      setInsights(generatedInsights);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar entidades clínicas');
      setLoading(false);
    }
  }, [transcript]);

  const clearEntities = useCallback(() => {
    setEntities([]);
    setInsights([]);
    setError(null);
  }, []);

  // Auto-process when transcript changes and autoProcess is enabled
  useEffect(() => {
    if (autoProcess && transcript && transcript.trim().length > 0) {
      processTranscript();
    }
  }, [transcript, autoProcess, processTranscript]);

  return {
    entities,
    insights,
    loading,
    error,
    processTranscript,
    clearEntities
  };
};

export default useProcessedEntities;
