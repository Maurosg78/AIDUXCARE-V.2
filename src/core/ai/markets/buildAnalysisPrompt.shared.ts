import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import { deriveProfessionalCapabilities } from '../capabilities/deriveProfessionalCapabilities';
import { getPracticeAreaPromptHint } from '@/core/profile/normalizeProfessionalProfile';

export interface ClinicalAttachment {
  fileName: string;
  fileType: string;
  extractedText?: string;
  pageCount?: number;
  error?: string;
}

export interface AnalysisPromptParams {
  contextoPaciente: string;
  instrucciones?: string;
  transcript: string;
  professionalProfile?: ProfessionalProfile | null;
  visitType?: 'initial' | 'follow-up';
  attachments?: ClinicalAttachment[];
}

type AttachmentCopy = {
  sectionTitle: string;
  attachmentLabel: string;
  typeLabel: string;
  pagesLabel: string;
  extractedLabel: string;
  analysisLabel: string;
  medicationLabel: string;
  referralLine: string;
  findingsLine: string;
  contraindicationsLine: string;
  correlationLine: string;
  discrepancyLine: string;
  medicationLineOne: string;
  medicationLineTwo: string;
  medicationLineThree: string;
  errorNotePrefix: string;
  errorBody: string;
  noTextNote: string;
};

type AnalysisPromptCopy = {
  promptHeader: string;
  defaultInitialInstructions: string;
  defaultFollowUpInstructions: string;
  initialVisitContext: string;
  followUpVisitContext: string;
  patientContextLabel: string;
  clinicalInstructionsLabel: string;
  transcriptLabel: string;
  attachmentCopy: AttachmentCopy;
};

