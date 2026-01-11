import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import type { ClinicalAttachment } from '../core/ai/PromptFactory-Canada';

type NiagaraProxyPayload = {
  text: string;
  lang?: string | null;
  mode?: "live" | "dictation";
  timestamp?: number;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
  attachments?: ClinicalAttachment[];
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
      const attachments = typeof payload === 'object' ? payload.attachments : undefined;
      
      // Log attachments for debugging
      if (attachments && attachments.length > 0) {
        console.log(`[NiagaraProcessor] Including ${attachments.length} attachments in prompt`);
        attachments.forEach(att => {
          console.log(`  - ${att.fileName}: ${att.extractedText ? `${att.extractedText.length} chars` : 'no text'}`);
        });
      }
      
      const response = await VertexAIServiceViaFirebase.processWithNiagara({
        text: textString,
        lang,
        mode,
        timestamp,
        professionalProfile: typeof payload === 'object' ? payload.professionalProfile : undefined,
        visitType: typeof payload === 'object' ? payload.visitType : undefined,
        attachments: attachments
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

  // WO-ELIMINATE-PREMATURE-PLAN: DEPRECATED - This function is NOT used in current flow
  // Treatment plan is now generated only after physical examination (second Vertex call in SOAP generation)
  const generateSOAPNote = async () => {
    if (!niagaraResults) return null;
    const s = niagaraResults;
    const soap = `SOAP Note (DEPRECATED - Use SOAP generation in Tab 3 instead)
S: ${s.motivo_consulta || 'N/A'}
O: Hallazgos: ${s.hallazgos_relevantes?.join(', ') || 'N/A'}
A: ${s.diagnosticos_probables?.join(', ') || 'N/A'}
P: Treatment plan requires objective findings from physical examination. Please complete physical evaluation and generate SOAP in Tab 3.`;
    setSoapNote(soap);
    return soap;
  };

  // Function to reset/clear all state (useful for new sessions)
  const reset = () => {
    setNiagaraResults(null);
    setSoapNote(null);
    setIsAnalyzing(false);
  };

  return {
    processText,
    generateSOAPNote,
    niagaraResults,
    soapNote,
    isProcessing: isAnalyzing,
    reset // Export reset function
  };
};

console.log("[OK] useNiagaraProcessor.ts integrated");
