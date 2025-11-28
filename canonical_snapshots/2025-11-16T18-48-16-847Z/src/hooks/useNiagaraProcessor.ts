import { useRef, useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
import type { PhysicalExamResult, SOAPNote } from '../types/vertex-ai';

type NiagaraRequestPayload = {
  text: string;
  lang?: string | null;
  mode?: 'live' | 'dictation';
  timestamp?: number;
};

type VoiceClinicalInfoParams = {
  queryText: string;
  category: 'medication' | 'tecartherapy' | 'modality' | 'exercise_safety' | 'flag_criteria' | 'rom_norms';
  language: 'en' | 'es' | 'fr';
  context?: {
    medicationName?: string;
    conditionOrRegion?: string;
    modalityName?: string;
  };
};

type VoiceSummaryParams = {
  transcript: string;
  language: 'en' | 'es' | 'fr';
};

export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<ClinicalAnalysis | null>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const lastRequestRef = useRef<number>(0);

  const COOLDOWN_MS = 8_000;
  const BACKOFF_DELAYS = [0, 2_000, 5_000];

  const isRateLimitError = (error: unknown) => {
    if (!error) return false;
    const code = (error as any)?.code;
    if (code === 429 || code === 'RESOURCE_EXHAUSTED' || code === 'VERTEX_RATE_LIMIT') {
      return true;
    }
    const message = (error as any)?.message ?? '';
    return typeof message === 'string' && message.toLowerCase().includes('resource exhausted');
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const processText = async (payload: string | NiagaraRequestPayload) => {
    const normalizedPayload: NiagaraRequestPayload =
      typeof payload === 'string'
        ? { text: payload }
        : payload;

    const text = normalizedPayload.text;
    if (!text?.trim()) return null;

    const now = Date.now();
    if (lastRequestRef.current && now - lastRequestRef.current < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now - lastRequestRef.current);
      const seconds = Math.ceil(remaining / 1000);
      const rateLimitError = new Error(
        `Please wait ${seconds} second${seconds === 1 ? '' : 's'} before running a new analysis.`
      );
      (rateLimitError as any).code = 'LOCAL_RATE_LIMIT';
      throw rateLimitError;
    }

    lastRequestRef.current = now;
    setIsAnalyzing(true);
    try {
      let lastError: unknown = null;

      for (let attempt = 0; attempt < BACKOFF_DELAYS.length; attempt += 1) {
        if (attempt > 0) {
          await wait(BACKOFF_DELAYS[attempt]);
        }

        try {
          const response = await VertexAIServiceViaFirebase.processWithNiagara(normalizedPayload);
          console.log('Response from Vertex:', response);
          console.log('Response text:', response?.text);
          const cleaned = normalizeVertexResponse(response);
          console.log('Cleaned response:', cleaned);
          setNiagaraResults(cleaned);
          lastRequestRef.current = Date.now();
          return cleaned;
        } catch (error) {
          lastError = error;
          const shouldRetry = isRateLimitError(error) && attempt < BACKOFF_DELAYS.length - 1;
          if (!shouldRetry) {
            throw error;
          }
        }
      }

      throw lastError ?? new Error('Niagara analysis failed.');
    } catch (error) {
      console.error('Error procesando con Niagara:', error);
      setNiagaraResults(null);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const generateSOAPNote = async (params: {
    selectedEntityIds: string[];
    physicalExamResults: PhysicalExamResult[];
    transcript: string;
  }): Promise<SOAPNote | null> => {
    if (!niagaraResults) return null;
    try {
      const soap = await VertexAIServiceViaFirebase.generateSOAP({
        transcript: params.transcript,
        selectedEntityIds: params.selectedEntityIds,
        physicalExamResults: params.physicalExamResults,
        analysis: niagaraResults
      });
      setSoapNote(soap);
      return soap;
    } catch (error) {
      console.error('Error generando SOAP con Vertex AI:', error);
      const fallback: SOAPNote = {
        subjective:
          niagaraResults.motivo_consulta ||
          niagaraResults.hallazgos_clinicos?.join('; ') ||
          'Patient concerns documented in transcript.',
        objective:
          niagaraResults.hallazgos_clinicos?.join('; ') ||
          'Objective findings pending physical examination.',
        assessment:
          (niagaraResults.red_flags || []).length > 0
            ? `Monitor red flags: ${niagaraResults.red_flags.join('; ')}`
            : 'Assessment pending clinician review.',
        plan: 'Plan to be defined with patient according to provincial standards.',
        followUp: 'Schedule follow-up per Canadian physiotherapy guidelines.',
        precautions:
          (niagaraResults.red_flags || []).join('; ') ||
          'No critical red flags generated by AI.'
      };
      setSoapNote(fallback);
      return fallback;
    }
  };

  const runVoiceSummary = async ({ transcript, language }: VoiceSummaryParams) => {
    if (!transcript?.trim()) return null;
    try {
      const summary = await VertexAIServiceViaFirebase.runVoiceSummary({ transcript, language });
      return summary;
    } catch (error) {
      console.error('Error generating voice summary:', error);
      throw error;
    }
  };

  const runVoiceClinicalInfoQuery = async (params: VoiceClinicalInfoParams) => {
    try {
      const answer = await VertexAIServiceViaFirebase.runVoiceClinicalInfo(params);
      if (!answer) return null;
      return { answerText: answer };
    } catch (error) {
      console.error('Error fetching clinical voice info:', error);
      throw error;
    }
  };
  
  return {
    processText,
    generateSOAPNote,
    runVoiceSummary,
    runVoiceClinicalInfoQuery,
    niagaraResults,
    soapNote,
    isProcessing: isAnalyzing
  };
};
