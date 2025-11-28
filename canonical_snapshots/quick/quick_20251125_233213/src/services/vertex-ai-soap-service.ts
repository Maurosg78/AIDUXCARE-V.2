/**
 * Vertex AI SOAP Service
 * 
 * Handles SOAP note generation using Vertex AI with differentiated prompts
 * for Initial Assessment vs Follow-up visits.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { buildSOAPPrompt, type SOAPPromptOptions } from '../core/soap/SOAPPromptFactory';
import type { SOAPContext } from '../core/soap/SOAPContextBuilder';
import type { SOAPNote } from '../types/vertex-ai';
import type { SessionType } from './sessionTypeService';

const VERTEX_PROXY_URL = 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';

export interface SOAPGenerationResponse {
  soap: SOAPNote;
  metadata: {
    model: string;
    tokens: {
      input: number;
      output: number;
    };
    timestamp: string;
    visitType: 'initial' | 'follow-up';
  };
}

export interface SOAPGenerationError {
  message: string;
  code: 'vertex_error' | 'parse_error' | 'validation_error' | 'network_error';
  details?: any;
}

/**
 * Generates SOAP note using Vertex AI
 */
export async function generateSOAPNote(
  context: SOAPContext,
  options?: SOAPPromptOptions & { sessionType?: SessionType }
): Promise<SOAPGenerationResponse> {
  try {
    // ✅ Sprint 2A: Build appropriate prompt based on visit type and session type
    const prompt = buildSOAPPrompt(context, options);

    // Call Vertex AI via proxy
    const traceId = `soap-${context.visitType}-${Date.now()}`;
    
    const response = await fetch(VERTEX_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        action: 'generate_soap',
        traceId,
        model: 'gemini-2.0-flash-exp', // Use same model as clinical analysis
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Vertex AI error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Parse Vertex AI response
    const soapNote = parseSOAPResponse(data, context.visitType);

    return {
      soap: soapNote,
      metadata: {
        model: data.model || 'gemini-2.0-flash-exp',
        tokens: {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
        },
        timestamp: new Date().toISOString(),
        visitType: context.visitType,
      },
    };
  } catch (error: any) {
    console.error('[ClinicalNotes Service] Generation failed:', error);
    throw {
      message: error.message || 'Failed to generate SOAP note',
      code: error.code || 'vertex_error',
      details: error,
    } as SOAPGenerationError;
  }
}

/**
 * Parses Vertex AI response into SOAPNote structure
 */
function parseSOAPResponse(
  vertexResponse: any,
  visitType: 'initial' | 'follow-up'
): SOAPNote {
  // Try to extract JSON from response
  let soapData: any = null;

  // Handle different response formats
  if (vertexResponse.soap) {
    soapData = vertexResponse.soap;
  } else if (vertexResponse.text) {
    // Try to parse JSON from text response
    try {
      const jsonMatch = vertexResponse.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        soapData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('[ClinicalNotes Service] Failed to parse JSON from text response');
    }
  } else if (vertexResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
    const text = vertexResponse.candidates[0].content.parts[0].text;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        soapData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('[ClinicalNotes Service] Failed to parse JSON from candidate text');
    }
  }

  // Validate and return structured SOAP note
  if (soapData && typeof soapData === 'object') {
    return {
      subjective: String(soapData.subjective || 'Not documented.'),
      objective: String(soapData.objective || 'Not documented.'),
      assessment: String(soapData.assessment || 'Not documented.'),
      plan: String(soapData.plan || 'Not documented.'),
      additionalNotes: soapData.additionalNotes ? String(soapData.additionalNotes) : undefined,
      followUp: soapData.followUp ? String(soapData.followUp) : undefined,
      precautions: soapData.precautions ? String(soapData.precautions) : undefined,
      referrals: soapData.referrals ? String(soapData.referrals) : undefined,
    };
  }

  // Fallback: return empty structure
  console.warn('[ClinicalNotes Service] Could not parse response, returning empty structure');
  return {
    subjective: 'Unable to generate SOAP note. Please try again or enter manually.',
    objective: '',
    assessment: '',
    plan: '',
  };
}

