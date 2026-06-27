import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import type { PhysicalExamResult } from "../types/vertex-ai";
import { deidentify, reidentify, logDeidentification } from "./dataDeidentificationService";
import { buildAnalysisPrompt } from "../core/ai/markets/buildAnalysisPrompt";
import type { ClinicalAttachment } from '../core/ai/markets/buildAnalysisPrompt';
import { resolveClinicalMarket, type ClinicalMarket } from "@/core/market/resolveClinicalMarket";
import { buildAuthenticatedJsonHeaders } from "./firebaseAuthHeaders";
import { extractMajorMedicalHistory } from "@/core/ai/extractMedicalHistory";
import { extractMedicationMentions, type MedicationMention } from "@/core/ai/extractMedicationMentions";
import {
  createClinicalInputPackage,
  serializeClinicalInputPackage,
} from "@/core/ai/ClinicalInputAssembler";
import {
  detectRedFlags,
  mergeRedFlags,
} from "@/core/clinical/ClinicalRedFlagDetector";

type NiagaraProxyPayload = {
  text: string;
  lang?: string | null;
  mode?: "live" | "dictation";
  timestamp?: number;
  professionalProfile?: ProfessionalProfile | null; // Bloque 4: Agregado para compatibilidad
  visitType?: 'initial' | 'follow-up';
  attachments?: ClinicalAttachment[];
  market?: ClinicalMarket;
};

type VoiceClinicalCategory =
  | 'medication'
  | 'tecartherapy'
  | 'modality'
  | 'exercise_safety'
  | 'flag_criteria'
  | 'rom_norms';

type VoiceClinicalInfoParams = {
  queryText: string;
  category: VoiceClinicalCategory;
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

// ✅ CANADÁ: Vertex AI Proxy en región canadiense (northamerica-northeast1)
// Fallback: Si la función está en us-central1, redirigir a región canadiense
const CLOUD_VERTEX_URL = 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
const VERTEX_PROXY_URL = import.meta.env.DEV ? '/vertexAIProxy' : CLOUD_VERTEX_URL;
const sanitizeTranscript = (value: string): string => {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
};

const callVertexWithPrompt = async (prompt: string, traceId: string) => {
  const headers = await buildAuthenticatedJsonHeaders();
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'analyze',
      prompt,
      traceId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`vertexAIProxy HTTP ${response.status}: ${text}`);
  }
  return response.json();
};

const extractTextField = (data: any): string | null => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.text === 'string') return data.text;
  if (typeof data.summary === 'string') return data.summary;
  if (typeof data.summaryText === 'string') return data.summaryText;
  if (typeof data.answer === 'string') return data.answer;
  if (typeof data.answerText === 'string') return data.answerText;
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  return null;
};

const buildAttachmentAssemblerInput = (attachments: ClinicalAttachment[] | undefined) => {
  if (!attachments || attachments.length === 0) {
    return undefined;
  }

  return attachments.map((attachment, index) => {
    const fallbackId = `attachment-${index + 1}`;
    const attachmentId = typeof (attachment as any).id === 'string'
      ? (attachment as any).id
      : fallbackId;
    const attachmentType = attachment.fileType || 'unknown';
    const attachmentText = attachment.extractedText || '';
    const eligibilityStatus = typeof (attachment as any).patientIdentityStatus === 'string'
      ? (attachment as any).patientIdentityStatus
      : undefined;

    return {
      id: attachmentId,
      type: attachmentType,
      extractedText: attachmentText,
      ...(eligibilityStatus ? { eligibilityStatus } : {}),
    };
  });
};

const buildVoiceSummaryPrompt = (transcript: string, language: 'en' | 'es' | 'fr') => {
  const languageLabel = language === 'es' ? 'Spanish' : language === 'fr' ? 'Canadian French' : 'Canadian English';
  return `You are AiDuxCare's physiotherapy assistant helping a Canadian clinician.
Summarize the following consultation transcript in ${languageLabel} using 3 concise bullet points.
Focus on clinician observations, patient concerns, and safety alerts.
Do NOT include patient identifiers, prescriptions, or dosage instructions.
End with "Review required by clinician.".
Transcript:
"""
${transcript.trim()}
"""`;
};

