import { PromptFactory } from "../core/ai/PromptFactory-v3";
import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import type { PhysicalExamResult } from "../types/vertex-ai";
import { deidentify, reidentify, logDeidentification } from "./dataDeidentificationService";

type NiagaraProxyPayload = {
  text: string;
  lang?: string | null;
  mode?: "live" | "dictation";
  timestamp?: number;
  visitType?: 'initial' | 'follow-up';
  imagingContext?: string; // 🔹 nuevo, opcional
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
const VERTEX_PROXY_URL = 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
const MAX_TRANSCRIPT_CHARS = 6000;

const sanitizeTranscript = (value: string): string => {
  if (!value) return "";
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_TRANSCRIPT_CHARS) {
    return collapsed;
  }
  // Preserve the tail of the transcript (most recent dialogue) when truncating
  return collapsed.slice(collapsed.length - MAX_TRANSCRIPT_CHARS);
};

const callVertexWithPrompt = async (prompt: string, traceId: string) => {
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  imagingContext?: string; // 🔹 nuevo, opcional
}) {
  // ✅ PHIPA COMPLIANCE: De-identify transcript before sending to AI
  let finalPrompt = payload.prompt;
  let identifiersMap = {};
  
  if (payload.transcript && !payload.prompt) {
    // De-identify transcript before processing
    const { deidentifiedText, identifiersMap: map } = deidentify(payload.transcript);
    identifiersMap = map;
    
    // Log deidentification for audit
    await logDeidentification('deidentify', payload.transcript.length, Object.keys(map).length, {
      traceId: payload.traceId,
      service: 'analyzeWithVertexProxy',
    });
    
    const structuredPrompt = PromptFactory.create({
      contextoPaciente: "Paciente en evaluación fisioterapéutica",
      instrucciones: payload.visitType === 'follow-up' 
        ? "Analiza esta visita de seguimiento enfocándote en evaluación de progreso y continuidad clínica."
        : "Analiza la siguiente transcripción y extrae información clínica relevante.",
      transcript: deidentifiedText, // Use de-identified transcript
      professionalProfile: payload.professionalProfile, // Pass professional profile
      visitType: payload.visitType || 'initial', // Pass visit type for prompt customization
      imagingContext: payload.imagingContext, // 🔹 nuevo, opcional (pasa tal cual, puede ser undefined)
    });
    finalPrompt = structuredPrompt;
    
    // ✅ DEV/UAT ONLY: Log prompt para verificar si PDF/imaging context está incluido
    // ⚠️ IMPORTANTE: Desactivar antes de producción para no violar PHI/PHIPA
    if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_PROMPT_LOGGING === 'true') {
      const promptPreview = finalPrompt.length > 2000 
        ? finalPrompt.substring(0, 2000) + '... [truncated]' 
        : finalPrompt;
      
      console.debug('[NIAGARA PROMPT] Raw prompt to Vertex (DEV ONLY):', {
        length: finalPrompt.length,
        hasImagingContext: finalPrompt.includes('[Imaging Context]') || finalPrompt.includes('imaging'),
        hasPatientContext: finalPrompt.includes('[Patient Context]'),
        hasClinicalInstructions: finalPrompt.includes('[Clinical Instructions]'),
        preview: promptPreview
      });
      
      // Buscar indicadores de PDF/imaging en el prompt
      const imagingIndicators = [
        '[Imaging Context]',
        'imaging',
        'radiology',
        'MRI',
        'X-ray',
        'CT scan',
        'ultrasound'
      ];
      const foundIndicators = imagingIndicators.filter(indicator => 
        finalPrompt.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (foundIndicators.length > 0) {
        console.debug('[NIAGARA PROMPT] ✅ Imaging context detected in prompt:', foundIndicators);
      } else {
        console.debug('[NIAGARA PROMPT] ⚠️ No imaging context detected in prompt');
      }
    }
  }
  
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

    const sanitizedTranscript = sanitizeTranscript(text);

    // ✅ PHIPA COMPLIANCE: De-identification is handled in analyzeWithVertexProxy
    const traceIdParts = [
      'ui-niagara',
      `lang:${payload.lang ?? 'unknown'}`,
      `mode:${payload.mode ?? 'live'}`,
      `ts:${payload.timestamp ?? Date.now()}`
    ];

    const response = await analyzeWithVertexProxy({
      action: 'analyze',
      transcript: sanitizedTranscript,
      traceId: traceIdParts.join('|'),
      professionalProfile: payload.professionalProfile, // Pass professional profile
      visitType: payload.visitType || 'initial', // Pass visit type for follow-up specific prompts
      imagingContext: payload.imagingContext, // 🔹 nuevo, opcional
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

    const response = await fetch(VERTEX_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
