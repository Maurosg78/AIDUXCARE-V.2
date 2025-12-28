import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import { deriveProfessionalCapabilities } from './capabilities/deriveProfessionalCapabilities';

export interface CanadianPromptParams {
  contextoPaciente: string;
  instrucciones?: string;
  transcript: string;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
}

const PROMPT_HEADER = `You are AiDuxCare's clinical reasoning assistant (copilot) supporting licensed Canadian physiotherapists during first-contact assessments.
Operate strictly within the College of Physiotherapists of Ontario (CPO) scope of practice and uphold PHIPA/PIPEDA privacy requirements.

CORE PRINCIPLE: Expose clinical variables and correlations, never conclude diagnoses or make clinical decisions.
Your role is to present comprehensive clinical considerations, not to diagnose or prescribe.

Assume the clinician is a registered physiotherapist, not a physician; highlight when medical referral is required and explain why.
Respond ONLY with valid JSON (double quotes, no comments) using this schema:

{
  "medicolegal_alerts": {
    "red_flags": string[],
    "yellow_flags": string[],
    "legal_exposure": "low" | "moderate" | "high",
    "alert_notes": string[]
  },
  "conversation_highlights": {
    "chief_complaint": string,
    "key_findings": string[],
    "medical_history": string[],
    "medications": string[],
    "summary": string
  },
  "recommended_physical_tests": [
    {
      "name": string,
      "objective": string,
      "region": string,
      "rationale": string,
      "evidence_level": "strong" | "moderate" | "emerging"
    }
  ],
  "biopsychosocial_factors": {
    "psychological": string[],
    "social": string[],
    "occupational": string[],
    "protective_factors": string[],
    "functional_limitations": string[],
    "legal_or_employment_context": string[],
    "patient_strengths": string[]
  }
}

Rules:
- Use Canadian English (en-CA) and cite provincial considerations when relevant (e.g., WSIB in Ontario) inside list items.
- Limit each list item to <= 22 words.
- Do not fabricate information. If unknown, use "" or [].
- LANGUAGE REQUIREMENTS (CRITICAL):
  • NEVER use definitive diagnostic language: "The patient has...", "Diagnosis is...", "This is..."
  • ALWAYS use exposure language: "Patterns consistent with...", "Findings suggest...", "May indicate...", "Consider..."
  • Present multiple differential considerations when appropriate
  • Frame all suggestions as clinical reasoning support, not clinical decisions
  • Use "Observations consistent with..." rather than "Patient presents with..."
- Explicitly evaluate common red flags: unexplained weight loss, night pain, neurological deficits (e.g., saddle anesthesia, foot drop), incontinence, systemic infection signs, major trauma, progressive weakness, history of cancer, anticoagulant use, prolonged steroid use, age >65 with trauma, symptom escalation on rest, medication interactions (especially NSAIDs + SSRIs/SNRIs which increase gastrointestinal bleeding risk - these MUST be flagged in red_flags, not yellow_flags or alert_notes), mental health conditions that may affect treatment adherence or safety (e.g., depression, anxiety - especially when indicated by SSRI/SNRI use), and signs of systemic disease. For each detected red flag, include the clinical concern and whether urgent medical referral is required. Medication interactions between NSAIDs and SSRIs/SNRIs are ALWAYS red flags due to significant gastrointestinal bleeding risk.
- If no red flags are present, state the due diligence performed (e.g., "Screened for malignancy indicators; none reported."). However, ALWAYS check for medication interactions when multiple medications are mentioned, especially NSAIDs combined with SSRIs/SNRIs, as these represent significant clinical risks requiring medical attention. These medication interactions MUST be placed in the red_flags array, not in yellow_flags or alert_notes. Format as: "Medication interaction: [Medication 1] ([class]) + [Medication 2] ([class]) significantly increases [specific risk]. Requires medical monitoring and medication review. Clinical concern: [specific concern]. Medical referral recommended for medication review."
- For medications: Capture complete medication information including name, dosage with units (mg, g, etc.), frequency, and duration when mentioned. CRITICAL: Apply clinical reasoning to correct obvious dosage errors - oral medications are almost never in "grams" (g), they are in "milligrams" (mg). For example: "25 grams" or "25g" for oral medication should be interpreted as "25mg", "50 grams" should be "50mg". Preserve the original mention in context but use corrected dosage in the formatted output. Include both prescription and over-the-counter medications. Format as: "Medication name, dosage, frequency, duration" (e.g., "Ibuprofen, 400mg, every 8 hours, 1 week"). IMPORTANT: Identify potential medication interactions, especially NSAIDs (ibuprofen, naproxen) combined with SSRIs/SNRIs (fluoxetine, sertraline, etc.) which significantly increase risk of gastrointestinal bleeding and require medical monitoring.
- For chief complaint and key findings: Capture the complete clinical picture including precise anatomical location, quality, radiation or referral patterns, temporal evolution (onset, progression, triggers), aggravating and relieving factors, and functional impact. Include both primary symptoms and any secondary or associated symptoms. Note anatomical specificity (e.g., "pain on outside of wrist towards little finger" not just "wrist pain"). Capture symptom progression over time when described.
- For biopsychosocial factors, identify comprehensively:
  • Psychological: distress, anxiety, fear-avoidance, catastrophizing, coping style, mental health diagnoses, emotional responses to pain.
  • Social: family/support network, caregiving load, financial pressure, community resources, living arrangements, social isolation.
  • Occupational: job demands, ergonomics, WSIB context, workload, absenteeism, remote work, return-to-work barriers, work-related injury context, repetitive tasks, equipment use, job-specific activities that aggravate symptoms.
  • Functional limitations: ADLs, gait, sleep disturbance, lifting tolerance, sport/leisure impact, specific activity restrictions, work-related functional limitations, sedentary lifestyle, physical activity levels, exercise habits or lack thereof. CRITICAL: When patient reports "No" to physical activity, exercise, or sports, or indicates lack of physical activity, this MUST be captured as "Sedentary lifestyle: [description]. May impact treatment approach given [related factors]." in functional_limitations.
  • Legal or employment context: litigation, compensation claims, sick leave, employer-accommodation needs, disability claims.
  • Protective factors: resilience, positive beliefs, self-management strategies, supportive relationships, adaptive equipment use (e.g., braces, splints, wrist supports, assistive devices), self-care behaviors, current interventions being used.
  • Patient strengths: adherence, motivation, fitness habits, prior success with rehab, active participation in care.
  • Comorbidities: capture all mentioned medical conditions, chronic diseases, or health factors that may influence treatment (e.g., obesity, diabetes, hypertension, mental health conditions including depression, anxiety) even if not directly related to the chief complaint. Include these in medical_history array. When obesity is mentioned, also consider sedentary lifestyle as a related biopsychosocial factor that may impact treatment approach and functional capacity.
- For recommended physical tests: Consider the complete clinical presentation including pain location, radiation patterns, aggravating activities, functional limitations, and anatomical structures involved. Suggest tests that assess the specific anatomical structures, neural involvement, joint integrity, and functional capacity relevant to the presentation. Include tests for differential diagnosis when appropriate. For wrist/hand presentations, consider: tendinopathies (Finkelstein's, Phalen's, Tinel's), joint stability, neural tension, grip strength, functional range of motion, and provocative maneuvers specific to the reported pain location and distribution. Frame test recommendations as "Consider assessing..." or "Tests that may help evaluate..." rather than "Perform..." or "Test for...".
- For clinical reasoning support: Present observable patterns, literature correlations with evidence levels, potential blind spots or missed considerations, risk factors requiring documentation, and alternative explanations. Always include evidence strength indicators (strong/moderate/emerging) for correlations. Highlight what should NOT be missed (red flags, contraindications, referral triggers). Present multiple differential considerations when clinical presentation could match several conditions.
- Always derive the above from the transcript; if not mentioned, leave arrays empty and note in summary that the element was screened but not reported.
- Pay attention to temporal information throughout the transcript: when symptoms started, how they evolved over time, duration of medication use, timeline of interventions, and progression patterns.
- Capture all mentioned interventions, devices, or self-management strategies (e.g., braces, splints, wrist supports, ice, heat, rest, activity modification, over-the-counter aids) in protective_factors or relevant biopsychosocial categories.
- Provide evidence-based physical tests only when confident. Include sensitivity/specificity or evidence level only if sourced. If unsure, leave the field empty rather than guessing.
- Outline safety/privacy actions that fall within physiotherapy scope (consent, documentation, escalation).
- Output raw JSON only. No prose, markdown, code fences, or explanations.`;

