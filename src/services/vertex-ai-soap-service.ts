/**
 * Vertex AI SOAP Service
 * 
 * Handles SOAP note generation using Vertex AI with differentiated prompts
 * for Initial Assessment vs Follow-up visits.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { buildSOAPPrompt, buildFollowUpPrompt, type SOAPPromptOptions } from "../core/soap/SOAPPromptFactory";
import { compareTokenUsage } from "../core/soap/FollowUpSOAPPromptBuilder";
import type { SOAPContext } from '../core/soap/SOAPContextBuilder';
import type { SOAPNote } from '../types/vertex-ai';
import type { SessionType } from './sessionTypeService';
import { validateSOAP, truncateSOAPToLimits } from '../utils/soapValidation';
import { deidentify, reidentify, logDeidentification } from './dataDeidentificationService';
// ✅ WO-03: Prompt Brain v3 integration
import { resolvePromptBrainVersion } from "../core/prompts/v3/builders/resolvePromptBrainVersion";
import { buildPromptV3 } from "../core/prompts/v3/builders/buildPromptV3";
import { enforceContractOrBuildRepair } from "../core/prompts/v3/validators/contractRuntime";

// ✅ CANADÁ: Vertex AI Proxy en región canadiense (northamerica-northeast1)
const VERTEX_PROXY_URL = 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';

export interface SOAPGenerationResponse {
  soap: SOAPNote | null;
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
    quality?: {
      level: 'ok' | 'degraded';
      flags: string[];
    };
  };
}

export interface SOAPGenerationError {
  message: string;
  code: 'vertex_error' | 'parse_error' | 'validation_error' | 'network_error';
  details?: any;
}

// ✅ WO-SOAP-QUALITY-GUARDS-01: Pre-SOAP Quality Evaluation
type PreSOAPQuality =
  | { level: 'ok' }
  | { level: 'degraded'; reason: 'subjective_only' | 'weak_objective' }
  | { level: 'unsafe'; reason: 'no_clinical_signal' };

function evaluatePreSOAPQuality(context: SOAPContext): PreSOAPQuality {
  const transcript = context.transcript?.toLowerCase() || '';

  const hasObjectiveSignals =
    Boolean(context.physicalExamResults?.length) ||
    /\b(rom|range of motion|strength|palpation|tenderness|swelling|gait|degrees?|kg|lbs?)\b/.test(transcript) ||
    /\b\d+\b/.test(transcript); // números clínicos básicos

  const hasMeaningfulLength = transcript.split(' ').length >= 15;

  if (!hasMeaningfulLength && !hasObjectiveSignals) {
    return { level: 'unsafe', reason: 'no_clinical_signal' };
  }

  if (!hasObjectiveSignals) {
    return { level: 'degraded', reason: 'subjective_only' };
  }

  return { level: 'ok' };
}

// ✅ WO-SOAP-QUALITY-GUARDS-01: Post-SOAP Quality Guard
function applyPostSOAPQualityGuard(soap: SOAPNote): { soap: SOAPNote; flags: string[] } {
  const flags: string[] = [];

  const hasObjective =
    Boolean(soap.objective && soap.objective.trim().length > 20);

  if (!hasObjective && soap.assessment) {
    soap.assessment = '';
    flags.push('assessment_removed_no_objective');
  }

  if (!soap.assessment && soap.plan) {
    soap.plan = '';
    flags.push('plan_removed_no_assessment');
  }

  return { soap, flags };
}

/**
 * ✅ WO-PHASE3-CRITICAL-FIXES: Anti-Hallucination Validation
 * 
 * IMPORTANT: Phase 2 (Physical Evaluation) does NOT document modalities.
 * Modalities are added manually by the user in Phase 3 (SOAP Plan).
 * 
 * This validation ONLY:
 * - Logs warnings if AI suggests specific modalities without clinical context
 * - Does NOT remove content (user can add modalities manually)
 * - Does NOT validate against Phase 2 (modalities aren't documented there)
 * 
 * The user is free to add any modalities manually in the SOAP Plan editor.
 */
