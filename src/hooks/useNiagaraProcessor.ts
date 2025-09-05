import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { cleanVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';

export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<ClinicalAnalysis | null>(null);
  const [soapNote, setSoapNote] = useState<string | null>(null);

  const processText = async (text: string) => {
    if (!text?.trim()) return null;
    setIsAnalyzing(true);
    try {
      const response = await VertexAIServiceViaFirebase.processWithNiagara(text);
      const cleaned = cleanVertexResponse(response);
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

    const S = `S: ${s.motivo_consulta || 'N/A'}`;
    const O = `O: Evaluaciones sugeridas: ${s.evaluaciones_fisicas_sugeridas.join('; ') || 'N/A'}`;
    const A = `A: Diagnósticos probables: ${s.diagnosticos_probables.join('; ') || 'N/A'}`;
    const P = `P: Plan sugerido: ${s.plan_tratamiento_sugerido.join('; ') || 'N/A'}`;

    const note = [S, O, A, P].join('\n');
    setSoapNote(note);
    return note;
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