const buildVoiceClinicalInfoPrompt = (params: VoiceClinicalInfoParams) => {
  const { queryText, category, language, context } = params;
  const languageLabel = language === 'es' ? 'Spanish' : language === 'fr' ? 'Canadian French' : 'Canadian English';

  let topicDescription: string;
  switch (category) {
    case 'medication':
      topicDescription = 'general medication considerations in physiotherapy contexts';
      break;
    case 'tecartherapy':
      topicDescription = 'tecartherapy usage principles for musculoskeletal conditions';
      break;
    case 'modality':
      topicDescription = 'physical modality mechanisms and clinical considerations';
      break;
    case 'exercise_safety':
      topicDescription = 'exercise prescription safety cues for physiotherapy patients';
      break;
    case 'flag_criteria':
      topicDescription = 'red-flag and referral indicators for physiotherapy triage';
      break;
    case 'rom_norms':
      topicDescription = 'functional range of motion norms and clinical interpretation';
      break;
    default:
      topicDescription = 'physiotherapy clinical context';
  }

  const extraContextParts: string[] = [];
  if (context?.medicationName) {
    extraContextParts.push(`Medication focus: ${context.medicationName}`);
  }
  if (context?.conditionOrRegion) {
    extraContextParts.push(`Region/condition focus: ${context.conditionOrRegion}`);
  }
  if (context?.modalityName) {
    extraContextParts.push(`Modality focus: ${context.modalityName}`);
  }
  const extraContext = extraContextParts.length > 0 ? `\nContext: ${extraContextParts.join(' · ')}` : '';

  return `You are AiDuxCare's informational assistant for Canadian physiotherapists.${extraContext}
Provide high-level, evidence-informed context about ${topicDescription}.
Respond in ${languageLabel} with 2-3 short bullet points and finish with a caution sentence about clinical judgment.
Do NOT provide medical prescriptions, doses, or detailed treatment schedules.
Do NOT provide parameter ranges, frequencies, or session counts.
Emphasize that guidance is informational only and requires clinician decision-making.
Query: ${queryText.trim()}`;
};

import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

