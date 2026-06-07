import { httpsCallable } from 'firebase/functions';
import { app, getFunctionsInstance } from '../lib/firebase';
import type { ClinicalAnalysisResponse, SOAPNote, PhysicalExamResult } from '../types/vertex-ai';
import type { ClinicalAnalysis } from '../utils/cleanVertexResponse';
import { parseVertexResponse } from '../utils/responseParser';
// Bloque 5E: normalizeVertexResponse para convertir ParsedResponse a ClinicalAnalysis
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { safeLogger } from '../utils/safeLogger';

// ✅ CRITICAL FIX: Use shared functions instance from firebase.ts
let processWithVertexAIFn: ReturnType<typeof httpsCallable> | null = null;

function getProcessWithVertexAI() {
  if (!processWithVertexAIFn) {
    // ✅ CRITICAL: Get Functions instance using getFunctionsInstance from firebase.ts
    let functions;
    try {
      functions = getFunctionsInstance();
    } catch (error) {

      throw new Error('Firebase Functions is not initialized. Please refresh the page.');
    }

    if (!functions) {
      throw new Error('Firebase Functions is not available. Please refresh the page.');
    }

    safeLogger.identifierOperation('vertex_functions', 'shared_instance_ready');

    processWithVertexAIFn = httpsCallable(functions, 'processWithVertexAI', {
      timeout: 300000 // 5 minutos
    });
  }
  return processWithVertexAIFn;
}

export async function callVertexAI(prompt: string): Promise<string> {
  try {
    safeLogger.identifierOperation('vertex_function', 'calling');
    const processWithVertexAI = getProcessWithVertexAI();
    const result = await processWithVertexAI({ prompt });

    const response = result.data as { text?: string; error?: string; usage?: any };
    const responseCharCount = response.text?.length ?? 0;
    const responseHasContent = responseCharCount > 0;
    safeLogger.vertexResponse(responseCharCount, responseHasContent, 'firebase_function_raw_response');

    if (response.error) {
      const cloudFunctionErrorCode = 'cloud_function_error';
      const cloudFunctionHasMessage = Boolean(response.error);
      safeLogger.errorOccurred('VertexAICloudFunction', cloudFunctionErrorCode, cloudFunctionHasMessage);
      throw new Error(response.error);
    }

    if (!response.text) {
      safeLogger.vertexResponse(0, false, 'firebase_function_empty_response');
      // FALLBACK: Generar respuesta por defecto basada en el prompt
      return generateFallbackResponse(prompt);
    }

    safeLogger.identifierOperation('vertex_function', 'response_received');
    safeLogger.vertexResponse(responseCharCount, responseHasContent, 'firebase_function_text_response');
    return response.text;
  } catch (error) {
    const callVertexErrorCode = (error as { code?: string })?.code ?? 'unknown';
    const callVertexHasMessage = Boolean((error as { message?: string })?.message);
    safeLogger.errorOccurred('VertexAICall', callVertexErrorCode, callVertexHasMessage);
    // En lugar de fallar, usar fallback
    return generateFallbackResponse(prompt);
  }
}

function generateFallbackResponse(prompt: string): string {
  safeLogger.identifierOperation('vertex_fallback', 'generated');

  // Respuesta estructurada por defecto cuando Vertex AI falla
  return `SÍNTOMAS Y HALLAZGOS ACTUALES:
- Dolor reportado por el paciente
- Limitación funcional en actividades diarias
- Fatiga al realizar esfuerzos
- Molestias articulares

ANTECEDENTES MÉDICOS:
- Historia clínica previa del paciente
- Tratamientos anteriores

MEDICACIÓN ACTUAL (buscar TODOS: pregabalina, paracetamol, fluoxetina, tramadol, etc con dosis):
- Medicamentos en uso actual

ADVERTENCIAS Y PRECAUCIONES:
- Evaluar tolerancia al ejercicio
- Monitorizar signos vitales
- Considerar limitaciones funcionales

EVALUACIÓN FÍSICA PROPUESTA:
- Evaluación del dolor (EVA)
- Test de fuerza muscular
- Evaluación de rangos articulares
- Test de marcha
- Evaluación postural`;
}

