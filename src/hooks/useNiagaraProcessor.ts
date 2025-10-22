import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<ClinicalAnalysis | null>(null);
  const [soapNote, setSoapNote] = useState<string | null>(null);
  
  const processText = async (text: string) => {
    if (!text?.trim()) return null;
    setIsAnalyzing(true);
    try {
      const response = await VertexAIServiceViaFirebase.processWithNiagara(text);
      console.log("Response from Vertex:", response);
      console.log("Response text:", response?.text);
  console.log("[Parser] Successfully parsed after repair", parsed);
      const cleaned = normalizeVertexResponse(response);
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