export async function analyzeWithVertexProxy(payload: {
  action: 'analyze';
  prompt?: string;
  transcript?: string;
  traceId?: string;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
  attachments?: ClinicalAttachment[];
  market?: ClinicalMarket;
}) {
  // ✅ PHIPA COMPLIANCE: De-identify transcript before sending to AI
  let finalPrompt = payload.prompt;
  let identifiersMap = {};
  let preExtractedMajorMedicalHistory: string[] = [];
  let preExtractedMedications: MedicationMention[] = [];
  let deidentifiedTranscript = '';

  if (payload.transcript && !payload.prompt) {
    // De-identify transcript before processing
    const { deidentifiedText, identifiersMap: map } = deidentify(payload.transcript);
    deidentifiedTranscript = deidentifiedText;
    identifiersMap = map;
    const sanitizedTranscript = sanitizeTranscript(deidentifiedText);
    
    // Log deidentification for audit
    await logDeidentification('deidentify', payload.transcript.length, Object.keys(map).length, {
      traceId: payload.traceId,
      service: 'analyzeWithVertexProxy',
    });
    
    // WO-AUTH-GUARD-ONB-DATA-01: Build minimal patient context if consent denied
    // Note: If personalizationFromPatientData is false, contextoPaciente should not include
    // patient history, episodes, or previous visit data - only current session context
    // Bloque 4: Removido @ts-expect-error - usando as any para campos opcionales
    const consent = payload.professionalProfile?.dataUseConsent;
    const usePatientData = consent?.personalizationFromPatientData !== false; // default true if not set
    
    const contextoPaciente = usePatientData 
      ? "Patient undergoing physiotherapy assessment" // Can include history if available
      : "Current session only - no historical data"; // Minimal context per consent
    const normalizedVisitType = payload.visitType || 'initial';
    const resolvedMarket = payload.market || resolveClinicalMarket().market;
    [preExtractedMajorMedicalHistory, preExtractedMedications] = await Promise.all([
      extractMajorMedicalHistory(
        deidentifiedText,
        async (prompt) => {
          const extractionResult = await callVertexWithPrompt(prompt, `major-history-${Date.now()}`);
          const extractionText = extractTextField(extractionResult);
          return extractionText ?? '{}';
        }
      ).catch(() => {
        console.warn('[MajorMedicalHistory] Pre-extraction failed, continuing with main analysis.');
        return [];
      }),
      extractMedicationMentions(
        deidentifiedText,
        async (prompt) => {
          const extractionResult = await callVertexWithPrompt(prompt, `medications-${Date.now()}`);
          const extractionText = extractTextField(extractionResult);
          return extractionText ?? '{}';
        }
      ).catch((err: unknown) => {
        console.warn('[MedicationMentions] Pre-extraction failed:', err instanceof Error ? err.message : err);
        return [];
      }),
    ]);
    const contextualPatientContext = contextoPaciente;
    const attachmentsText = buildAttachmentAssemblerInput(payload.attachments);
    const clinicalInputPackage = createClinicalInputPackage({
      transcript: sanitizedTranscript,
      attachmentsText,
      preExtractedMedications,
      preExtractedMajorHistory: preExtractedMajorMedicalHistory,
      visitType: normalizedVisitType,
      locale: resolvedMarket,
    });
    const compactClinicalInput = serializeClinicalInputPackage(clinicalInputPackage);
    
    const structuredPrompt = buildAnalysisPrompt({
      contextoPaciente: contextualPatientContext,
      transcript: compactClinicalInput,
      professionalProfile: payload.professionalProfile, // Pass professional profile
      visitType: normalizedVisitType, // Pass visit type for prompt customization
      attachments: undefined
    }, {
      market: resolvedMarket,
    });
    finalPrompt = structuredPrompt;
  }
  
  const headers = await buildAuthenticatedJsonHeaders();
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: payload.action,
      prompt: finalPrompt,
      traceId: payload.traceId
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`vertexAIProxy HTTP ${response.status}: ${text}`);
  }
  
  const responseData = await response.json();
  if (preExtractedMajorMedicalHistory.length > 0) {
    responseData.pre_extracted_major_medical_history = preExtractedMajorMedicalHistory;
  }
  if (preExtractedMedications.length > 0) {
    responseData.pre_extracted_medications = preExtractedMedications;
  }
  
  // §1.6 ENGINEERING.md: deterministic red flag fast path — runs on deidentified text
  if (deidentifiedTranscript && typeof responseData.text === 'string') {
    try {
      const stub = {
        medicacion_actual: preExtractedMedications,
        red_flags: [] as string[],
      } as unknown as ClinicalAnalysis;
      const detectedFlags = detectRedFlags(deidentifiedTranscript, stub);
      if (detectedFlags.length > 0) {
        const parsed = JSON.parse(responseData.text) as Record<string, any>;
        const existingFlags: string[] =
          Array.isArray(parsed?.medicolegal_alerts?.red_flags)
            ? (parsed.medicolegal_alerts.red_flags as string[])
            : Array.isArray(parsed?.red_flags)
            ? (parsed.red_flags as string[])
            : [];
        const merged = mergeRedFlags(existingFlags, detectedFlags);
        if (Array.isArray(parsed?.medicolegal_alerts?.red_flags)) {
          parsed.medicolegal_alerts.red_flags = merged;
        } else if (Array.isArray(parsed?.red_flags)) {
          parsed.red_flags = merged;
        }
        responseData.text = JSON.stringify(parsed);
        console.debug('[RedFlagDetector] codes:', detectedFlags.map(f => f.code), 'count:', detectedFlags.length);
      }
    } catch {
      // malformed LLM JSON or detector failure — never block the pipeline
    }
  }

  // ✅ PHIPA COMPLIANCE: Re-identify response if needed
  if (Object.keys(identifiersMap).length > 0 && responseData.text) {
    responseData.text = reidentify(responseData.text, identifiersMap);
    await logDeidentification('reidentify', responseData.text.length, Object.keys(identifiersMap).length, {
      traceId: payload.traceId,
      service: 'analyzeWithVertexProxy',
    });
  }
  
  return responseData;
}

export class VertexAIServiceViaFirebase {
  static async processWithNiagara(payload: NiagaraProxyPayload) {
    // Ensure text is a string
    const text = typeof payload.text === 'string' ? payload.text : String(payload.text || '');
    if (!text || !text.trim()) return null;

    // ✅ PHIPA COMPLIANCE: De-identification is handled in analyzeWithVertexProxy
    const traceIdParts = [
      'ui-niagara',
      `lang:${payload.lang ?? 'unknown'}`,
      `mode:${payload.mode ?? 'live'}`,
      `ts:${payload.timestamp ?? Date.now()}`
    ];

    const response = await analyzeWithVertexProxy({
      action: 'analyze',
      transcript: text,
      traceId: traceIdParts.join('|'),
      professionalProfile: payload.professionalProfile, // Pass professional profile
      visitType: payload.visitType || 'initial', // Pass visit type for follow-up specific prompts
      attachments: payload.attachments, // Pass clinical attachments
      market: payload.market,
    });

    if (response?.error) {
      const { code, message, status } = response.error;
      const error = new Error(message || 'Vertex AI proxy error');
      (error as any).code = code ?? status;
      throw error;
    }

    return response;
  }

