import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

type NiagaraProxyPayload = {
  text: string;
  lang?: string | null;
  mode?: "live" | "dictation";
  timestamp?: number;
  professionalProfile?: ProfessionalProfile | null;
};

export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<ClinicalAnalysis | null>(null);
  const [soapNote, setSoapNote] = useState<string | null>(null);

  const processText = async (payload: NiagaraProxyPayload | string) => {
    // Handle both string (legacy) and payload object (current) formats
    let text: string;
    let lang: string | null | undefined;
    let mode: "live" | "dictation" | undefined;
    let timestamp: number | undefined;

    if (typeof payload === 'string') {
      // Legacy format: just a string
      text = payload;
    } else {
      // Current format: payload object
      text = payload.text;
      lang = payload.lang;
      mode = payload.mode;
      timestamp = payload.timestamp;
    }

    // Ensure text is a string and not empty
    const textString = typeof text === 'string' ? text : String(text || '');
    if (!textString.trim()) return null;

    setIsAnalyzing(true);
    try {
      const response = await VertexAIServiceViaFirebase.processWithNiagara({
        text: textString,
        lang,
        mode,
        timestamp,
        professionalProfile: typeof payload === 'object' ? payload.professionalProfile : undefined
      });
      console.log("Response from Vertex:", response);
      console.log("Response text:", response?.text);
      const cleaned = normalizeVertexResponse(response);
      console.log("Cleaned response:", cleaned);
      setNiagaraResults(cleaned);
      return cleaned;
    } catch (error) {
      console.error('Error procesando con Niagara:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSOAPNote = async () => {
    if (!niagaraResults) return null;
    const s = niagaraResults;
    const soap = `SOAP Note
S: ${s.motivo_consulta || 'N/A'}
O: Hallazgos: ${s.hallazgos_relevantes?.join(', ') || 'N/A'}
A: ${s.diagnosticos_probables?.join(', ') || 'N/A'}
P: ${s.plan_tratamiento_sugerido?.join(', ') || 'N/A'}`;
    setSoapNote(soap);
    return soap;
  };

  return {
    processText,
    generateSOAPNote,
    niagaraResults,
    soapNote,
    isProcessing: isAnalyzing
  };
};

console.log("[OK] useNiagaraProcessor.ts integrated");
