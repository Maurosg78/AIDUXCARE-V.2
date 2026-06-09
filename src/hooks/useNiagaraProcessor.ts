import { useState } from 'react';
import { VertexAIServiceViaFirebase } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse, ClinicalAnalysis } from '../utils/cleanVertexResponse';
import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import type { ClinicalAttachment } from '../core/ai/PromptFactory-Canada';
import { resolveClinicalMarket } from '@/core/market/resolveClinicalMarket';
import { ensureSpanishClinicalAnalysis } from '../utils/normalizers/es/ensureSpanishClinicalAnalysis';
import { lookupEvidence } from '@/core/clinical-evidence/evidenceService';
import { matchDiagnosis } from '@/core/clinical-evidence/diagnosisMatcher';
import { prioritizeEvidence } from '@/core/clinical-reasoning/prioritizeEvidence';
import { applyImagingScopeGuard } from '@/core/clinical-safety/imagingScopeGuard';
import { safeLogger } from '../utils/safeLogger';
import { validateClinicalOutput } from '@/core/clinical/ClinicalOutputValidator';
import type { MedicationMention } from '@/core/ai/extractMedicationMentions';

type NiagaraProxyPayload = {
  text: string;
  lang?: string | null;
  mode?: "live" | "dictation";
  timestamp?: number;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
  attachments?: ClinicalAttachment[];
  orientativeDiagnosis?: string;
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
    let professionalProfile: ProfessionalProfile | null | undefined;
    let orientativeDiagnosis: string | undefined;

    if (typeof payload === 'string') {
      // Legacy format: just a string
      text = payload;
    } else {
      // Current format: payload object
      text = payload.text;
      lang = payload.lang;
      mode = payload.mode;
      timestamp = payload.timestamp;
      professionalProfile = payload.professionalProfile;
      orientativeDiagnosis = payload.orientativeDiagnosis;
    }

    // Ensure text is a string and not empty
    const textString = typeof text === 'string' ? text : String(text || '');
    if (!textString.trim()) return null;

    setIsAnalyzing(true);
    try {
      const attachments = typeof payload === 'object' ? payload.attachments : undefined;
      const resolvedMarket = resolveClinicalMarket();
      
      // Log attachments for debugging
      if (attachments && attachments.length > 0) {
        console.log('[NiagaraProcessor] attachments_included count:', attachments.length);
        attachments.forEach(att => {
          const attachmentExtension = att.fileName.split('.').pop() ?? 'unknown';
          const attachmentSizeBytes = 0;
          const attachmentTextCharCount = att.extractedText?.length ?? 0;
          const attachmentHasText = attachmentTextCharCount > 0;
          safeLogger.fileProcessed(attachmentExtension, attachmentSizeBytes, 'niagara_attachment_included');
          safeLogger.vertexResponse(attachmentTextCharCount, attachmentHasText, 'attachment_text_available');
        });
      }
      
      const response = await VertexAIServiceViaFirebase.processWithNiagara({
        text: textString,
        lang,
        mode,
        timestamp,
        professionalProfile,
        visitType: typeof payload === 'object' ? payload.visitType : undefined,
        attachments: attachments,
        market: resolvedMarket.market,
      });
      const vertexResponseCharCount = response?.text?.length ?? 0;
      const vertexResponseHasContent = vertexResponseCharCount > 0;
      safeLogger.vertexResponse(vertexResponseCharCount, vertexResponseHasContent, 'niagara_raw_response');
      const normalized = normalizeVertexResponse(response, { market: resolvedMarket.market });
      const guarded = applyImagingScopeGuard(normalized, attachments);
      if (import.meta.env.DEV && (guarded.removedImagingItems > 0 || guarded.rescuedMedications > 0)) {
        console.debug('[NiagaraProcessor] Imaging safety post-processing applied', {
          removedImagingItems: guarded.removedImagingItems,
          rescuedMedications: guarded.rescuedMedications,
        });
      }
      const diagnosisText = orientativeDiagnosis ?? '';
      const diagnosisId = matchDiagnosis(diagnosisText);
      const evidence = diagnosisId ? await lookupEvidence(diagnosisId) : null;
      const evidenceRecommendations = evidence
        ? prioritizeEvidence({
          diagnosisEvidence: evidence,
          clinicalAnalysis: guarded.analysis,
          professionalProfile,
        })
        : null;

      guarded.analysis.evidence_recommendations = evidenceRecommendations;

      const shouldForceSpanish = resolvedMarket.market === 'ES';
      const cleaned = shouldForceSpanish ? ensureSpanishClinicalAnalysis(guarded.analysis) : guarded.analysis;
      const cleanedResponseKeys = Object.keys(cleaned ?? {});
      safeLogger.clinicalContextBuilt(cleanedResponseKeys, 'niagara_cleaned_response');

      // §1.6 ENGINEERING.md: deterministic post-model guard — runs after normalization, before UI
      const preExtractedMeds = (response?.pre_extracted_medications ?? []) as MedicationMention[];
      const validationResult = validateClinicalOutput(
        cleaned as unknown as Parameters<typeof validateClinicalOutput>[0],
        preExtractedMeds,
      );
      if (!validationResult.passed) {
        console.warn('[NiagaraProcessor] Clinical validation failed:', validationResult.issues.map(i => i.code));
      }

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