  static async generateSOAP(params: {
    transcript: string;
    selectedEntityIds: string[];
    physicalExamResults: PhysicalExamResult[];
    analysis: ClinicalAnalysis;
  }) {
    // Validate physicalExamResults before processing
    if (!params.physicalExamResults || !Array.isArray(params.physicalExamResults)) {
      console.warn('[VertexAIService] physicalExamResults is missing or invalid, using empty array');
      params.physicalExamResults = [];
    }

    // ✅ PHIPA COMPLIANCE: De-identify transcript before sending to AI
    const { deidentifiedText, identifiersMap } = deidentify(params.transcript);
    const traceId = `soap-draft|ts:${Date.now()}`;
    
    // Log deidentification for audit
    await logDeidentification('deidentify', params.transcript.length, Object.keys(identifiersMap).length, {
      traceId,
      service: 'generateSOAP',
    });

    const physicalEvaluationSummary = params.physicalExamResults
      .map((item) => {
        const resultLabel = item.result ? `${item.result}` : 'undocumented';
        const noteSegment = item.notes ? ` — ${item.notes}` : '';
        return `- ${item.testName}: ${resultLabel}${noteSegment}`;
      })
      .join('\n');

    const headers = await buildAuthenticatedJsonHeaders();
    const response = await fetch(VERTEX_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'analyze',
        transcript: deidentifiedText, // Use de-identified transcript
        selectedEntityIds: params.selectedEntityIds,
        physicalExamResults: params.physicalExamResults,
        analysis: params.analysis,
        physicalEvaluationSummary,
        traceId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`vertexAIProxy HTTP ${response.status}: ${text}`);
    }

    const responseData = await response.json();
    
    // ✅ PHIPA COMPLIANCE: Re-identify response if needed
    if (Object.keys(identifiersMap).length > 0 && responseData.text) {
      responseData.text = reidentify(responseData.text, identifiersMap);
      await logDeidentification('reidentify', responseData.text.length, Object.keys(identifiersMap).length, {
        traceId,
        service: 'generateSOAP',
      });
    }

    return responseData;
  }

  static async runVoiceSummary(params: VoiceSummaryParams) {
    if (!params.transcript?.trim()) {
      return null;
    }
    
    // ✅ PHIPA COMPLIANCE: De-identify transcript before building prompt
    const { deidentifiedText, identifiersMap } = deidentify(params.transcript);
    await logDeidentification('deidentify', params.transcript.length, Object.keys(identifiersMap).length, {
      traceId: `voice-summary|lang:${params.language}|ts:${Date.now()}`,
      service: 'runVoiceSummary',
    });
    
    const prompt = buildVoiceSummaryPrompt(deidentifiedText, params.language);
    const traceId = `voice-summary|lang:${params.language}|ts:${Date.now()}`;
    const result = await callVertexWithPrompt(prompt, traceId);
    let summary = extractTextField(result);
    
    // ✅ PHIPA COMPLIANCE: Re-identify summary if needed
    if (summary && Object.keys(identifiersMap).length > 0) {
      summary = reidentify(summary, identifiersMap);
      await logDeidentification('reidentify', summary.length, Object.keys(identifiersMap).length, {
        traceId,
        service: 'runVoiceSummary',
      });
    }
    
    return summary ? summary.trim() : null;
  }

  static async runVoiceClinicalInfo(params: VoiceClinicalInfoParams) {
    if (!params.queryText?.trim()) {
      return null;
    }
    
    // ✅ PHIPA COMPLIANCE: De-identify query text before building prompt
    const { deidentifiedText, identifiersMap } = deidentify(params.queryText);
    const traceId = `voice-clinical-info|cat:${params.category}|lang:${params.language}|ts:${Date.now()}`;
    await logDeidentification('deidentify', params.queryText.length, Object.keys(identifiersMap).length, {
      traceId,
      service: 'runVoiceClinicalInfo',
    });
    
    // Create modified params with de-identified query
    const deidentifiedParams = { ...params, queryText: deidentifiedText };
    const prompt = buildVoiceClinicalInfoPrompt(deidentifiedParams);
    const result = await callVertexWithPrompt(prompt, traceId);
    let answer = extractTextField(result);
    
    // ✅ PHIPA COMPLIANCE: Re-identify answer if needed
    if (answer && Object.keys(identifiersMap).length > 0) {
      answer = reidentify(answer, identifiersMap);
      await logDeidentification('reidentify', answer.length, Object.keys(identifiersMap).length, {
        traceId,
        service: 'runVoiceClinicalInfo',
      });
    }
    
    return answer ? answer.trim() : null;
  }
}

console.log("[OK] vertex-ai-service-firebase.ts integrated with PromptFactory");