function validateSOAPAgainstDocumentation(
  generatedSOAP: SOAPNote,
  context: SOAPContext
): { warnings: string[]; cleanedPlan: string } {
  const warnings: string[] = [];
  // ✅ CRITICAL: Do NOT modify the plan - user can add modalities manually
  const cleanedPlan = generatedSOAP.plan || '';

  // ✅ IMPORTANT: Phase 2 does NOT document modalities
  // Physical evaluation tests are for assessment, not treatment documentation
  // Modalities are added manually by the clinician in Phase 3

  // Only log warnings for very specific hallucinations (e.g., mentioning specific
  // modality parameters or brand names that AI shouldn't invent)
  const suspiciousPatterns = [
    /\d+\s*(hz|mhz|watts?|joules?|minutes?)\s*(of|for)\s*(ultrasound|tens|laser)/i,
    /(brand|model|manufacturer)\s+(ultrasound|tens|laser)/i,
  ];

  const planText = cleanedPlan;
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(planText)) {
      warnings.push(
        `⚠️ AI may have suggested specific modality parameters. Please verify and adjust as needed.`
      );
    }
  });

  // ✅ DO NOT remove any content - user can edit and add modalities manually
  // ✅ DO NOT validate against Phase 2 - modalities aren't documented there

  return {
    warnings,
    cleanedPlan: cleanedPlan.trim()
  };
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
    
    // ✅ WO-SOAP-QUALITY-GUARDS-01: Pre-SOAP Quality Guard
    const preSOAPQuality = evaluatePreSOAPQuality(context);
    
    if (preSOAPQuality.level === 'unsafe') {
      return {
        soap: null,
        metadata: {
          model: 'guard-blocked',
          tokens: {
            input: 0,
            output: 0,
          },
          timestamp: new Date().toISOString(),
          visitType: context.visitType,
          analysisLevel: options?.analysisLevel,
          quality: {
            level: 'unsafe',
            flags: [preSOAPQuality.reason],
          },
        },
      };
    }
    
    // ✅ WO-03: Resolve Prompt Brain version (v2 or v3)
    const pbVersion = resolvePromptBrainVersion({
      search: typeof window !== "undefined" ? window.location.search : "",
      envVersion: import.meta.env.VITE_PROMPT_BRAIN_VERSION,
    });

    // ✅ WO-03: Determine if v3 path should be used
    const isV3Path =
      pbVersion === "v3" &&
      context.visitType === "follow-up" &&
      options?.analysisLevel === "optimized";

    // ✅ WORKFLOW OPTIMIZATION: Use optimized prompt if analysisLevel is 'optimized'
    const useOptimized = options?.analysisLevel === 'optimized';
    const promptOptions: SOAPPromptOptions = {
      ...options,
      useOptimizedPrompt: useOptimized,
    };
    
    // ✅ WO-03: Build prompt (v3 or v2)
    let prompt = buildSOAPPrompt(deidentifiedContext, promptOptions);
    
    if (isV3Path) {
      // Extract context for v3 prompt
      const chiefComplaint = context.transcript?.slice(0, 200) || deidentifiedContext.transcript?.slice(0, 200) || "";
      const keyFindings: string[] = [];
      // Extract key findings from context if available
      if (context.physicalExamResults) {
        keyFindings.push(...context.physicalExamResults.slice(0, 3).map((r: any) => String(r).slice(0, 50)));
      }
      const painScale = context.patientContext?.painScale || "";

      prompt = buildPromptV3({
        flags: {
          intent: "DECIDE",
          visitType: "follow-up",
          analysisLevel: "optimized",
          promptBrainVersion: "v3",
        },
        context: {
          chiefComplaint,
          keyFindings,
          painScale,
        },
      });
    }
    
    // ✅ WORKFLOW OPTIMIZATION: Calculate token optimization if using optimized prompt
    let tokenOptimization;
    if (useOptimized && context.visitType === 'follow-up') {
      // Compare with standard follow-up prompt
      const standardPrompt = buildFollowUpPrompt(deidentifiedContext, options);
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
        action: 'analyze',
        traceId,
        model: 'gemini-2.0-flash-exp', // Use same model as clinical analysis
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Vertex AI error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // ✅ WO-03: Extract raw text for contract validation (v3 path only)
    let rawText = "";
    if (isV3Path) {
      // Extract raw text from response
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawText = data.candidates[0].content.parts[0].text;
      } else if (data.text) {
        rawText = data.text;
      } else if (data.soap) {
        rawText = JSON.stringify(data.soap);
      }

      // Enforce contract with retry (max 1 retry)
      const firstCheck = enforceContractOrBuildRepair({
        intent: "DECIDE",
        outputText: rawText,
        retriesSoFar: 0,
      });

      if (firstCheck.ok) {
        rawText = firstCheck.text;
        // Update data with validated text for parsing
        if (data.candidates?.[0]?.content?.parts?.[0]) {
          data.candidates[0].content.parts[0].text = rawText;
        } else {
          data.text = rawText;
        }
      } else {
        // Retry once with repair prompt
        // Bloque 4: Type narrowing - repairPrompt solo existe cuando ok: false
        const repairPrompt = (firstCheck as { ok: false; repairPrompt: string }).repairPrompt;
        
        const repairResponse = await fetch(VERTEX_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: repairPrompt,
            action: 'analyze',
            traceId: `${traceId}-repair`,
            model: 'gemini-2.0-flash-exp',
          }),
        });

        if (repairResponse.ok) {
          const repairData = await repairResponse.json();
          let repairedText = "";
          if (repairData.candidates?.[0]?.content?.parts?.[0]?.text) {
            repairedText = repairData.candidates[0].content.parts[0].text;
          } else if (repairData.text) {
            repairedText = repairData.text;
          }

          const secondCheck = enforceContractOrBuildRepair({
            intent: "DECIDE",
            outputText: repairedText,
            retriesSoFar: 1,
          });

          if (secondCheck.ok) {
            rawText = secondCheck.text;
            // Update data with repaired text
            if (data.candidates?.[0]?.content?.parts?.[0]) {
              data.candidates[0].content.parts[0].text = rawText;
            } else {
              data.text = rawText;
            }
          } else {
            // Fallback to v2: rebuild prompt and call once
            console.warn('[SOAP Service] v3 contract enforcement failed after retry, falling back to v2');
            const fallbackPrompt = buildSOAPPrompt(deidentifiedContext, promptOptions);
            
            const fallbackResponse = await fetch(VERTEX_PROXY_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: fallbackPrompt,
                action: 'analyze',
                traceId: `${traceId}-fallback`,
                model: 'gemini-2.0-flash-exp',
              }),
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              // Use fallback response
              Object.assign(data, fallbackData);
            }
          }
        } else {
          // Repair request failed, fallback to v2
          console.warn('[SOAP Service] v3 repair request failed, falling back to v2');
          const fallbackPrompt = buildSOAPPrompt(deidentifiedContext, promptOptions);
          
          const fallbackResponse = await fetch(VERTEX_PROXY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: fallbackPrompt,
              action: 'analyze',
              traceId: `${traceId}-fallback`,
              model: 'gemini-2.0-flash-exp',
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            Object.assign(data, fallbackData);
          }
        }
      }
    }
    
    // Parse Vertex AI response
    let soapNote = parseSOAPResponse(data, context.visitType);
    
    // ✅ WO-SOAP-QUALITY-GUARDS-01: Post-SOAP Quality Guard
    const postSOAPResult = applyPostSOAPQualityGuard(soapNote);
    soapNote = postSOAPResult.soap;
    
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
    
    // ✅ WO-PHASE3-CRITICAL-FIXES: Anti-Hallucination Validation
    // NOTE: Only logs warnings for debugging, does NOT modify plan
    // Phase 2 does NOT document modalities - user can add them manually in Phase 3
    const hallucinationValidation = validateSOAPAgainstDocumentation(soapNote, context);
    if (hallucinationValidation.warnings.length > 0) {
      console.warn('[SOAP Service] Anti-Hallucination warnings (for debugging only):', hallucinationValidation.warnings);
      // ✅ CRITICAL: Do NOT modify plan - user can add modalities manually in Phase 3
      // Plan remains as generated - user has full control to edit and add modalities
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
        quality: {
          level: preSOAPQuality.level === 'ok' ? 'ok' : 'degraded',
          flags: [
            ...(preSOAPQuality.level === 'degraded' ? [preSOAPQuality.reason] : []),
            ...(postSOAPResult?.flags || []),
          ],
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

  // ✅ WO-PDF-004: Serialize treatment plan if it's an object
  const formatTreatmentPlan = (plan: any): string => {
    if (!plan) return 'Not documented.';
    
    // If already a string, return it
    if (typeof plan === 'string') return plan;
    
    // If it's an object, serialize it
    if (typeof plan === 'object') {
      // ✅ FIX: Log the actual structure for debugging
      console.log('[SOAP Builder] Plan object structure:', JSON.stringify(plan, null, 2));
      console.log('[SOAP Builder] Plan object keys:', Object.keys(plan));
      
      let planText = '';
      
      // Try different possible property names
      // Some AI models might use different naming conventions
      const interventions = plan.interventions || plan.intervention || plan.treatment_interventions || plan.treatments || [];
      const modalities = plan.modalities || plan.modality || plan.electrotherapy || [];
      const exercises = plan.home_exercise_program || plan.exercises || plan.home_exercises || plan.HEP || [];
      const education = plan.patient_education || plan.education || plan.patient_teaching || [];
      const goals = plan.goals || plan.short_term_goals || [];
      const longTermGoals = plan.long_term_goals || plan.longTermGoals || [];
      const followUp = plan.follow_up_recommendations || plan.follow_up || plan.followUp || plan.followup || [];
      
      // Interventions
      if (Array.isArray(interventions) && interventions.length > 0) {
        planText += 'Interventions:\n';
        interventions.forEach((intervention: any) => {
          if (typeof intervention === 'string') {
            planText += `- ${intervention}\n`;
          } else {
            planText += `- ${intervention.type || intervention.name || intervention.description || JSON.stringify(intervention)}\n`;
            if (intervention.frequency) {
              planText += `  Frequency: ${intervention.frequency}\n`;
            }
          }
        });
        planText += '\n';
      }
      
      // Modalities
      if (Array.isArray(modalities) && modalities.length > 0) {
        planText += 'Modalities:\n';
        modalities.forEach((modality: any) => {
          if (typeof modality === 'string') {
            planText += `- ${modality}\n`;
          } else {
            planText += `- ${modality.type || modality.name || modality.description || JSON.stringify(modality)}\n`;
          }
        });
        planText += '\n';
      }
      
      // Short-term goals
      if (Array.isArray(goals) && goals.length > 0) {
        planText += 'Short-term Goals:\n';
        goals.forEach((goal: string) => {
          planText += `- ${goal}\n`;
        });
        planText += '\n';
      }
      
      // Long-term goals
      if (Array.isArray(longTermGoals) && longTermGoals.length > 0) {
        planText += 'Long-term Goals:\n';
        longTermGoals.forEach((goal: string) => {
          planText += `- ${goal}\n`;
        });
        planText += '\n';
      }
      
      // Patient education
      if (Array.isArray(education) && education.length > 0) {
        planText += 'Patient Education:\n';
        education.forEach((edu: string) => {
          planText += `- ${edu}\n`;
        });
        planText += '\n';
      }
      
      // Home exercise program
      if (Array.isArray(exercises) && exercises.length > 0) {
        planText += 'Home Exercise Program:\n';
        exercises.forEach((exercise: string) => {
          planText += `- ${exercise}\n`;
        });
        planText += '\n';
      }
      
      // Follow-up
      if (Array.isArray(followUp) && followUp.length > 0) {
        planText += 'Follow-up:\n';
        followUp.forEach((rec: string) => {
          planText += `- ${rec}\n`;
        });
      }
      
      // ✅ FIX: If object has a 'text' or 'description' property, use it
      if (!planText.trim() && (plan.text || plan.description || plan.plan_text)) {
        planText = plan.text || plan.description || plan.plan_text || '';
      }
      
      // ✅ FIX: If still empty, try to extract any string values from the object
      if (!planText.trim()) {
        const stringValues: string[] = [];
        Object.keys(plan).forEach(key => {
          const value = plan[key];
          if (typeof value === 'string' && value.trim().length > 0) {
            stringValues.push(`${key}: ${value}`);
          } else if (Array.isArray(value) && value.length > 0) {
            stringValues.push(`${key}: ${value.join(', ')}`);
          }
        });
        if (stringValues.length > 0) {
          planText = stringValues.join('\n');
        }
      }
      
      const result = planText.trim() || 'Not documented.';
      console.log('[SOAP Builder] Serialized plan length:', result.length, 'chars');
      return result;
    }
    
    return String(plan);
  };

  // ✅ WO-PDF-004: Add logging for debugging
  console.log('[SOAP Builder] Parsing SOAP response...');
  console.log('[SOAP Builder] Treatment plan type:', typeof soapData?.plan);
  if (typeof soapData?.plan === 'object' && soapData?.plan !== null) {
    console.log('[SOAP Builder] Treatment plan is object, will serialize');
    console.log('[SOAP Builder] Plan object preview:', JSON.stringify(soapData.plan).substring(0, 200));
  }
  console.log('[SOAP Builder] Objective length:', String(soapData?.objective || '').length, 'chars');
  const formattedPlanRaw = formatTreatmentPlan(soapData?.plan);
  
  // ✅ T3: Validate and limit plan size (max 2000 chars)
  const MAX_PLAN_LENGTH = 2000;
  const TRUNCATE_MARKER = '… [truncated]';
  let formattedPlan: string;
  
  if (formattedPlanRaw.length > MAX_PLAN_LENGTH) {
    // Truncate and add marker
    const truncateAt = MAX_PLAN_LENGTH - TRUNCATE_MARKER.length;
    formattedPlan = formattedPlanRaw.substring(0, truncateAt) + TRUNCATE_MARKER;
    console.warn('[SOAP Builder] Plan truncated:', {
      originalLength: formattedPlanRaw.length,
      truncatedLength: formattedPlan.length,
      maxLength: MAX_PLAN_LENGTH
    });
  } else {
    formattedPlan = formattedPlanRaw;
  }
  
  // ✅ T3: Validate plan is not empty/invalid
  if (!formattedPlan || formattedPlan.trim().length === 0 || formattedPlan === 'Not documented.') {
    formattedPlan = 'Not documented.';
  }
  
  console.log('[SOAP Builder] Plan length after formatting:', formattedPlan.length, 'chars');

  // Validate and return structured SOAP note
  if (soapData && typeof soapData === 'object') {
    return {
      subjective: String(soapData.subjective || 'Not documented.'),
      objective: String(soapData.objective || 'Not documented.'),
      assessment: String(soapData.assessment || 'Not documented.'),
      plan: formattedPlan, // ✅ T3: Use validated and capped plan
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

