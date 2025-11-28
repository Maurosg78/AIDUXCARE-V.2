import { PromptFactory } from "../core/ai/PromptFactory-v3";
import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import type { PhysicalExamResult } from "../types/vertex-ai";

type NiagaraProxyPayload = {
  text: string;
  lang?: string | null;
  mode?: "live" | "dictation";
  timestamp?: number;
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

export async function analyzeWithVertexProxy(payload: {
  action: 'analyze';
  prompt?: string;
  transcript?: string;
  traceId?: string;
}) {
  // Si hay transcript, construir prompt con esquema JSON
  let finalPrompt = payload.prompt;
  if (payload.transcript && !payload.prompt) {
    const structuredPrompt = PromptFactory.create({
      contextoPaciente: "Paciente en evaluación fisioterapéutica",
      instrucciones: "Analiza la siguiente transcripción y extrae información clínica relevante.",
      transcript: payload.transcript
    });
    finalPrompt = structuredPrompt;
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
  return response.json();
}

export class VertexAIServiceViaFirebase {
  static async processWithNiagara(payload: NiagaraProxyPayload) {
    // Ensure text is a string
    const text = typeof payload.text === 'string' ? payload.text : String(payload.text || '');
    if (!text || !text.trim()) return null;

    const sanitizedTranscript = sanitizeTranscript(text);

    const traceIdParts = [
      'ui-niagara',
      `lang:${payload.lang ?? 'unknown'}`,
      `mode:${payload.mode ?? 'live'}`,
      `ts:${payload.timestamp ?? Date.now()}`
    ];

    const response = await analyzeWithVertexProxy({
      action: 'analyze',
      transcript: sanitizedTranscript,
      traceId: traceIdParts.join('|')
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
        action: 'generate_soap',
        transcript: params.transcript,
        selectedEntityIds: params.selectedEntityIds,
        physicalExamResults: params.physicalExamResults,
        analysis: params.analysis,
        physicalEvaluationSummary,
        traceId: `soap-draft|ts:${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`vertexAIProxy HTTP ${response.status}: ${text}`);
    }

    return response.json();
  }

  static async runVoiceSummary(params: VoiceSummaryParams) {
    if (!params.transcript?.trim()) {
      return null;
    }
    const prompt = buildVoiceSummaryPrompt(params.transcript, params.language);
    const traceId = `voice-summary|lang:${params.language}|ts:${Date.now()}`;
    const result = await callVertexWithPrompt(prompt, traceId);
    const summary = extractTextField(result);
    return summary ? summary.trim() : null;
  }

  static async runVoiceClinicalInfo(params: VoiceClinicalInfoParams) {
    if (!params.queryText?.trim()) {
      return null;
    }
    const prompt = buildVoiceClinicalInfoPrompt(params);
    const traceId = `voice-clinical-info|cat:${params.category}|lang:${params.language}|ts:${Date.now()}`;
    const result = await callVertexWithPrompt(prompt, traceId);
    const answer = extractTextField(result);
    return answer ? answer.trim() : null;
  }
}

console.log("[OK] vertex-ai-service-firebase.ts integrated with PromptFactory");