const DEFAULT_INSTRUCTIONS_INITIAL = `Analyse the transcript as a clinical reasoning assistant supporting a Canadian physiotherapist. Expose clinical variables, patterns, and correlations from the patient presentation. Present comprehensive clinical considerations including observable patterns, literature correlations (with evidence levels), potential blind spots, risk factors requiring documentation, and alternative explanations. Recommend evidence-based physiotherapy assessments as considerations, not prescriptions. Summarise biopsychosocial factors comprehensively. Note when medical imaging or physician follow-up is required because findings exceed physiotherapy scope or pose safety risks. Remember: you are exposing information to support clinical reasoning, not making clinical decisions.`;

const DEFAULT_INSTRUCTIONS_FOLLOWUP = `Analyse this FOLLOW-UP visit transcript as a clinical reasoning assistant supporting a Canadian physiotherapist. Focus on PROGRESS ASSESSMENT and CLINICAL CONTINUITY rather than initial evaluation. Expose clinical variables related to: treatment response, symptom progression (improvement/worsening/stability), functional gains or limitations, adherence to previous treatment plan, new concerns or complications, and changes in biopsychosocial factors since the last visit. Present progress-focused clinical considerations including: comparison to baseline, treatment effectiveness indicators, functional improvements or setbacks, adherence patterns, and any new clinical considerations. Recommend evidence-based physiotherapy assessments ONLY if new concerns arise or if progress monitoring requires specific tests. Summarise biopsychosocial factors with emphasis on changes since last visit. Note when medical imaging or physician follow-up is required because findings exceed physiotherapy scope or pose safety risks. Remember: you are exposing information to support clinical reasoning focused on progress assessment, not making clinical decisions.`;