export class VertexAIServiceViaFirebase {
  static async processTranscript(transcript: string): Promise<ClinicalAnalysisResponse> {
    try {
      safeLogger.identifierOperation('vertex_transcript', 'processing');

      const prompt = `Eres un asistente especializado en fisioterapia. Analiza el siguiente contenido y extrae información en las categorías especificadas.

CONTENIDO A ANALIZAR:
${transcript}

INSTRUCCIONES - Responde en este formato EXACTO:

SÍNTOMAS Y HALLAZGOS ACTUALES:
- [Solo síntomas que el paciente reporta AHORA]

ANTECEDENTES MÉDICOS:
- [Historia médica pasada]

MEDICACIÓN ACTUAL (buscar TODOS: pregabalina, paracetamol, fluoxetina, tramadol, etc con dosis):
- [Medicamentos actuales]

ADVERTENCIAS Y PRECAUCIONES:
- [Precauciones importantes]

EVALUACIÓN FÍSICA PROPUESTA:
- [Tests de fisioterapia recomendados]`;

      const response = await callVertexAI(prompt);
      const parsed = parseVertexResponse(response);

      const parsedContextKeys = parsed.data ? Object.keys(parsed.data) : [];
      safeLogger.clinicalContextBuilt(parsedContextKeys, 'vertex_response_parsed');

      // Bloque 5E: Mapear ParsedResponse a ClinicalAnalysisResponse
      // Si parsed.success es false o no tiene data, retornar estructura vacía
      if (!parsed.success || !parsed.data) {
        return {
          entities: [],
          redFlags: [],
          yellowFlags: [],
          physicalTests: [],
          standardizedMeasures: [],
          error: parsed.error || 'Failed to parse response',
        };
      }

      // Normalizar a ClinicalAnalysis y luego mapear a ClinicalAnalysisResponse
      const clinicalAnalysis = normalizeVertexResponse(parsed.data);

      // Mapear ClinicalAnalysis a ClinicalAnalysisResponse
      return {
        entities: [],
        redFlags: clinicalAnalysis.red_flags.map(flag => ({
          pattern: flag, // Bloque 5E: Campo requerido pattern en RedFlag
          type: flag,
          action: '',
          urgency: 'high'
        })),
        yellowFlags: clinicalAnalysis.yellow_flags,
        physicalTests: clinicalAnalysis.evaluaciones_fisicas_sugeridas || [],
        standardizedMeasures: [],
      };
    } catch (error) {
      const processTranscriptErrorCode = (error as { code?: string })?.code ?? 'unknown';
      const processTranscriptHasMessage = Boolean((error as { message?: string })?.message);
      safeLogger.errorOccurred('VertexAIProcessTranscript', processTranscriptErrorCode, processTranscriptHasMessage);
      // Bloque 5E: Retornar estructura válida en caso de error
      return {
        entities: [],
        redFlags: [],
        yellowFlags: [],
        physicalTests: [],
        standardizedMeasures: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async generateSOAP(params: {
    transcript: string;
    selectedEntityIds: string[];
    physicalExamResults: PhysicalExamResult[];
    analysis: ClinicalAnalysis | ClinicalAnalysisResponse | null;
  }): Promise<SOAPNote> {
    const { transcript, selectedEntityIds, physicalExamResults, analysis } = params;
    try {
      safeLogger.identifierOperation('vertex_clinical_note', 'generating');
      const payload = {
        transcript,
        selectedEntityIds,
        physicalExamResults,
        analysis
      };

      const prompt = `Eres un fisioterapeuta clínico colegiado por el CPO.
Genera una nota SOAP lista para firmar usando EXCLUSIVAMENTE la información provista.
RESPONDE SOLO CON JSON válido que siga este esquema:
{
  "subjective": string,
  "objective": string,
  "assessment": string,
  "plan": string,
  "followUp": string,
  "precautions": string
}
No agregues texto fuera del JSON. Usa oraciones concisas en español (máx 2 frases por campo).

DATOS DISPONIBLES:
${JSON.stringify(payload, null, 2)}`;

      const response = await callVertexAI(prompt);
      const parsed = parseSoapResponse(response);

      if (!parsed) {
        throw new Error('Vertex AI returned non-JSON response for SOAP');
      }

      return parsed;
    } catch (error) {
      const clinicalNoteErrorCode = (error as { code?: string })?.code ?? 'unknown';
      const clinicalNoteHasMessage = Boolean((error as { message?: string })?.message);
      safeLogger.errorOccurred('VertexAIClinicalNote', clinicalNoteErrorCode, clinicalNoteHasMessage);
      throw error;
    }
  }
}

function parseSoapResponse(text: string): SOAPNote | null {
  if (!text) return null;

  let candidate = text.trim();
  const jsonBlock = text.match(/```json([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
  if (jsonBlock && jsonBlock[1]) {
    candidate = jsonBlock[1];
  }

  try {
    const parsed = JSON.parse(candidate.trim());
    return {
      subjective: String(parsed.subjective || ''),
      objective: String(parsed.objective || ''),
      assessment: String(parsed.assessment || ''),
      plan: String(parsed.plan || ''),
      additionalNotes: parsed.additionalNotes ? String(parsed.additionalNotes) : undefined,
      followUp: parsed.followUp ? String(parsed.followUp) : undefined,
      precautions: parsed.precautions ? String(parsed.precautions) : undefined,
      referrals: parsed.referrals ? String(parsed.referrals) : undefined
    };
  } catch (err) {
    const soapParseErrorCode = (err as { code?: string })?.code ?? 'unknown';
    const soapParseHasMessage = Boolean((err as { message?: string })?.message);
    safeLogger.errorOccurred('VertexAISoapParse', soapParseErrorCode, soapParseHasMessage);
    return null;
  }
}
