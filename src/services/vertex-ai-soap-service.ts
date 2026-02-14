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
import type { SOAPNote, FollowUpAlerts, FollowUpPlanItem } from '../types/vertex-ai';
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
      level: 'ok' | 'degraded' | 'unsafe';
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
      professionalProfile: options?.professionalProfile,
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
 * WO-PROMPT-PLAN-SPLIT-01: Parse plan text into IN-CLINIC TREATMENT and HOME EXERCISE PROGRAM (HEP).
 * Looks for exact headers (case-insensitive). Fallback: whole text as homeProgram, log warning.
 */
function parsePlanToStructured(planText: string): { inClinic: string[]; homeProgram: string[] } {
  if (!planText || typeof planText !== 'string' || !planText.trim()) {
    return { inClinic: [], homeProgram: [] };
  }
  const normalized = planText.trim();
  const inClinicHeader = /IN-CLINIC\s+TREATMENT\s*:/i;
  const hepHeader = /HOME\s+EXERCISE\s+PROGRAM\s*\(\s*HEP\s*\)\s*:/i;

  const inClinicIdx = normalized.search(inClinicHeader);
  const hepIdx = normalized.search(hepHeader);

  const bulletLine = /^\s*[-•*]\s*(.+)$/;
  const toItems = (block: string): string[] =>
    block
      .split(/\n/)
      .map((line) => {
        const m = line.match(bulletLine);
        return m ? m[1].trim() : line.trim();
      })
      .filter(Boolean);

  if (inClinicIdx !== -1 && hepIdx !== -1) {
    const first = Math.min(inClinicIdx, hepIdx);
    const second = Math.max(inClinicIdx, hepIdx);
    const beforeSecond = normalized.slice(first, second);
    const afterSecond = normalized.slice(second);
    const isInClinicFirst = inClinicIdx < hepIdx;
    const block1 = beforeSecond.replace(isInClinicFirst ? inClinicHeader : hepHeader, '').trim();
    const block2 = afterSecond.replace(isInClinicFirst ? hepHeader : inClinicHeader, '').trim();
    const items1 = toItems(block1);
    const items2 = toItems(block2);
    return isInClinicFirst
      ? { inClinic: items1, homeProgram: items2 }
      : { inClinic: items2, homeProgram: items1 };
  }

  console.warn('[SOAP][PLAN] Structured sections missing – fallback applied');
  const allLines = normalized.split(/\n/).map((l) => l.replace(/^\s*[-•*]+\s*/, '').trim()).filter(Boolean);
  return { inClinic: [], homeProgram: allLines };
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

  // WO-PROMPT-PLAN-SPLIT-01: Parse plan into inClinic / homeProgram for UI consumption
  const { inClinic: planInClinic, homeProgram: planHomeProgram } = parsePlanToStructured(formattedPlan);

  // Validate and return structured SOAP note
  if (soapData && typeof soapData === 'object') {
    return {
      subjective: String(soapData.subjective || 'Not documented.'),
      objective: String(soapData.objective || 'Not documented.'),
      assessment: String(soapData.assessment || 'Not documented.'),
      plan: formattedPlan, // ✅ T3: Use validated and capped plan
      planInClinic: planInClinic.length > 0 ? planInClinic : undefined,
      planHomeProgram: planHomeProgram.length > 0 ? planHomeProgram : undefined,
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

const NOT_DOCUMENTED = 'Not documented.';
const MIN_MEANINGFUL_LENGTH = 3;

/** Check if section content is meaningful (not empty, not placeholder). */
function isMeaningfulSection(text: string): boolean {
  const t = (text ?? '').trim();
  return t.length >= MIN_MEANINGFUL_LENGTH && t !== NOT_DOCUMENTED;
}

/**
 * WO-FU-VERTEX-SPLIT-01: Parse plain SOAP sections when Vertex returns text (no JSON).
 * Tries: Subjective:/Objective:/Assessment:/Plan:, then S:/O:/A:/P:, then Spanish Subjetivo:/Objetivo:/Evaluación:/Plan:
 */
function parsePlainSOAPSections(rawText: string): SOAPNote | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const headingSets: ReadonlyArray<[string, string, string, string]> = [
    ['Subjective', 'Objective', 'Assessment', 'Plan'],
    ['S', 'O', 'A', 'P'],
    ['Subjetivo', 'Objetivo', 'Evaluación', 'Plan'],
    ['Subjetivo', 'Objetivo', 'Assessment', 'Plan'],
  ];

  for (const headings of headingSets) {
    const sections: Record<string, string> = {};
    for (let i = 0; i < headings.length; i++) {
      const name = headings[i];
      const nextName = headings[i + 1];
      const re = new RegExp(
        `${name}:\\s*([\\s\\S]*?)(?=${nextName ? nextName + ':' : '$'})`,
        'i'
      );
      const m = trimmed.match(re);
      const text = m ? m[1].trim() : '';
      const key = ['subjective', 'objective', 'assessment', 'plan'][i];
      sections[key] = text || NOT_DOCUMENTED;
    }
    const hasAny = ['subjective', 'objective', 'assessment', 'plan'].some((k) =>
      isMeaningfulSection(sections[k] ?? '')
    );
    if (hasAny) {
      return {
        subjective: sections.subjective ?? NOT_DOCUMENTED,
        objective: sections.objective ?? NOT_DOCUMENTED,
        assessment: sections.assessment ?? NOT_DOCUMENTED,
        plan: sections.plan ?? NOT_DOCUMENTED,
      };
    }
  }
  return null;
}

/**
 * WO-11: Generate follow-up SOAP using raw prompt v2 (4 sources).
 * WO-11.1: Also parses ALERTS and plan[] for UI (red/yellow, checklist).
 * WO-FU-VERTEX-SPLIT-01: Primary output is plain SOAP text; JSON parse is fallback.
 */
export async function generateFollowUpSOAPV2Raw(fullPrompt: string): Promise<{
  raw: string;
  soap: SOAPNote | null;
  alerts?: FollowUpAlerts | null;
  planItems?: FollowUpPlanItem[] | null;
}> {
  const traceId = `soap-followup-v2-${Date.now()}`;
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      action: 'analyze',
      traceId,
      model: 'gemini-2.0-flash-exp',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Vertex AI error: ${response.status} - ${errorData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  let rawText =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    data.text ??
    (data.soap ? JSON.stringify(data.soap) : '');

  if (!rawText || typeof rawText !== 'string') {
    return { raw: '', soap: null };
  }

  // WO-FOLLOWUP-SOAP-02: Temporary diagnostic log — remove after validation
  console.log('[FOLLOWUP-RAW] length:', rawText.length, 'preview:', rawText.substring(0, 300));

  let soap: SOAPNote | null = null;
  let planItems: FollowUpPlanItem[] | null = null;
  let alerts: FollowUpAlerts | null = null;

  // WO-FU-VERTEX-SPLIT-01: Prompt V3 requests plain SOAP only — try plain sections first
  const plainSoap = parsePlainSOAPSections(rawText);
  console.log('[FOLLOWUP-RAW] parsePlainSOAPSections result:', plainSoap ? 'MATCHED' : 'NULL');
  if (plainSoap) {
    soap = plainSoap;
  }

  if (!soap) {
    try {
      let soapData: any = null;
      const soapNoteBlock = rawText.match(/SOAP_NOTE\s*\{[\s\S]*?\}\s*(?=ALERTS|$)/i);
      if (soapNoteBlock) {
        const jsonStr = soapNoteBlock[0].replace(/^SOAP_NOTE\s*/i, '').trim();
        soapData = JSON.parse(jsonStr);
      } else {
        const firstJson = rawText.match(/\{[\s\S]*\}/);
        if (firstJson) soapData = JSON.parse(firstJson[0]);
      }
      if (soapData && typeof soapData === 'object') {
        // WO-FOLLOWUP-PROMPT-04: Normalize keys — accept capitalized (Subjective, Objective, etc.) or lowercase
        const subj = soapData.Subjective ?? soapData.subjective;
        const obj = soapData.Objective ?? soapData.objective;
        const ass = soapData.Assessment ?? soapData.assessment;
        const planRaw = soapData.Plan ?? soapData.plan;
        const plan =
          typeof planRaw === 'string'
            ? planRaw
            : Array.isArray(planRaw)
              ? planRaw.map((p: any) => (typeof p === 'string' ? p : p?.action || p?.label || JSON.stringify(p))).join('\n')
              : 'Not documented.';
        soap = {
          subjective: String(subj ?? 'Not documented.'),
          objective: String(obj ?? 'Not documented.'),
          assessment: String(ass ?? 'Not documented.'),
          plan: plan || 'Not documented.',
        };
        const planArr = Array.isArray(planRaw) ? planRaw : soapData.plan;
        if (Array.isArray(planArr) && planArr.length > 0) {
          planItems = planArr.map((p: any) => ({
            id: p.id ?? String(Math.random()).slice(2, 9),
            action: typeof p.action === 'string' ? p.action : p.label ?? String(p),
            status: ['completed', 'modified', 'deferred', 'planned'].includes(p.status) ? p.status : 'planned',
            notes: p.notes,
          }));
        }
      }
    } catch (e) {
      console.warn('[SOAP Service] WO-11 parse SOAP_NOTE from v2 response:', e);
    }
  }

  // Fallback: if no structured SOAP could be parsed but we have raw text, use it as single follow-up block
  // so the UI shows the model output instead of "Not documented." everywhere.
  if (!soap || (
    !isMeaningfulSection(soap.subjective ?? '') &&
    !isMeaningfulSection(soap.objective ?? '') &&
    !isMeaningfulSection(soap.assessment ?? '') &&
    !isMeaningfulSection(soap.plan ?? '') &&
    !(soap.followUp != null && (soap.followUp as string).trim().length > 0)
  )) {
    const rawTrimmed = (rawText ?? '').trim();
    if (rawTrimmed.length > 0) {
      // WO-FOLLOWUP-PROMPT-04: Try parsing raw as JSON (Vertex sometimes returns JSON with capitalized keys,
      // optionally wrapped in markdown code blocks like ```json ... ```)
      let parsedSoap: SOAPNote | null = null;
      const extractJsonString = (s: string): string => {
        const t = s.trim();
        const codeBlock = /^```(?:json)?\s*([\s\S]*?)```\s*$/i.exec(t);
        if (codeBlock) return codeBlock[1].trim();
        const firstBrace = t.indexOf('{');
        if (firstBrace < 0) return t;
        // Extract first complete {...} object (brace matching)
        let depth = 0;
        let end = -1;
        for (let i = firstBrace; i < t.length; i++) {
          if (t[i] === '{') depth++;
          else if (t[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end >= 0) return t.slice(firstBrace, end + 1);
        return t.slice(firstBrace);
      };
      try {
        const jsonStr = extractJsonString(rawTrimmed);
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object') {
          const subj = parsed.Subjective ?? parsed.subjective;
          const obj = parsed.Objective ?? parsed.objective;
          const ass = parsed.Assessment ?? parsed.assessment;
          const planRaw = parsed.Plan ?? parsed.plan;
          const hasAny = [subj, obj, ass, planRaw].some((v) => v != null && String(v).trim().length > 0);
          if (hasAny) {
            const planStr =
              typeof planRaw === 'string'
                ? planRaw
                : Array.isArray(planRaw)
                  ? planRaw.map((p: any) => (typeof p === 'string' ? p : p?.action ?? p?.label ?? String(p))).join('\n')
                  : '';
            parsedSoap = {
              subjective: String(subj ?? ''),
              objective: String(obj ?? ''),
              assessment: String(ass ?? ''),
              plan: planStr || 'Not documented.',
            };
          }
        }
      } catch (_) {
        // not JSON — use raw as followUp below
      }
      if (parsedSoap && (isMeaningfulSection(parsedSoap.subjective) || isMeaningfulSection(parsedSoap.objective) || isMeaningfulSection(parsedSoap.assessment) || isMeaningfulSection(parsedSoap.plan))) {
        soap = parsedSoap;
        console.info('[SOAP Service] WO-11 fallback: parsed JSON (capitalized keys) into SOAP');
      } else {
        soap = {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          followUp: rawTrimmed,
        };
        console.info('[SOAP Service] WO-11 using raw text as followUp block (structured parse had no content)');
        console.log('[FOLLOWUP-RAW] FALLBACK activated. followUp length:', rawTrimmed.length);
      }
    }
  }

  // WO-11.1: parse ALERTS block
  try {
    const alertsBlock = rawText.match(/ALERTS\s*\{[\s\S]*?\}\s*$/i) ?? rawText.match(/ALERTS\s*\{[\s\S]*\}/i);
    if (alertsBlock) {
      const jsonStr = alertsBlock[0].replace(/^ALERTS\s*/i, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        if (parsed.none === true) {
          alerts = { none: true };
        } else {
          alerts = {
            red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : undefined,
            yellow_flags: Array.isArray(parsed.yellow_flags) ? parsed.yellow_flags : undefined,
            medico_legal: Array.isArray(parsed.medico_legal) ? parsed.medico_legal : undefined,
          };
        }
      }
    }
  } catch (e) {
    console.warn('[SOAP Service] WO-11.1 parse ALERTS from v2 response:', e);
  }

  return { raw: rawText, soap, alerts: alerts ?? undefined, planItems: planItems ?? undefined };
}

/**
 * WO-FOLLOWUP-PLAN-NEXT: Derive S/O/A/P from raw text (JSON or plain SOAP) for persistence.
 * Use at save time when the note only has followUp (raw string) so the next follow-up has baseline/plan.
 * Returns null if nothing could be parsed.
 */
export function deriveSOAPDataFromRawText(rawText: string): { subjective: string; objective: string; assessment: string; plan: string } | null {
  const t = (rawText ?? '').trim();
  if (!t.length) return null;

  const plain = parsePlainSOAPSections(t);
  if (plain) {
    return {
      subjective: plain.subjective ?? '',
      objective: plain.objective ?? '',
      assessment: plain.assessment ?? '',
      plan: plain.plan ?? '',
    };
  }

  const extractJsonString = (s: string): string => {
    const trimmed = s.trim();
    const codeBlock = /^```(?:json)?\s*([\s\S]*?)```\s*$/i.exec(trimmed);
    if (codeBlock) return codeBlock[1].trim();
    const firstBrace = trimmed.indexOf('{');
    if (firstBrace < 0) return trimmed;
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < trimmed.length; i++) {
      if (trimmed[i] === '{') depth++;
      else if (trimmed[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end >= 0) return trimmed.slice(firstBrace, end + 1);
    return trimmed.slice(firstBrace);
  };

  try {
    const jsonStr = extractJsonString(t);
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      const subj = parsed.Subjective ?? parsed.subjective;
      const obj = parsed.Objective ?? parsed.objective;
      const ass = parsed.Assessment ?? parsed.assessment;
      const planRaw = parsed.Plan ?? parsed.plan;
      const hasAny = [subj, obj, ass, planRaw].some((v) => v != null && String(v).trim().length > 0);
      if (hasAny) {
        const planStr =
          typeof planRaw === 'string'
            ? planRaw
            : Array.isArray(planRaw)
              ? planRaw.map((p: any) => (typeof p === 'string' ? p : p?.action ?? p?.label ?? String(p))).join('\n')
              : '';
        return {
          subjective: String(subj ?? ''),
          objective: String(obj ?? ''),
          assessment: String(ass ?? ''),
          plan: planStr || '',
        };
      }
    }
  } catch (_) {
    // not JSON
  }
  return null;
}

/**
 * WO-MINIMAL-BASELINE: Generate structured SOAP from free-form text (pasted EMR notes or "Estado actual del tratamiento").
 * Used to create a baseline for existing patients. Returns SOAP only; no ALERTS/planItems.
 */
const BASELINE_FROM_TEXT_SYSTEM =
  'You are a clinical note assistant. Given session note(s) or free-text clinical summary, output a single SOAP note that serves as clinical context for future follow-ups. Use plain text with exactly these headings (one per section): Subjective:, Objective:, Assessment:, Plan:. Each section must contain substantive content; Plan must explicitly state what treatment is in course. Output nothing else.';

export async function generateBaselineSOAPFromFreeText(freeText: string): Promise<SOAPNote> {
  const userPrompt = `Extract or generate a structured SOAP note from the following session note(s) or clinical summary. The SOAP will be used as baseline context for future follow-ups. The Plan section must explicitly state what treatment is currently in course.\n\n---\n${freeText.trim().slice(0, 15000)}\n---`;
  const fullPrompt = `${BASELINE_FROM_TEXT_SYSTEM}\n\n${userPrompt}`;

  const traceId = `baseline-from-text-${Date.now()}`;
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      action: 'analyze',
      traceId,
      model: 'gemini-2.0-flash-exp',
    }),
  }); if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Vertex AI error: ${response.status} - ${errorData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  const rawText =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    data.text ??
    (data.soap ? JSON.stringify(data.soap) : '');

  if (!rawText || typeof rawText !== 'string') {
    throw new Error('No SOAP content returned from AI.');
  }

  let soap: SOAPNote | null = parsePlainSOAPSections(rawText);
  if (!soap) {
    try {
      const firstJson = rawText.match(/\{[\s\S]*\}/);
      if (firstJson) {
        const soapData = JSON.parse(firstJson[0]);
        if (soapData && typeof soapData === 'object') {
          const plan =
            typeof soapData.plan === 'string'
              ? soapData.plan
              : Array.isArray(soapData.plan)
                ? soapData.plan.map((p: any) => (typeof p === 'string' ? p : p?.action ?? p?.label ?? String(p))).join('\n')
                : '';
          soap = {
            subjective: String(soapData.subjective ?? ''),
            objective: String(soapData.objective ?? ''),
            assessment: String(soapData.assessment ?? ''),
            plan: plan || '',
          };
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  if (!soap) {
    throw new Error('Could not parse SOAP from AI response.');
  }

  return soap;
}