const buildCapabilityContext = (profile?: ProfessionalProfile | null): string => {
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

  const styleMap: Record<string, string> = {
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

const buildProfessionalContext = (profile?: ProfessionalProfile | null): string => {
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

  const parts: string[] = [];

  const hasOtherProfession = profile.profession === 'Other';
  const hasCustomProfession = Boolean(profile.professionOther?.labelForPrompt?.trim());
  const title = hasOtherProfession && hasCustomProfession
    ? profile.professionOther!.labelForPrompt
    : (profile.profession || profile.professionalTitle);

  if (title) {
    parts.push(`Profession: ${title}`);
  }

  if (practiceAreas && practiceAreas.length > 0) {
    const practiceAreaLabels = practiceAreas.map((area) => area.label);
    const joinedPracticeAreas = practiceAreaLabels.join(', ');
    parts.push(`Practice areas: ${joinedPracticeAreas}`);

    const hints = practiceAreas.map((area) => getPracticeAreaPromptHint(area.code));
    const validHints = hints.filter((hint): hint is string => Boolean(hint));
    validHints.forEach((hint) => parts.push(hint));
  } else if (profile.specialty) {
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
  } else if (profile.workplace) {
    parts.push(`Workplace: ${profile.workplace}`);
  }

  if (profile.licenseNumber) {
    parts.push(`License: ${profile.licenseNumber}`);
  }

  const joinedParts = parts.join('\n');
  const context = parts.length > 0 ? `\n[Clinician Profile]\n${joinedParts}\n` : '';

  if (context) {
    console.log('✅ [PROMPT] Professional context added:', context);
  } else {
    console.log('⚠️ [PROMPT] No professional context data available');
  }

  return context;
};

const buildPracticePreferencesContext = (profile?: ProfessionalProfile | null): string => {
  const consent = (profile as any)?.dataUseConsent;

  if (consent && consent.personalizationFromClinicianInputs === false) {
    return '';
  }

  const prefs = (profile as any)?.practicePreferences;

  if (!prefs) {
    return '';
  }

  const parts: string[] = [];

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

export const validatePatientContext = (
  contextoPaciente: string,
  professionalProfile?: ProfessionalProfile | null
): string => {
  const consent = (professionalProfile as any)?.dataUseConsent;
  const normalizedContext = contextoPaciente.toLowerCase();
  const mentionsPrevious = normalizedContext.includes('previous');
  const mentionsHistory = normalizedContext.includes('history');
  const mentionsEpisode = normalizedContext.includes('episode');

  if (consent && consent.personalizationFromPatientData === false && (mentionsPrevious || mentionsHistory || mentionsEpisode)) {
    return 'Current session only - no historical data per user consent';
  }

  return contextoPaciente;
};

// ENGINEERING.md §1.7 — Diagnostic Imaging Scope Boundary
// Marker written by extractScannedPDFWithGemini() in FileProcessorService.ts
const IMAGING_SOURCE_MARKER = '[DOCUMENTO ESCANEADO';

// §1.7 Branch A — Scanned written medical report (application/pdf + OCR marker)
// extractedText is pure OCR of text written by the report author. Explicit fact extraction is required.
const SCANNED_REPORT_OCR_INSTRUCTIONS = `[INFORME ESCANEADO — TEXTO EXTRAÍDO POR OCR]
Este contenido es texto extraído automáticamente de un documento médico escaneado. El texto fue escrito por el profesional autor del informe, no generado por visión automática.
Instrucciones obligatorias:
- Extrae todos los hechos clínicos explícitamente escritos: medicación con dosis, vía y pauta si están escritas; diagnósticos escritos; duración de síntomas; síntomas urgentes explícitamente escritos; hallazgos de exploración escritos; conclusión del informe; recomendaciones escritas.
- Atribuye los datos al informe adjunto usando "según informe adjunto" al citar cualquier hallazgo, medicación o recomendación extraída del documento.
- Si el reconocimiento OCR es incierto o el texto es ilegible, incluye el elemento con requires_review: true en lugar de omitirlo.
- Correlaciona los hechos escritos del informe con la narrativa verbal del paciente en la transcripción.
- NO infieras hallazgos a partir del diseño visual, la maquetación o imágenes incrustadas en el documento.
- Si el informe contiene imágenes diagnósticas incrustadas (RX, RM, ECG), trata únicamente el texto escrito del informe; no interpretes dichas imágenes.`;

// §1.7 Branch B — Diagnostic image file (image/*): AI visual description + OCR merged
// Content may contain AI visual interpretations. Red flags, key findings, and clinical findings are prohibited.
const IMAGING_SCOPE_BOUNDARY_INSTRUCTIONS = `[LÍMITE DE ALCANCE — IMAGEN DIAGNÓSTICA]
Este contenido proviene de una imagen procesada con visión automática. Restricciones obligatorias:
- NO generes red flags a partir de descripciones visuales o inferencias visuales automáticas.
- NO interpretes imágenes diagnósticas.
- NO incluyas observaciones visuales en key_findings, alert_notes ni recommended_physical_tests como hallazgos clínicos.
- NO generes recomendaciones educativas ni de tratamiento basadas en interpretación visual.
- Si el contenido visual parece clínicamente relevante, formula únicamente como "requiere revisión por profesional competente", nunca como hallazgo clínico.
- Si hay texto explícitamente escrito y legible visible en la imagen, extrae únicamente ese texto escrito.`;

// Scanned PDF: application/pdf with OCR marker written by extractScannedPDFWithGemini()
// extractedText is pure OCR of written text — explicit medical facts must be extracted
function isScannedReportAttachment(attachment: ClinicalAttachment): boolean {
  return attachment.fileType === 'application/pdf' &&
    (attachment.extractedText?.includes(IMAGING_SOURCE_MARKER) ?? false);
}

// Image file: fileType is image/* — content includes AI visual description + OCR merge
// Must remain restricted per §1.7: visual descriptions must not become clinical findings
function isVisualImageAttachment(attachment: ClinicalAttachment): boolean {
  return attachment.fileType.startsWith('image/');
}

const buildAttachmentsSection = (attachments: ClinicalAttachment[] | undefined, copy: AttachmentCopy): string => {
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

      if (isScannedReportAttachment(attachment)) {
        // §1.7 Branch A: scanned written report — full explicit fact extraction, OCR uncertainty handled
        section += `${SCANNED_REPORT_OCR_INSTRUCTIONS}\n`;
        section += `\n${copy.medicationLabel}\n`;
        section += `${copy.medicationLineOne}\n`;
        section += `${copy.medicationLineTwo}\n`;
        section += `${copy.medicationLineThree}\n\n`;
      } else if (isVisualImageAttachment(attachment)) {
        // §1.7 Branch B: diagnostic image file — strict guard, no red flags or findings from visual content
        section += `${IMAGING_SCOPE_BOUNDARY_INSTRUCTIONS}\n`;
        section += `\n${copy.medicationLabel}\n`;
        section += `${copy.medicationLineOne}\n`;
        section += `${copy.medicationLineTwo}\n`;
        section += `${copy.medicationLineThree}\n\n`;
      } else {
        // Standard: text-layer PDF — full analysis with red flags permitted
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
      }
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

function deduplicateTranscript(rawTranscript: string): string {
  const sentences = rawTranscript.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const deduplicated: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
    const key = normalized.slice(0, 60);
    if (!seen.has(key) && normalized.length > 10) {
      seen.add(key);
      deduplicated.push(sentence.trim());
    }
  }

  return deduplicated.join(' ');
}

export const buildAnalysisPromptDocument = (
  params: AnalysisPromptParams,
  copy: AnalysisPromptCopy
): string => {
  const visitType = params.visitType || 'initial';
  const capabilityContext = buildCapabilityContext(params.professionalProfile);
  const professionalContext = buildProfessionalContext(params.professionalProfile);
  const practicePreferencesContext = buildPracticePreferencesContext(params.professionalProfile);
  const validatedPatientContext = validatePatientContext(params.contextoPaciente, params.professionalProfile);
  const attachmentsSection = buildAttachmentsSection(params.attachments, copy.attachmentCopy);
  const defaultInstructions = visitType === 'follow-up' ? copy.defaultFollowUpInstructions : copy.defaultInitialInstructions;
  const visitTypeContext = visitType === 'follow-up' ? copy.followUpVisitContext : copy.initialVisitContext;
  const effectiveInstructions = (params.instrucciones || defaultInstructions).trim();
  const rawTranscript = params.transcript.trim();
  const transcript = deduplicateTranscript(rawTranscript);
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
