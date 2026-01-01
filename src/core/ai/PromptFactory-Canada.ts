import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import { deriveProfessionalCapabilities } from './capabilities/deriveProfessionalCapabilities';

export interface CanadianPromptParams {
  contextoPaciente: string;
  instrucciones?: string;
  transcript: string;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
}

const PROMPT_HEADER = `AiDuxCare copilot for Canadian PTs. CPO scope. PHIPA/PIPEDA compliant.
CORE: Expose clinical variables. Never diagnose. Present differential considerations. Highlight when medical referral needed.
Output JSON: {medicolegal_alerts:{red_flags:[],yellow_flags:[],legal_exposure:"low|moderate|high",alert_notes:[]},conversation_highlights:{chief_complaint:"",key_findings:[],medical_history:[],medications:[],summary:""},recommended_physical_tests:[{name:"",objective:"",region:"",rationale:"",evidence_level:"strong|moderate|emerging"}],biopsychosocial_factors:{psychological:[],social:[],occupational:[],protective_factors:[],functional_limitations:[],legal_or_employment_context:[],patient_strengths:[]}}

Rules: EN-CA. Max 22w/item. Exposure lang ("suggest/consider", NOT "is/has"). Cite provincial (WSIB). No fabrication.

CRITICAL INSTRUCTIONS:
- Red flags: Unexplained weight loss, night pain, neurological deficits, incontinence, systemic infection, major trauma, progressive weakness, cancer history, anticoagulants, steroids, age >65 trauma, symptom escalation on rest, medication interactions (NSAIDs+SSRIs/SNRIs MUST be red_flags, not yellow_flags). Include clinical concern and referral urgency.
- Medications: Format as "name, dosage (units), frequency, duration". Correct dosage errors (oral meds are mg, not g). Flag interactions (NSAIDs+SSRIs/SNRIs = red flag).
- Chief complaint: Capture precise anatomical location, quality, radiation, temporal evolution (onset/progression/triggers), aggravating/relieving factors, functional impact. Include intensity scales and active symptoms.
- Physical tests: Consider anatomical structures, neural involvement (specify relevant spinal/neural levels when indicated by presentation, e.g., dermatomes, myotomes, specific spinal segments), joint integrity, functional capacity. Frame as "Consider assessing..." not "Perform...".
- Temporal info: Capture when symptoms started, evolution over time, medication duration, intervention timelines, progression patterns.
- Biopsychosocial: Comprehensive capture of psychological, social, occupational, functional limitations, protective factors, patient strengths, legal/employment context.`;

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
