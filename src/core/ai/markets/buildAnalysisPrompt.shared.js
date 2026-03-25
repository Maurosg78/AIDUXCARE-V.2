import { deriveProfessionalCapabilities } from '../capabilities/deriveProfessionalCapabilities';
import { getPracticeAreaPromptHint } from '@/core/profile/normalizeProfessionalProfile';
const buildCapabilityContext = (profile) => {
    const capabilities = deriveProfessionalCapabilities(profile);
    const isDefaultSeniority = capabilities.seniority === 'mid';
    const isDefaultDomain = capabilities.domainFocus === 'general';
    if (!profile && isDefaultSeniority && isDefaultDomain) {
        return '';
    }
    if (!profile && !isDefaultSeniority) {
        return '';
    }
    if (!profile && !isDefaultDomain) {
        return '';
    }
    if (!profile) {
        return '';
    }
    const styleMap = {
        guiding: 'guided, explanatory',
        neutral: 'balanced, evidence-focused',
        terse: 'concise, non-explanatory, clinically prioritized',
    };
    const outputStyle = styleMap[capabilities.languageTone];
    return `\n[Clinician Capability Context]
- Experience level: ${capabilities.seniority}
- Primary domain: ${capabilities.domainFocus}
- Expected output style: ${outputStyle}
`;
};
const buildProfessionalContext = (profile) => {
    if (!profile) {
        console.log('🔍 [PROMPT] No professional profile provided');
        return '';
    }
    const practiceAreas = profile.practiceAreas && profile.practiceAreas.length > 0 ? profile.practiceAreas : null;
    const techniques = profile.techniques && profile.techniques.length > 0 ? profile.techniques : null;
    console.log('🔍 [PROMPT] Building professional context from profile:', {
        specialty: profile.specialty,
        practiceAreasCount: practiceAreas?.length ?? 0,
        techniquesCount: techniques?.length ?? 0,
        professionalTitle: profile.professionalTitle,
        experienceYears: profile.experienceYears,
        clinic: profile.clinic?.name,
        workplace: profile.workplace,
        licenseNumber: profile.licenseNumber,
    });
    const parts = [];
    const hasOtherProfession = profile.profession === 'Other';
    const hasCustomProfession = Boolean(profile.professionOther?.labelForPrompt?.trim());
    const title = hasOtherProfession && hasCustomProfession
        ? profile.professionOther.labelForPrompt
        : (profile.profession || profile.professionalTitle);
    if (title) {
        parts.push(`Profession: ${title}`);
    }
    if (practiceAreas && practiceAreas.length > 0) {
        const practiceAreaLabels = practiceAreas.map((area) => area.label);
        const joinedPracticeAreas = practiceAreaLabels.join(', ');
        parts.push(`Practice areas: ${joinedPracticeAreas}`);
        const hints = practiceAreas.map((area) => getPracticeAreaPromptHint(area.code));
        const validHints = hints.filter((hint) => Boolean(hint));
        validHints.forEach((hint) => parts.push(hint));
    }
    else if (profile.specialty) {
        parts.push(`Specialty: ${profile.specialty}`);
    }
    if (techniques && techniques.length > 0) {
        const techniqueLabels = techniques.map((technique) => technique.label);
        const joinedTechniques = techniqueLabels.join(', ');
        parts.push(`Main techniques: ${joinedTechniques}`);
    }
    if (profile.experienceYears) {
        parts.push(`Experience: ${profile.experienceYears} years`);
    }
    if (profile.clinic?.name) {
        parts.push(`Clinic: ${profile.clinic.name}`);
    }
    else if (profile.workplace) {
        parts.push(`Workplace: ${profile.workplace}`);
    }
    if (profile.licenseNumber) {
        parts.push(`License: ${profile.licenseNumber}`);
    }
    const joinedParts = parts.join('\n');
    const context = parts.length > 0 ? `\n[Clinician Profile]\n${joinedParts}\n` : '';
    if (context) {
        console.log('✅ [PROMPT] Professional context added:', context);
    }
    else {
        console.log('⚠️ [PROMPT] No professional context data available');
    }
    return context;
};
const buildPracticePreferencesContext = (profile) => {
    const consent = profile?.dataUseConsent;
    if (consent && consent.personalizationFromClinicianInputs === false) {
        return '';
    }
    const prefs = profile?.practicePreferences;
    if (!prefs) {
        return '';
    }
    const parts = [];
    if (prefs.noteVerbosity) {
        parts.push(`Note verbosity: ${prefs.noteVerbosity}`);
    }
    if (prefs.tone) {
        parts.push(`Tone: ${prefs.tone}`);
    }
    if (prefs.preferredTreatments && prefs.preferredTreatments.length > 0) {
        const preferredTreatments = prefs.preferredTreatments.join(', ');
        parts.push(`Preferred treatments: ${preferredTreatments}`);
    }
    if (prefs.doNotSuggest && prefs.doNotSuggest.length > 0) {
        const doNotSuggest = prefs.doNotSuggest.join(', ');
        parts.push(`Do-not-suggest: ${doNotSuggest}`);
    }
    if (parts.length === 0) {
        return '';
    }
    const joinedParts = parts.join('\n');
    return `\n[Clinician Practice Preferences]\n${joinedParts}\n`;
};
export const validatePatientContext = (contextoPaciente, professionalProfile) => {
    const consent = professionalProfile?.dataUseConsent;
    const normalizedContext = contextoPaciente.toLowerCase();
    const mentionsPrevious = normalizedContext.includes('previous');
    const mentionsHistory = normalizedContext.includes('history');
    const mentionsEpisode = normalizedContext.includes('episode');
    if (consent && consent.personalizationFromPatientData === false && (mentionsPrevious || mentionsHistory || mentionsEpisode)) {
        return 'Current session only - no historical data per user consent';
    }
    return contextoPaciente;
};
const buildAttachmentsSection = (attachments, copy) => {
    if (!attachments || attachments.length === 0) {
        return '';
    }
    let section = copy.sectionTitle;
    attachments.forEach((attachment, index) => {
        const attachmentNumber = index + 1;
        section += `### ${copy.attachmentLabel} ${attachmentNumber}: ${attachment.fileName}\n`;
        section += `${copy.typeLabel}: ${attachment.fileType}\n`;
        if (attachment.pageCount) {
            section += `${copy.pagesLabel}: ${attachment.pageCount}\n`;
        }
        if (attachment.extractedText) {
            section += `\n${copy.extractedLabel}\n\`\`\`\n${attachment.extractedText}\n\`\`\`\n\n`;
            section += `${copy.analysisLabel}\n`;
            section += `${copy.referralLine}\n`;
            section += `${copy.findingsLine}\n`;
            section += `${copy.contraindicationsLine}\n`;
            section += `${copy.correlationLine}\n`;
            section += `${copy.discrepancyLine}\n`;
            section += `\n${copy.medicationLabel}\n`;
            section += `${copy.medicationLineOne}\n`;
            section += `${copy.medicationLineTwo}\n`;
            section += `${copy.medicationLineThree}\n\n`;
            return;
        }
        if (attachment.error) {
            section += `\n${copy.errorNotePrefix} (${attachment.error}).\n`;
            section += `${copy.errorBody}\n\n`;
            return;
        }
        section += `\n${copy.noTextNote}\n\n`;
    });
    return section;
};
export const buildAnalysisPromptDocument = (params, copy) => {
    const visitType = params.visitType || 'initial';
    const capabilityContext = buildCapabilityContext(params.professionalProfile);
    const professionalContext = buildProfessionalContext(params.professionalProfile);
    const practicePreferencesContext = buildPracticePreferencesContext(params.professionalProfile);
    const validatedPatientContext = validatePatientContext(params.contextoPaciente, params.professionalProfile);
    const attachmentsSection = buildAttachmentsSection(params.attachments, copy.attachmentCopy);
    const defaultInstructions = visitType === 'follow-up' ? copy.defaultFollowUpInstructions : copy.defaultInitialInstructions;
    const visitTypeContext = visitType === 'follow-up' ? copy.followUpVisitContext : copy.initialVisitContext;
    const effectiveInstructions = (params.instrucciones || defaultInstructions).trim();
    const transcript = params.transcript.trim();
    const patientContext = validatedPatientContext.trim();
    return `
${copy.promptHeader}${capabilityContext}${professionalContext}${practicePreferencesContext}${visitTypeContext}
[${copy.patientContextLabel}]
${patientContext}

[${copy.clinicalInstructionsLabel}]
${effectiveInstructions}
${attachmentsSection}
[${copy.transcriptLabel}]
${transcript}
`.trim();
};
