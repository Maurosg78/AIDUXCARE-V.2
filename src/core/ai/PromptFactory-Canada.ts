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
 * @deprecated - Replaced by buildMicroContext() for token efficiency
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

/**
 * @deprecated - Replaced by buildMicroContext() for token efficiency
 */
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
 * Builds minimal context only when NOT default.
 * Returns empty string if all values are default.
 * 
 * @param profile - Professional profile
 * @returns Compact context string (0-3 lines)
 */
const buildMicroContext = (profile?: ProfessionalProfile | null): string => {
  if (!profile) return '';
  
  const microFlags: string[] = [];
  
  // Experience level: Only if junior (<3y) or senior (>8y)
  const experienceYears = typeof profile.experienceYears === 'string'
    ? parseInt(profile.experienceYears, 10)
    : (profile.experienceYears ?? 0);
  
  if (experienceYears < 3) {
    microFlags.push('Junior-guide');
  } else if (experienceYears >= 10) {
    microFlags.push('Senior-terse');
  }
  // Mid (3-9 years) = default, no flag needed
  
  // Specialty: Only if NOT General or MSK
  if (profile.specialty && 
      !['General', 'MSK', 'Musculoskeletal'].includes(profile.specialty)) {
    microFlags.push(profile.specialty);
  }
  
  // Exclusions: Only if they exist
  if (profile.excludedTechniques && profile.excludedTechniques.length > 0) {
    const excluded = profile.excludedTechniques.join(',');
    microFlags.push(`Exclude:${excluded}`);
  }
  
  // Return as compact format
  return microFlags.length > 0 
    ? `\n[${microFlags.join('][')}]\n`
    : '';
};

export const buildCanadianPrompt = ({
  contextoPaciente,
  instrucciones,
  transcript,
  professionalProfile,
  visitType = 'initial',
}: CanadianPromptParams): string => {
  const microContext = buildMicroContext(professionalProfile);
  
  const defaultInstructions = visitType === 'follow-up' 
    ? DEFAULT_INSTRUCTIONS_FOLLOWUP 
    : DEFAULT_INSTRUCTIONS_INITIAL;
  
  const visitTypeFlag = visitType === 'follow-up' ? '[Follow-up]' : '';
  
  return `
${PROMPT_HEADER}${microContext}${visitTypeFlag}

Patient: ${contextoPaciente.trim()}

${(instrucciones || defaultInstructions).trim()}

Transcript:
${transcript.trim()}
`.trim();
};

export const CanadianPromptFactory = {
  create(params: CanadianPromptParams): string {
    return buildCanadianPrompt(params);
  },
};

console.log("[OK] PromptFactory-Canada ready");