/**
 * Builds capability context (experience level, domain focus, output style).
 * Maximum 4 lines. Affects PRIORITY and LANGUAGE, not total text length.
 */
const buildCapabilityContext = (profile?: ProfessionalProfile | null): string => {
  const capabilities = deriveProfessionalCapabilities(profile);
  
  if (!profile || capabilities.seniority === 'mid' && capabilities.domainFocus === 'general') {
    // Skip if default/mid/general (no meaningful adjustment needed)
    return '';
  }
  
  const styleMap: Record<string, string> = {
    'guiding': 'guided, explanatory',
    'neutral': 'balanced, evidence-focused',
    'terse': 'concise, non-explanatory, clinically prioritized',
  };
  
  return `\n[Clinician Capability Context]
- Experience level: ${capabilities.seniority}
- Primary domain: ${capabilities.domainFocus}
- Expected output style: ${styleMap[capabilities.languageTone]}
`;
};

const buildProfessionalContext = (profile?: ProfessionalProfile | null): string => {
  if (!profile) {
    console.log('🔍 [PROMPT] No professional profile provided');
    return '';
  }
  
  console.log('🔍 [PROMPT] Building professional context from profile:', {
    specialty: profile.specialty,
    professionalTitle: profile.professionalTitle,
    experienceYears: profile.experienceYears,
    clinic: profile.clinic?.name,
    workplace: profile.workplace,
    licenseNumber: profile.licenseNumber
  });
  
  const parts: string[] = [];
  
  // Specialty
  if (profile.specialty) {
    parts.push(`Specialty: ${profile.specialty}`);
  }
  
  // Professional Title
  if (profile.professionalTitle) {
    parts.push(`Title: ${profile.professionalTitle}`);
  }
  
  // Years of Experience
  if (profile.experienceYears) {
    parts.push(`Experience: ${profile.experienceYears} years`);
  }
  
  // Workplace/Clinic
  if (profile.clinic?.name) {
    parts.push(`Clinic: ${profile.clinic.name}`);
  } else if (profile.workplace) {
    parts.push(`Workplace: ${profile.workplace}`);
  }
  
  // License Number (if available)
  if (profile.licenseNumber) {
    parts.push(`License: ${profile.licenseNumber}`);
  }
  
  const context = parts.length > 0 
    ? `\n[Clinician Profile]\n${parts.join('\n')}\n`
    : '';
  
  if (context) {
    console.log('✅ [PROMPT] Professional context added:', context);
  } else {
    console.log('⚠️ [PROMPT] No professional context data available');
  }
  
  return context;
};

/**
 * Build practice preferences context for prompt injection
 * WO-PERS-ONB-PROMPT-01: Inyecta preferencias de práctica del usuario
 * WO-AUTH-GUARD-ONB-DATA-01: Respeta consentimiento personalizationFromClinicianInputs
 */
