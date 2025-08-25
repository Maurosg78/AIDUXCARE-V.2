/**
 * @fileoverview useSoapData Hook - SOAP Generation and Management
 * @version 1.0.0 Enterprise
 * @author AiDuxCare Development Team
 */

import { useState, useEffect, useCallback } from 'react';

import { ClinicalEntity } from '../types/nlp';
import { ClinicalInsight, SOAPGenerationResult } from '../types/clinical-analysis';
import { SOAPGenerationService } from '../services/SOAPGenerationService';

export interface SoapDataState {
  soap: SOAPGenerationResult | null;
  loading: boolean;
  error: string | null;
}

export interface UseSoapDataOptions {
  sessionId: string;
  entities: ClinicalEntity[];
  insights: ClinicalInsight[];
  userId?: string;
  autoGenerate?: boolean;
}

/**
 * Hook for generating and managing SOAP data from clinical entities and insights
 */
export const useSoapData = ({ 
  sessionId, 
  entities, 
  insights, 
  userId,
  autoGenerate = true 
}: UseSoapDataOptions): SoapDataState & {
  generateSoap: () => Promise<void>;
  clearSoap: () => void;
  refresh: () => Promise<void>;
} => {
  const [soap, setSoap] = useState<SOAPGenerationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateSoap = useCallback(async () => {
    if (!entities || entities.length === 0) {
      setError('No hay entidades clínicas disponibles para generar SOAP');
      return;
    }

    if (!insights || insights.length === 0) {
      setError('No hay insights clínicos disponibles para generar SOAP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await SOAPGenerationService.generateSOAP(
        entities,
        insights,
        userId,
        sessionId
      );

      setSoap(result);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar SOAP');
      setLoading(false);
    }
  }, [entities, insights, userId, sessionId]);

  const clearSoap = useCallback(() => {
    setSoap(null);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    await generateSoap();
  }, [generateSoap]);

  // Auto-generate when entities or insights change and autoGenerate is enabled
  useEffect(() => {
    if (autoGenerate && entities.length > 0 && insights.length > 0) {
      generateSoap();
    }
  }, [entities, insights, autoGenerate, generateSoap]);

  return {
    soap,
    loading,
    error,
    generateSoap,
    clearSoap,
    refresh
  };
};

export default useSoapData;
