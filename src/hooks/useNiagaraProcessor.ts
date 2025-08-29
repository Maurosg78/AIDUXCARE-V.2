import { useState, useCallback } from 'react';
import { VertexAIServiceViaFirebase } from '../services/VertexAIServiceViaFirebase';
import type { ClinicalAnalysisResponse, SOAPNote, PhysicalExamResult } from '../types/vertex-ai';

interface UseNiagaraProcessorReturn {
  processWithNiagara: (transcript: string) => Promise<void>;
  generateSOAPNote: (selectedEntityIds: string[], physicalExamResults: PhysicalExamResult[]) => Promise<void>;
  processing: boolean;
  results: ClinicalAnalysisResponse | null;
  soapNote: SOAPNote | null;
  error: string | null;
  reset: () => void;
}

export const useNiagaraProcessor = (): UseNiagaraProcessorReturn => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<ClinicalAnalysisResponse | null>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const processWithNiagara = useCallback(async (transcript: string): Promise<void> => {
    if (!transcript || transcript.length < 50) {
      setError('Transcripción muy corta o vacía');
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSoapNote(null);
    console.log('🧠 Procesando con Vertex AI...');
    
    try {
      const data: ClinicalAnalysisResponse = await VertexAIServiceViaFirebase.processTranscript(transcript);
      console.log('✅ Vertex AI procesó:', data);
      setResults(data);
      
      // Alertar si hay banderas rojas críticas
      if (data.redFlags && data.redFlags.length > 0) {
        const urgentFlags = data.redFlags.filter(flag => flag.urgency === 'urgent');
        if (urgentFlags.length > 0) {
          console.warn('🚨 BANDERAS ROJAS URGENTES DETECTADAS:', urgentFlags);
        }
      }
    } catch (err) {
      const errorMessage: string = err instanceof Error ? err.message : 'Error procesando transcripción';
      console.error('❌ Error Vertex AI:', errorMessage);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, []);
  
  const generateSOAPNote = useCallback(async (
    selectedEntityIds: string[], 
    physicalExamResults: PhysicalExamResult[]
  ): Promise<void> => {
    if (!results) {
      setError('No hay resultados de análisis previo');
      return;
    }
    
    if (selectedEntityIds.length === 0) {
      setError('Debe seleccionar al menos un hallazgo');
      return;
    }
    
    setProcessing(true);
    setError(null);
    console.log('📝 Generando nota SOAP...');
    
    try {
      const soap: SOAPNote = await VertexAIServiceViaFirebase.generateSOAP(
        results,
        selectedEntityIds,
        physicalExamResults
      );
      console.log('✅ SOAP generado:', soap);
      setSoapNote(soap);
    } catch (err) {
      const errorMessage: string = err instanceof Error ? err.message : 'Error generando SOAP';
      console.error('❌ Error generando SOAP:', errorMessage);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, [results]);
  
  const reset = useCallback((): void => {
    setResults(null);
    setSoapNote(null);
    setError(null);
    setProcessing(false);
  }, []);
  
  return { 
    processWithNiagara, 
    generateSOAPNote,
    processing, 
    results, 
    soapNote,
    error,
    reset
  };
};
