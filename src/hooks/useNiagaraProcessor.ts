import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
import type { PhysicalExamResult, SOAPNote } from '../types/vertex-ai';

export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<ClinicalAnalysis | null>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  
  const processText = async (text: string) => {
    if (!text?.trim()) return null;
    setIsAnalyzing(true);
    try {
      const response = await VertexAIServiceViaFirebase.processWithNiagara(text);
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
        subjective: niagaraResults.motivo_consulta || 'Paciente refiere síntomas descritos en la transcripción.',
        objective: niagaraResults.hallazgos_clinicos?.join('; ') || 'Pendiente completar evaluación física.',
        assessment: (niagaraResults.diagnosticos_probables || []).join('; ') || 'Diagnóstico en revisión clínica.',
        plan: (niagaraResults.plan_tratamiento_sugerido || []).join('; ') || 'Plan terapéutico a definir en sesión.',
        followUp: 'Revisión en próxima visita o antes si aparecen red flags.',
        precautions: (niagaraResults.red_flags || []).join('; ') || 'Sin banderas rojas críticas.'
      };
      setSoapNote(fallback);
      return fallback;
    }
  };
  
  return {
    processText,
    generateSOAPNote,
    niagaraResults,
    soapNote,
    isProcessing: isAnalyzing
  };
};
