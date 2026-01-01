import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import { deriveProfessionalCapabilities } from './capabilities/deriveProfessionalCapabilities';

export interface ClinicalAttachment {
  fileName: string;
  fileType: string;
  extractedText?: string;
  pageCount?: number;
  error?: string;
}

export interface CanadianPromptParams {
  contextoPaciente: string;
  instrucciones?: string;
  transcript: string;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
  attachments?: ClinicalAttachment[];
}

const PROMPT_HEADER = `AiDuxCare copilot for Canadian PTs. CPO scope. PHIPA/PIPEDA compliant.
CORE: Expose clinical variables. Never diagnose. Present differential considerations. Highlight when medical referral needed.
Output JSON: {medicolegal_alerts:{red_flags:[],yellow_flags:[],legal_exposure:"low|moderate|high",alert_notes:[]},conversation_highlights:{chief_complaint:"",key_findings:[],medical_history:[],medications:[],summary:""},recommended_physical_tests:[{name:"",objective:"",region:"",rationale:"",evidence_level:"strong|moderate|emerging",sensitivity:"numeric(0-1)|qualitative(high|moderate|low)|unknown",specificity:"numeric(0-1)|qualitative(high|moderate|low)|unknown",source:"PhysioTutor|literature|clinical_reasoning|unknown"}],biopsychosocial_factors:{psychological:[],social:[],occupational:[],protective_factors:[],functional_limitations:[],legal_or_employment_context:[],patient_strengths:[]}}

Rules: EN-CA. CONCISE: Target 8-12 words/item, max 15 words. Exposure lang ("suggest/consider", NOT "is/has"). Cite provincial (WSIB). No fabrication.

LANGUAGE STANDARDS (CAPR/CPO Compliance):
- AVOID abbreviations: Use full words (e.g., "range of motion" not "ROM", "activities of daily living" not "ADLs", "low back pain" not "LBP", "physical therapy" not "PT", "as soon as possible" not "ASAP"). Only use standard medical abbreviations when absolutely necessary and only after first defining them.
- Professional terminology: Use complete, clear clinical language aligned with Canadian Physiotherapy Association (CPA) and College of Physiotherapists of Ontario (CPO) documentation standards.
- Clarity over brevity: Prioritize clarity and professional communication over space-saving abbreviations.

CONCISION RULES (NEW):
- Format: "[Clinical finding] - [implication], [action]" NOT "[Label]: [Long description], [more description]. [Full sentence action]."
- Examples:
  ✅ "Right toe numbness - neurological evaluation required"
  ❌ "Neurological deficits: Right toe numbness, suggesting potential nerve root involvement. Requires further medical investigation."
  ✅ "Acetaminophen 5g/day exceeds safe limit - urgent medical review"
  ❌ "Medication overdose risk: Acetaminophen 5 grams daily, exceeding safe limits. Urgent medical referral for review."

ANTI-REDUNDANCY RULES (NEW):
Each fact appears in ONE primary location only:
- chief_complaint: Main reason for visit. Full symptom description.
- key_findings: Unique clinical observations NOT already in chief_complaint. Post-surgical status, postural findings, examination findings.
- medical_history: Past medical events only. Do NOT repeat current symptoms.
- medications: Full list with doses. Reference here only.
- red_flags: Risk implications. Reference meds if needed, do NOT repeat full doses.
- yellow_flags: Psychosocial risk factors. Do NOT repeat symptoms from chief_complaint.
- alert_notes: Synthesis of red flags ONLY if critical. Do NOT repeat every red flag.
- summary: Brief 1-sentence overview. Do NOT repeat everything above.

PHYSICAL TESTS SCORING REQUIREMENT (CRITICAL - ANTI-HALLUCINATION ENFORCED):
For each recommended physical test, ALWAYS attempt to provide sensitivity and specificity values from reliable sources. This is essential for clinical prioritization and evidence-based practice.

CRITICAL ANTI-HALLUCINATION RULES (MUST FOLLOW):
- ONLY provide values if you have a reliable source (PhysioTutor, Cochrane Review with year, systematic review, meta-analysis, clinical guideline with organization name)
- If no reliable source is available, respond with: "sensitivity": "unknown", "specificity": "unknown"
- NEVER estimate, invent, or fabricate values without a verifiable source
- NEVER create fake citations or invent study references
- Qualitative values ("high", "moderate", "low") are acceptable ONLY if from a reliable source (not estimated by you)
- ALWAYS include source attribution when providing values: "source": "PhysioTutor - [specific section/topic]", "source": "Cochrane Review 2023", "source": "systematic_review_[author/year]", "source": "CPA_guideline_2022"
- If source is not available, use: "source": "unknown"
- If you provide values without a source, the system will flag them as potential hallucinations and discard them

Preferred sources (in order of reliability):
1. PhysioTutor (trauma/orthopedic tests) - highest priority for MSK tests
2. Cochrane Reviews (include year: "Cochrane Review 2023")
3. Systematic reviews and meta-analyses (include author/year when possible: "Smith et al. 2022 systematic review")
4. Clinical guidelines (CPA, CPO, CAPR) - include organization and year: "CPA_guideline_2022"
5. Peer-reviewed journal articles (include year: "Journal of Physiotherapy 2023")

Fallback strategy (MUST FOLLOW IN ORDER):
1. Search PhysioTutor first (for trauma/orthopedic tests)
2. Search Cochrane Reviews (include year if found)
3. Search systematic reviews/meta-analyses (include citation when possible)
4. Search clinical guidelines (CPA, CPO, CAPR)
5. If no data found in any reliable source → use "unknown" (DO NOT estimate)

CRITICAL INSTRUCTIONS:
- Red flags: Unexplained weight loss, night pain, neurological deficits, incontinence, systemic infection, major trauma, progressive weakness, cancer history, anticoagulants, steroids, age >65 trauma, symptom escalation on rest, medication interactions (NSAIDs+SSRIs/SNRIs MUST be red_flags, not yellow_flags). Include clinical concern and referral urgency.
- Medications: Format as "name, dosage (units), frequency, duration". Correct dosage errors (oral meds are mg, not g). Flag interactions (NSAIDs+SSRIs/SNRIs = red flag).
- Chief complaint: Capture precise anatomical location, quality, radiation, temporal evolution (onset/progression/triggers), aggravating/relieving factors, functional impact. Include intensity scales and active symptoms.
- Physical tests: Consider anatomical structures, neural involvement (specify relevant spinal/neural levels when indicated by presentation, e.g., dermatomes, myotomes, specific spinal segments), joint integrity, functional capacity. Frame as "Consider assessing..." not "Perform...".
- Temporal info: Capture when symptoms started, evolution over time, medication duration, intervention timelines, progression patterns.
- Biopsychosocial: Comprehensive capture of psychological, social, occupational, functional limitations, protective factors, patient strengths, legal/employment context.`;

