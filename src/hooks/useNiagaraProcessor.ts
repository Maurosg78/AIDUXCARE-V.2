import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
import { useProfessionalProfile } from './useProfessionalProfile';

export const useNiagaraProcessor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [niagaraResults, setNiagaraResults] = useState<ClinicalAnalysis | null>(null);
  const [soapNote, setSoapNote] = useState<string | null>(null);
  const { profile, currentUser } = useProfessionalProfile();
  
  const processText = async (text: string) => {
    if (!text?.trim()) return null;
    setIsAnalyzing(true);
    try {
      // Perfil desde users/{uid} - single source of truth
      // useProfessionalProfile ya garantiza que viene de users/{uid}
      const userProfile = profile && currentUser?.uid 
        ? { 
            practicePreferences: (profile as any).practicePreferences,
            dataUseConsent: (profile as any).dataUseConsent,
            registrationStatus: (profile as any).registrationStatus,
            uid: profile.uid
          }
        : null;
      
      const response = await VertexAIServiceViaFirebase.processWithNiagara(text, userProfile);
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