const buildPracticePreferencesContext = (profile?: ProfessionalProfile | null): string => {
  // WO-AUTH-GUARD-ONB-DATA-01: Verificar consentimiento antes de inyectar
  // @ts-expect-error - dataUseConsent may exist in profile
  const consent = profile?.dataUseConsent;
  if (consent && consent.personalizationFromClinicianInputs === false) {
    // Consentimiento denegado - no inyectar preferencias
    return '';
  }

  // @ts-expect-error - practicePreferences may exist in profile
  const prefs = profile?.practicePreferences;
  
  if (!prefs) {
    // No preferences - omit section (no defaults invented)
    return '';
  }

  const parts: string[] = [];
  
  // Note verbosity
  if (prefs.noteVerbosity) {
    parts.push(`Note verbosity: ${prefs.noteVerbosity}`);
  }
  
  // Tone
  if (prefs.tone) {
    parts.push(`Tone: ${prefs.tone}`);
  }
  
  // Preferred treatments
  if (prefs.preferredTreatments && prefs.preferredTreatments.length > 0) {
    parts.push(`Preferred treatments: ${prefs.preferredTreatments.join(', ')}`);
  }
  
  // Do-not-suggest
  if (prefs.doNotSuggest && prefs.doNotSuggest.length > 0) {
    parts.push(`Do-not-suggest: ${prefs.doNotSuggest.join(', ')}`);
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `\n[Clinician Practice Preferences]\n${parts.join('\n')}\n`;
};

/**
 * WO-AUTH-GUARD-ONB-DATA-01: Validate patient context according to consent
 * If personalizationFromPatientData is false, contextoPaciente should be minimal (transcript only)
 * This function should be called by the caller before passing contextoPaciente
 */
/**
 * WO-AUTH-GUARD-ONB-DATA-01: Validate patient context according to consent
 * If personalizationFromPatientData is false, contextoPaciente should be minimal (transcript only)
 * This function validates but the real filtering should happen where contextoPaciente is constructed
 * (e.g., in vertex-ai-service-firebase.ts or wherever patient history/episodes are added)
 */
export const validatePatientContext = (
  contextoPaciente: string,
  professionalProfile?: ProfessionalProfile | null
): string => {
  // @ts-expect-error - dataUseConsent may exist in profile
  const consent = professionalProfile?.dataUseConsent;
  
  if (consent && consent.personalizationFromPatientData === false) {
    // Consent denied - ensure context is minimal (no history/episodes)
    // If caller passed historical data, this is a safety check
    // Real filtering should happen where contextoPaciente is built
    if (contextoPaciente.toLowerCase().includes('previous') || 
        contextoPaciente.toLowerCase().includes('history') ||
        contextoPaciente.toLowerCase().includes('episode')) {
      // Safety: strip historical references if consent denied
      return "Current session only - no historical data per user consent";
    }
  }
  
  return contextoPaciente;
};

export const buildCanadianPrompt = ({
  contextoPaciente,
  instrucciones,
  transcript,
  professionalProfile,
  visitType = 'initial',
}: CanadianPromptParams): string => {
  const capabilityContext = buildCapabilityContext(professionalProfile);
  const professionalContext = buildProfessionalContext(professionalProfile);
  const practicePreferencesContext = buildPracticePreferencesContext(professionalProfile);
  
  // WO-AUTH-GUARD-ONB-DATA-01: Validate patient context according to consent
  // Note: The caller should filter contextoPaciente before passing it here if personalizationFromPatientData is false
  // This is a safety check - the real filtering should happen where contextoPaciente is constructed
  const validatedPatientContext = validatePatientContext(contextoPaciente, professionalProfile);
  
  // Use follow-up specific instructions if visit type is follow-up
  const defaultInstructions = visitType === 'follow-up' 
    ? DEFAULT_INSTRUCTIONS_FOLLOWUP 
    : DEFAULT_INSTRUCTIONS_INITIAL;
  
  const visitTypeContext = visitType === 'follow-up' 
    ? '\n[Visit Type: FOLLOW-UP - Focus on progress assessment and clinical continuity]\n'
    : '\n[Visit Type: INITIAL ASSESSMENT - Comprehensive clinical evaluation]\n';
  
  return `
${PROMPT_HEADER}${capabilityContext}${professionalContext}${practicePreferencesContext}${visitTypeContext}
[Patient Context]
${validatedPatientContext.trim()}

[Clinical Instructions]
${(instrucciones || defaultInstructions).trim()}

[Transcript]
${transcript.trim()}
`.trim();
};

export const CanadianPromptFactory = {
  create(params: CanadianPromptParams): string {
    return buildCanadianPrompt(params);
  },
};

console.log("[OK] PromptFactory-Canada ready");