EMPTY FIELD RULES (NEW):
- If no information provided for a field → OMIT that field entirely from JSON
- Do NOT add speculative statements like "Not specified, but..."
- Examples:
  ❌ "occupational": ["Not specified, but chronic pain may impact work capacity."]
  ✅ // Field omitted entirely
  ❌ "legal_or_employment_context": ["Not specified."]
  ✅ // Field omitted entirely`;

const DEFAULT_INSTRUCTIONS_INITIAL = `Analyse the transcript as a clinical reasoning assistant supporting a Canadian physiotherapist. Expose clinical variables, patterns, and correlations from the patient presentation. Present comprehensive clinical considerations including observable patterns, literature correlations (with evidence levels), potential blind spots, risk factors requiring documentation, and alternative explanations. Recommend evidence-based physiotherapy assessments as considerations, not prescriptions. Summarise biopsychosocial factors comprehensively. Note when medical imaging or physician follow-up is required because findings exceed physiotherapy scope or pose safety risks. 

CRITICAL DISTRIBUTION RULES:
- chief_complaint: Current presenting symptoms with full detail
- key_findings: Clinical observations NOT already in chief_complaint
- summary: Synthesize in 1-2 sentences. Do NOT copy chief_complaint verbatim

CONCISE CLINICAL LANGUAGE:
- Target: 8-12 words per red/yellow flag
- Format: "[Finding] - [implication], [action]"
- Eliminate: "suggesting potential", "Requires further", "indicating complex"

EMPTY FIELDS:
- If no work/occupation info → omit "occupational" field entirely
- If no legal context → omit "legal_or_employment_context" field entirely

Use full words, avoid abbreviations per CAPR/CPO standards. Remember: you are exposing information to support clinical reasoning, not making clinical decisions.`;

