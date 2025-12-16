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
import { validateSOAP, truncateSOAPToLimits } from '../utils/soapValidation';
import { deidentify, reidentify, logDeidentification } from './dataDeidentificationService';

// ✅ CANADÁ: Vertex AI Proxy en región canadiense (northamerica-northeast1)
const VERTEX_PROXY_URL = 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';

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
    analysisLevel?: 'full' | 'optimized'; // ✅ WORKFLOW OPTIMIZATION
    tokenOptimization?: {
      optimizedTokens: number;
      standardTokens: number;
      reduction: number;
      reductionPercent: number;
    };
    validation?: {
      totalCharacters: number;
      isValid: boolean;
      hasRepetition: boolean;
    };
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
  options?: SOAPPromptOptions & { 
    sessionType?: SessionType;
    analysisLevel?: 'full' | 'optimized'; // ✅ WORKFLOW OPTIMIZATION
  }
): Promise<SOAPGenerationResponse> {
  try {
    // ✅ PHIPA COMPLIANCE: De-identify transcript before building prompt
    const { deidentifiedText, identifiersMap } = deidentify(context.transcript);
    const traceId = `soap-${context.visitType}-${Date.now()}`;
    
    // Log deidentification for audit
    await logDeidentification('deidentify', context.transcript.length, Object.keys(identifiersMap).length, {
      traceId,
      service: 'generateSOAPNote',
    });
    
    // Create de-identified context
    const deidentifiedContext: SOAPContext = {
      ...context,
      transcript: deidentifiedText,
    };
    
    // ✅ WORKFLOW OPTIMIZATION: Use optimized prompt if analysisLevel is 'optimized'
    const useOptimized = options?.analysisLevel === 'optimized';
    const promptOptions: SOAPPromptOptions = {
      ...options,
      useOptimizedPrompt: useOptimized,
    };
    
    // ✅ Sprint 2A: Build appropriate prompt based on visit type and session type
    const prompt = buildSOAPPrompt(deidentifiedContext, promptOptions);
    
    // ✅ WORKFLOW OPTIMIZATION: Calculate token optimization if using optimized prompt
    let tokenOptimization;
    if (useOptimized && context.visitType === 'follow-up') {
      // Compare with standard follow-up prompt
      const { buildFollowUpPrompt } = await import('../core/soap/SOAPPromptFactory');
      const standardPrompt = buildFollowUpPrompt(deidentifiedContext, options);
      const { compareTokenUsage } = await import('../core/soap/FollowUpSOAPPromptBuilder');
      tokenOptimization = compareTokenUsage(prompt, standardPrompt);
    }

    // Call Vertex AI via proxy
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
    let soapNote = parseSOAPResponse(data, context.visitType);
    
    // ✅ PHIPA COMPLIANCE: Re-identify SOAP note sections if needed
    if (Object.keys(identifiersMap).length > 0) {
      soapNote = {
        ...soapNote,
        subjective: reidentify(soapNote.subjective || '', identifiersMap),
        objective: reidentify(soapNote.objective || '', identifiersMap),
        assessment: reidentify(soapNote.assessment || '', identifiersMap),
        plan: reidentify(soapNote.plan || '', identifiersMap),
      };
      
      await logDeidentification('reidentify', JSON.stringify(soapNote).length, Object.keys(identifiersMap).length, {
        traceId,
        service: 'generateSOAPNote',
      });
    }
    
    // ✅ REFINED: Validate for quality (guidelines, not strict limits)
    const validation = validateSOAP(soapNote);
    
    // Only truncate if VERY excessive (exceeds warning threshold)
    if (!validation.isValid) {
      console.warn('[SOAP Service] SOAP note is very lengthy, condensing:', validation.errors);
      
      // Truncate only if truly excessive
      soapNote = truncateSOAPToLimits(soapNote);
      
      // Re-validate after truncation
      const revalidation = validateSOAP(soapNote);
      if (!revalidation.isValid) {
        console.error('[SOAP Service] SOAP note still very lengthy after truncation:', revalidation.errors);
      }
    }
    
    // Log warnings for quality issues (guidelines exceeded, repetition)
    if (validation.warnings.length > 0) {
      console.log('[SOAP Service] Quality guidelines:', validation.warnings);
    }
    
    if (validation.repetitionCheck.hasRepetition) {
      console.warn('[SOAP Service] Repetition detected - consider editing:', validation.repetitionCheck.repeatedPhrases);
    }

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
        analysisLevel: options?.analysisLevel,
        tokenOptimization,
        validation: {
          totalCharacters: validation.totalCharacters,
          isValid: validation.isValid,
          hasRepetition: validation.repetitionCheck.hasRepetition,
        },
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