const DEFAULT_INSTRUCTIONS_FOLLOWUP = `Analyse this FOLLOW-UP visit transcript as a clinical reasoning assistant supporting a Canadian physiotherapist. Focus on PROGRESS ASSESSMENT and CLINICAL CONTINUITY rather than initial evaluation. Expose clinical variables related to: treatment response, symptom progression (improvement/worsening/stability), functional gains or limitations, adherence to previous treatment plan, new concerns or complications, and changes in biopsychosocial factors since the last visit. Present progress-focused clinical considerations including: comparison to baseline, treatment effectiveness indicators, functional improvements or setbacks, adherence patterns, and any new clinical considerations. Recommend evidence-based physiotherapy assessments ONLY if new concerns arise or if progress monitoring requires specific tests. Summarise biopsychosocial factors with emphasis on changes since last visit. Note when medical imaging or physician follow-up is required because findings exceed physiotherapy scope or pose safety risks. 

CRITICAL: ALWAYS include an updated treatment plan based on progress assessment. Modify or continue the treatment plan based on patient response, update goals (short-term and long-term) as needed, adjust interventions based on progress, reinforce or modify patient education, update home exercise program, and adjust follow-up recommendations. 

CRITICAL DISTRIBUTION RULES:
- Focus on CHANGES since last visit, not repeating baseline
- key_findings: New observations or changes in status only
- summary: Progress-focused synthesis. Do NOT repeat initial assessment

CONCISE CLINICAL LANGUAGE:
- Target: 8-12 words per red/yellow flag
- Format: "[Finding] - [implication], [action]"
- Eliminate: "suggesting potential", "Requires further", "indicating complex"

EMPTY FIELDS:
- If no work/occupation info → omit "occupational" field entirely
- If no legal context → omit "legal_or_employment_context" field entirely

Use full words, avoid abbreviations per CAPR/CPO standards. Remember: you are exposing information to support clinical reasoning focused on progress assessment, not making clinical decisions.`;

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

const buildAttachmentsSection = (attachments?: ClinicalAttachment[]): string => {
  if (!attachments || attachments.length === 0) {
    return '';
  }

  let section = '\n## CLINICAL ATTACHMENTS\n\n';
  
  attachments.forEach((attachment, index) => {
    section += `### Attachment ${index + 1}: ${attachment.fileName}\n`;
    section += `Type: ${attachment.fileType}\n`;
    
    if (attachment.pageCount) {
      section += `Pages: ${attachment.pageCount}\n`;
    }
    
    if (attachment.extractedText) {
      section += `\n**EXTRACTED CONTENT:**\n\`\`\`\n${attachment.extractedText}\n\`\`\`\n\n`;
      section += `**CRITICAL ANALYSIS REQUIRED:**\n`;
      section += `- Identify red flags requiring immediate referral\n`;
      section += `- Note diagnostic findings requiring action\n`;
      section += `- Identify contraindications to proposed treatment\n`;
      section += `- Correlate findings with patient presentation\n`;
      section += `- Flag any discrepancies between report and symptoms\n\n`;
    } else if (attachment.error) {
      section += `\n⚠️ **NOTE:** Could not extract text from this file (${attachment.error}).\n`;
      section += `Document was uploaded but content not analyzed.\n\n`;
    } else {
      section += `\n**NOTE:** No text content extracted.\n\n`;
    }
  });
  
  return section;
};

export const buildCanadianPrompt = ({
  contextoPaciente,
  instrucciones,
  transcript,
  professionalProfile,
  visitType = 'initial',
  attachments,
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
  
  const attachmentsSection = buildAttachmentsSection(attachments);
  
  return `
${PROMPT_HEADER}${capabilityContext}${professionalContext}${practicePreferencesContext}${visitTypeContext}
[Patient Context]
${validatedPatientContext.trim()}

[Clinical Instructions]
${(instrucciones || defaultInstructions).trim()}
${attachmentsSection}
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
