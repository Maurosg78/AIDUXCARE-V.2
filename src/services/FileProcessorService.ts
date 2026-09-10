import { extractTextFromPDF, isValidPDF, renderPDFPagesAsBase64, SCANNED_PDF_ERROR } from './pdfTextExtractor';
import { buildAuthenticatedJsonHeaders } from './firebaseAuthHeaders';
import type { AttachmentPatientIdentityStatus } from './clinicalAttachmentService';
import { safeLogger } from '../utils/safeLogger';

export interface ProcessedFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText?: string;
  detectedPatientName?: string | null;
  patientIdentityStatus?: AttachmentPatientIdentityStatus;
  clinicalContextStatus?: 'accepted_ocr_text' | 'rejected_no_text' | 'visual_reference_only';
  clinicalAttachmentKind?: ClinicalAttachmentKind;
  clinicalContextMessage?: {
    esES: string;
    enCA: string;
  };
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
  };
  error?: string;
  downloadURL: string;
}

// WO-IMAGE-OCR-001: Gemini Vision OCR configuration
const getEnv = (): Record<string, string> => {
  // Guarded access for SSR / non-browser contexts
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env as unknown as Record<string, string>;
  }
  return {};
};

const env = getEnv();

// Use same proxy function as the rest of the app (vertexAIProxy)
const VERTEX_PROXY_URL =
  env.VITE_VERTEX_PROXY_URL ||
  'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';

// Reuse assistant model configuration (defaults to Gemini 2.5 Flash)
const GEMINI_OCR_MODEL = env.VITE_AIDUX_ASSISTANT_MODEL || 'gemini-2.5-flash';

const IMAGE_OCR_PROMPT =
  'You are a medical document OCR system. Extract ALL text from this medical image exactly as written. ' +
  'Include all findings, measurements, diagnoses, and clinical data. Return only the extracted text, no commentary.';

const IMAGE_NON_DIAGNOSTIC_DISCLAIMER =
  'Imagen sugerente de hallazgos visibles; no constituye diagnóstico.';

const NO_EXTRACTABLE_TEXT_MESSAGE_ES =
  'Esta imagen no contiene texto extraíble. Puede conservarla como referencia visual, pero no se incluirá en el análisis clínico. Para incorporarla al razonamiento, adjunte el informe escrito del radiólogo.';

const NO_EXTRACTABLE_TEXT_MESSAGE_EN =
  'This image contains no extractable text. It has been saved as a visual reference only and will not be included in the clinical analysis. To incorporate imaging findings, please attach the written radiology report.';

const VISUAL_REFERENCE_ONLY_MESSAGE_ES =
  'Imagen guardada como referencia visual contextual. No será interpretada diagnósticamente ni incluida en el análisis clínico automático. Si quieres que su contenido influya en la nota, descríbelo durante la sesión o adjunta un informe escrito.';

const VISUAL_REFERENCE_ONLY_MESSAGE_EN =
  'Image saved as a contextual visual reference. It will not be diagnostically interpreted or included in the automatic clinical analysis. If you want its content to inform the note, describe it during the session or attach a written report.';

const RESTRICTED_SURFACE_MESSAGE_ES =
  'Imagen guardada como referencia visual de superficie corporal. AiduxCare no interpreta piel, heridas, cicatrices, coloración, hematomas, edema ni signos dermatológicos o vasculares. Se usará solo lo descrito por el profesional.';

const RESTRICTED_SURFACE_MESSAGE_EN =
  'Image saved as a body-surface visual reference. AiduxCare does not interpret skin, wounds, scars, coloration, bruising, edema, or dermatologic/vascular signs. Only clinician-described content will be used.';

const PHYSIO_ULTRASOUND_MESSAGE_ES =
  'Ecografía musculoesquelética guardada como evaluación instrumental del fisioterapeuta. AiduxCare no interpreta la imagen; solo usará la descripción clínica aportada por el profesional o texto escrito adjunto.';

const PHYSIO_ULTRASOUND_MESSAGE_EN =
  'Musculoskeletal ultrasound saved as a physiotherapist instrumental assessment. AiduxCare does not interpret the image; only clinician-provided description or attached written text will be used.';

type ClinicalAttachmentKind =
  | 'written_report'
  | 'diagnostic_image'
  | 'diagnostic_study'
  | 'physio_ultrasound_assessment'
  | 'clinical_context_photo'
  | 'restricted_body_surface_photo'
  | 'unknown_image';

const DIAGNOSTIC_IMAGE_NAME_KEYWORDS = [
  'rx',
  'radiografia',
  'radiografía',
  'xray',
  'x-ray',
  'rayos',
  'radiology',
  'radiologia',
  'radiología',
  'mri',
  'rmn',
  'resonancia',
  'ct',
  'tac',
  'scanner',
  'scan',
  'mamografia',
  'mamografía',
  'mammography',
  'densitometria',
  'densitometría',
  'dexa',
  'gammagrafia',
  'gammagrafía',
  'pet',
  'spect',
];

const DIAGNOSTIC_STUDY_NAME_KEYWORDS = [
  'ecocardiograma',
  'echocardiogram',
  'ecodoppler',
  'doppler',
  'eeg',
  'electroencefalograma',
  'ecg',
  'ekg',
  'electrocardiograma',
  'emg',
  'electromiografia',
  'electromiografía',
  'holter',
  'espirometria',
  'espirometría',
  'spirometry',
  'audiometria',
  'audiometría',
];

const PHYSIO_ULTRASOUND_NAME_KEYWORDS = [
  'ecografia_msk',
  'ecografía_msk',
  'eco_msk',
  'msk_ultrasound',
  'musculoskeletal_ultrasound',
  'ecografia_musculoesqueletica',
  'ecografía_musculoesquelética',
  'ecografia_musculoesquelética',
  'ecografía_musculoesqueletica',
  'ecografia_fisio',
  'ecografía_fisio',
  'ecoguiada',
  'epi',
  'electrolisis',
  'electrólisis',
];

const RESTRICTED_SURFACE_NAME_KEYWORDS = [
  'piel',
  'skin',
  'herida',
  'wound',
  'ulcera',
  'úlcera',
  'ulcer',
  'cicatriz',
  'scar',
  'edema',
  'hematoma',
  'bruise',
  'eritema',
  'erythema',
  'rash',
  'dermat',
  'vascular',
  'coloracion',
  'coloración',
  'lesion_cutanea',
  'lesión_cutánea',
];

const CLINICAL_CONTEXT_PHOTO_NAME_KEYWORDS = [
  'ejercicio',
  'exercise',
  'rehab',
  'rehabilitacion',
  'rehabilitación',
  'postura',
  'posture',
  'ergonomia',
  'ergonomía',
  'ergonomic',
  'vendaje',
  'bandage',
  'taping',
  'kinesiotape',
  'ortesis',
  'órtesis',
  'brace',
  'setup',
  'tratamiento',
  'treatment',
  'bird-dog',
  'birddog',
];

const CLINICAL_KEYWORDS = [
  'fractura',
  'radiografía',
  'rx',
  'muñeca',
  'mano',
  'cúbito',
  'cubito',
  'radio',
  'carpo',
  'osteosíntesis',
  'placa',
  'tornillo',
  'edema',
  'alineación',
  'desplazamiento',
  'consolidación',
  'cartílago',
  'cartilago',
  'estiloides',
  'densidad',
  'calcificación',
  'calcificacion',
  'material',
];

export function isLowSignalImageExtraction(value: string): boolean {
  const rawValue = typeof value === 'string' ? value : '';
  const trimmedValue = rawValue.trim();
  const normalizedWhitespace = trimmedValue.replace(/\s+/g, ' ');
  const alphanumericCharacters = normalizedWhitespace.replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ]/g, '');
  const hasVeryShortText = normalizedWhitespace.length < 24;
  const hasVeryFewAlphanumericCharacters = alphanumericCharacters.length < 8;
  return hasVeryShortText || hasVeryFewAlphanumericCharacters;
}

export function scoreImageExtractionUtility(value: string): number {
  const rawValue = typeof value === 'string' ? value : '';
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return 0;
  }

  const normalizedValue = trimmedValue.toLowerCase();
  const normalizedWithoutDisclaimer = normalizedValue
    .replace(IMAGE_NON_DIAGNOSTIC_DISCLAIMER.toLowerCase(), '')
    .trim();
  const compactValue = normalizedWithoutDisclaimer.replace(/\s+/g, ' ');
  const clinicalKeywordMatches = CLINICAL_KEYWORDS.filter((keyword) => compactValue.includes(keyword)).length;
  const hasEnoughLength = compactValue.length >= 80;
  const hasStrongLength = compactValue.length >= 160;
  const hasBulletLikeStructure = compactValue.includes(':') || compactValue.includes('\n');

  let score = 0;
  if (hasEnoughLength) {
    score += 2;
  }
  if (hasStrongLength) {
    score += 1;
  }
  if (clinicalKeywordMatches > 0) {
    score += Math.min(clinicalKeywordMatches, 4);
  }
  if (hasBulletLikeStructure) {
    score += 1;
  }
  if (isLowSignalImageExtraction(compactValue)) {
    score -= 3;
  }

  return Math.max(score, 0);
}

function ensureImageDisclaimer(value: string): string {
  const rawValue = typeof value === 'string' ? value : '';
  const trimmedValue = rawValue.trim();
  const hasDisclaimer = trimmedValue.includes(IMAGE_NON_DIAGNOSTIC_DISCLAIMER);
  if (!trimmedValue) {
    return IMAGE_NON_DIAGNOSTIC_DISCLAIMER;
  }
  if (hasDisclaimer) {
    return trimmedValue;
  }
  const normalizedValue = `${trimmedValue}\n${IMAGE_NON_DIAGNOSTIC_DISCLAIMER}`;
  return normalizedValue;
}

function stripImageDisclaimer(value: string): string {
  const rawValue = typeof value === 'string' ? value : '';
  const withoutDisclaimer = rawValue.replace(IMAGE_NON_DIAGNOSTIC_DISCLAIMER, '');
  const trimmedValue = withoutDisclaimer.trim();
  return trimmedValue;
}

export function mergeImageExtractionResults(
  visualExtraction: string,
  ocrExtraction: string | null,
): string {
  const hasMissingOcrExtraction = !ocrExtraction || ocrExtraction.trim() === '';
  if (hasMissingOcrExtraction) {
    return '';
  }

  const ocrScore = scoreImageExtractionUtility(ocrExtraction);
  const ocrBody = stripImageDisclaimer(ocrExtraction);
  if (ocrScore === 0) {
    return '';
  }

  return buildOcrClinicalContextText(ocrBody);
}

function buildOcrClinicalContextText(value: string): string {
  const rawValue = typeof value === 'string' ? value : '';
  const trimmedValue = rawValue.trim();
  const contextText =
    '[DOCUMENTO ADJUNTO — texto extraído por OCR]\n' +
    '[FUENTE: adjunto por el profesional, no interpretado por AiduxCare]\n' +
    '[CONTENIDO:]\n' +
    trimmedValue;
  return contextText;
}

function getNoExtractableTextMessages(): { esES: string; enCA: string } {
  return {
    esES: NO_EXTRACTABLE_TEXT_MESSAGE_ES,
    enCA: NO_EXTRACTABLE_TEXT_MESSAGE_EN,
  };
}

function getVisualReferenceOnlyMessages(): { esES: string; enCA: string } {
  return {
    esES: VISUAL_REFERENCE_ONLY_MESSAGE_ES,
    enCA: VISUAL_REFERENCE_ONLY_MESSAGE_EN,
  };
}

function getRestrictedSurfaceMessages(): { esES: string; enCA: string } {
  return {
    esES: RESTRICTED_SURFACE_MESSAGE_ES,
    enCA: RESTRICTED_SURFACE_MESSAGE_EN,
  };
}

function getPhysioUltrasoundMessages(): { esES: string; enCA: string } {
  return {
    esES: PHYSIO_ULTRASOUND_MESSAGE_ES,
    enCA: PHYSIO_ULTRASOUND_MESSAGE_EN,
  };
}

function getLocalizedMessage(messages: { esES: string; enCA: string }): string {
  const isSpanishPilot = env.VITE_ENABLE_ES_PILOT === 'true';
  if (isSpanishPilot) {
    return messages.esES;
  }
  return messages.enCA;
}

function fileNameIncludesAny(file: File, keywords: string[]): boolean {
  const fileName = file.name.toLowerCase();
  const hasKeyword = keywords.some((keyword) => fileName.includes(keyword));
  return hasKeyword;
}

function classifyImageAttachmentKind(file: File, ocrScore: number): ClinicalAttachmentKind {
  if (ocrScore > 0) {
    return 'written_report';
  }
  if (fileNameIncludesAny(file, PHYSIO_ULTRASOUND_NAME_KEYWORDS)) {
    return 'physio_ultrasound_assessment';
  }
  if (fileNameIncludesAny(file, DIAGNOSTIC_IMAGE_NAME_KEYWORDS)) {
    return 'diagnostic_image';
  }
  if (fileNameIncludesAny(file, DIAGNOSTIC_STUDY_NAME_KEYWORDS)) {
    return 'diagnostic_study';
  }
  if (fileNameIncludesAny(file, RESTRICTED_SURFACE_NAME_KEYWORDS)) {
    return 'restricted_body_surface_photo';
  }
  if (fileNameIncludesAny(file, CLINICAL_CONTEXT_PHOTO_NAME_KEYWORDS)) {
    return 'clinical_context_photo';
  }
  return 'clinical_context_photo';
}

function getMessageForAttachmentKind(kind: ClinicalAttachmentKind): { esES: string; enCA: string } {
  if (kind === 'restricted_body_surface_photo') {
    return getRestrictedSurfaceMessages();
  }
  if (kind === 'physio_ultrasound_assessment') {
    return getPhysioUltrasoundMessages();
  }
  if (kind === 'diagnostic_image' || kind === 'diagnostic_study') {
    return getNoExtractableTextMessages();
  }
  return getVisualReferenceOnlyMessages();
}

function truncateClinicalContextText(value: string, label: string): string {
  const MAX_TEXT_LENGTH = 15000;
  const rawValue = typeof value === 'string' ? value : '';
  if (rawValue.length <= MAX_TEXT_LENGTH) {
    return rawValue;
  }

  const originalLength = rawValue.length;
  const truncatedValue = rawValue.substring(0, MAX_TEXT_LENGTH);
  const truncationNotice = `\n\n[NOTE: ${label} text truncated. Original length: ${originalLength} characters]`;
  const processedText = truncatedValue + truncationNotice;
  console.warn(`[FileProcessor] ${label} text truncated: ${originalLength} → ${MAX_TEXT_LENGTH} chars`);
  return processedText;
}

function normalizeNameSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDetectedPatientName(value: string): string | null {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/^(sr\.?|sra\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '')
    .replace(/\b(fecha|date|dob|nacimiento|birth|edad|age|sexo|sex)\b.*$/i, '')
    .trim()
    .replace(/[.,;:|/\\-]+$/g, '')
    .trim();

  return cleaned.length >= 3 ? cleaned.slice(0, 100) : null;
}

const NON_PATIENT_UPPERCASE_LABELS = new Set([
  'analisis clinicos y hematologia',
  'bioquimica',
  'hematologia',
  'informe',
  'laboratorio',
  'resultados',
  'resultados de laboratorio',
  'servicio de bioquimica',
]);

function cleanReliableUppercaseNameCandidate(value: string): string | null {
  const cleanedCandidate = cleanDetectedPatientName(value);
  if (!cleanedCandidate) {
    return null;
  }

  const words = cleanedCandidate.split(/\s+/);
  const isUppercaseName = words.length >= 2
    && words.length <= 4
    && words.every((word) => /^\p{Lu}[\p{Lu}\p{M}'´`.-]+$/u.test(word));

  if (!isUppercaseName || NON_PATIENT_UPPERCASE_LABELS.has(normalizeNameSearchText(cleanedCandidate))) {
    return null;
  }

  return cleanedCandidate;
}

function detectExplicitPatientNameCandidate(extractedText: string): string | null {
  const normalizedLines = extractedText
    .replace(/\r\n?/g, '\n')
    // Intentional: strips stray control bytes that some PDF text extractors leave
    // behind (nulls, tabs-as-bytes, unit separators) before pattern matching below.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
    .replace(/[^\S\n]+/g, ' ');
  const candidateText = normalizedLines.slice(0, 5000);
  const explicitLabelPattern = /(?:^|\n)\s*(?:paciente|nombre|patient|name)\s*[:-]\s*([^\n]{3,100})/i;
  const explicitLabelMatch = explicitLabelPattern.exec(candidateText);

  if (explicitLabelMatch?.[1]) {
    return cleanDetectedPatientName(explicitLabelMatch[1]);
  }

  const uppercaseNameBeforeIdentifierPattern =
    /(?:^|\n)\s*([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ'´`.-]+(?:\s+[A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ'´`.-]+){1,3})\s*\n\s*(?:N\s*[º°o.]?\s*Historia|Historia|SIP)\s*:?/im;
  const uppercaseNameMatch = uppercaseNameBeforeIdentifierPattern.exec(candidateText);

  if (uppercaseNameMatch?.[1]) {
    return cleanReliableUppercaseNameCandidate(uppercaseNameMatch[1]);
  }

  const flattenedCandidateText = candidateText.replace(/\s+/g, ' ');
  const flattenedLabNameBeforeIdentifierPattern =
    /AN[ÁA]LISIS\s+CL[ÍI]NICOS\s+Y\s+HEMATOLOG[ÍI]A\s+([\p{L}\p{M}'´`.-]+(?:\s+[\p{L}\p{M}'´`.-]+){1,3}?)\s+(?=N\s*[º°o.]?\s*Historia\s*:|Historia\s*:|SIP\s*:)/iu;
  const flattenedLabNameMatch = flattenedLabNameBeforeIdentifierPattern.exec(flattenedCandidateText);

  if (flattenedLabNameMatch?.[1]) {
    return cleanReliableUppercaseNameCandidate(flattenedLabNameMatch[1]);
  }

  return null;
}

function namesMatch(activePatientName: string, detectedPatientName: string): boolean {
  const normalizedActiveName = normalizeNameSearchText(activePatientName);
  const normalizedDetectedName = normalizeNameSearchText(detectedPatientName);

  if (!normalizedActiveName || !normalizedDetectedName) {
    return false;
  }

  if (normalizedActiveName === normalizedDetectedName) {
    return true;
  }

  const activeTokens = normalizedActiveName.split(' ').filter((token) => token.length >= 2);
  const detectedTokens = normalizedDetectedName.split(' ').filter((token) => token.length >= 2);
  const shorterTokens = activeTokens.length <= detectedTokens.length ? activeTokens : detectedTokens;
  const longerTokens = activeTokens.length <= detectedTokens.length ? detectedTokens : activeTokens;

  if (shorterTokens.length < 2) {
    return false;
  }

  return shorterTokens.every((token) => longerTokens.includes(token));
}

export function evaluateAttachmentPatientIdentity(
  extractedText: string,
  sessionPatientName?: string
): {
  detectedPatientName: string | null;
  patientIdentityStatus: AttachmentPatientIdentityStatus;
} {
  if (!sessionPatientName?.trim()) {
    return {
      detectedPatientName: null,
      patientIdentityStatus: 'not_checked',
    };
  }

  const detectedPatientName = detectExplicitPatientNameCandidate(extractedText);
  if (!detectedPatientName) {
    return {
      detectedPatientName: null,
      patientIdentityStatus: 'no_name_detected',
    };
  }

  const patientIdentityStatus = namesMatch(sessionPatientName, detectedPatientName)
    ? 'match'
    : 'suspected_mismatch';

  return {
    detectedPatientName,
    patientIdentityStatus,
  };
}

export class FileProcessorService {
  /**
   * Procesa un archivo y extrae información relevante
   * @param file - Archivo a procesar
   * @param downloadURL - URL de descarga del archivo en Firebase Storage
   * @returns Información estructurada del archivo procesado
   */
  static async processFile(
    file: File,
    downloadURL: string = '',
    sessionPatientName?: string
  ): Promise<ProcessedFile> {
    const baseResult: ProcessedFile = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      downloadURL,
    };

    const fileExtension = file.name.split('.').pop() ?? 'unknown';
    const fileSizeBytes = file.size;
    safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'start');
    safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'processing');

    // Procesar PDFs
    console.log("[FileProcessor] Checking PDF branch", file.type);
    if (isValidPDF(file)) {
      try {
        console.log("[FileProcessor] Entering PDF branch");
        safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'pdf_text_extraction_started');
        
        const pdfResult = await extractTextFromPDF(file);
        console.log("[FileProcessor] PDF extraction resolved");
        
        if (pdfResult.error) {
          if (pdfResult.error === SCANNED_PDF_ERROR) {
            safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'scanned_pdf_ocr_fallback_started');
            try {
              const ocrResult = await FileProcessorService.extractScannedPDFWithGemini(file);
              const processedOcrText = truncateClinicalContextText(ocrResult.extractedText, 'Scanned PDF OCR');
              const patientIdentity = evaluateAttachmentPatientIdentity(processedOcrText, sessionPatientName);
              console.log(`[FileProcessor] ✅ Scanned PDF OCR extracted ${processedOcrText.length} characters`);
              return {
                ...baseResult,
                extractedText: processedOcrText,
                ...patientIdentity,
                clinicalAttachmentKind: ocrResult.clinicalAttachmentKind,
                clinicalContextStatus: ocrResult.clinicalContextStatus,
                clinicalContextMessage: ocrResult.clinicalContextMessage,
                pageCount: pdfResult.pageCount,
              };
            } catch (ocrError) {
              console.error(`[FileProcessor] Scanned PDF OCR fallback failed:`, ocrError);
              return {
                ...baseResult,
                error: ocrError instanceof Error ? ocrError.message : 'Scanned PDF OCR failed',
              };
            }
          }
          console.error(`[FileProcessor] PDF extraction error:`, pdfResult.error);
          return {
            ...baseResult,
            error: pdfResult.error,
          };
        }
        
        // Limitar texto extraído para prevenir prompts muy largos
        const MAX_TEXT_LENGTH = 15000; // ~15k caracteres (balance entre detalle y costo)
        let processedText = pdfResult.text;
        
        if (processedText.length > MAX_TEXT_LENGTH) {
          processedText = processedText.substring(0, MAX_TEXT_LENGTH);
          processedText += `\n\n[NOTE: Text truncated. Original length: ${pdfResult.text.length} characters]`;
          console.warn(`[FileProcessor] Text truncated: ${pdfResult.text.length} → ${MAX_TEXT_LENGTH} chars`);
        }
      
        console.log(
          `[FileProcessor] ✅ Extracted ${processedText.length} characters from ${pdfResult.pageCount} pages`
        );
        const patientIdentity = evaluateAttachmentPatientIdentity(processedText, sessionPatientName);
        
        return {
          ...baseResult,
          extractedText: processedText,
          ...patientIdentity,
          pageCount: pdfResult.pageCount,
          metadata: pdfResult.metadata,
        };
      } catch (error) {
        console.error("[FileProcessor] ERROR", error);
        console.error(`[FileProcessor] Error processing PDF:`, error);
        return {
        ...baseResult,
          error: error instanceof Error ? error.message : 'PDF processing failed',
        };
      }
    }

    // Procesar imágenes con OCR vía Gemini Vision
    if (file.type.startsWith('image/')) {
      safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'image_uploaded');
      try {
        const imageResult = await FileProcessorService.extractImageTextWithGemini(file);

        if (imageResult.clinicalContextStatus === 'rejected_no_text') {
          return {
            ...baseResult,
            clinicalAttachmentKind: imageResult.clinicalAttachmentKind,
            clinicalContextStatus: imageResult.clinicalContextStatus,
            clinicalContextMessage: imageResult.clinicalContextMessage,
            error: getLocalizedMessage(imageResult.clinicalContextMessage),
          };
        }

        if (imageResult.clinicalContextStatus === 'visual_reference_only') {
          return {
            ...baseResult,
            clinicalAttachmentKind: imageResult.clinicalAttachmentKind,
            clinicalContextStatus: imageResult.clinicalContextStatus,
            clinicalContextMessage: imageResult.clinicalContextMessage,
            error: getLocalizedMessage(imageResult.clinicalContextMessage),
          };
        }

        const processedText = truncateClinicalContextText(imageResult.extractedText, 'Image OCR');
        return {
          ...baseResult,
          extractedText: processedText,
          clinicalAttachmentKind: imageResult.clinicalAttachmentKind,
          clinicalContextStatus: imageResult.clinicalContextStatus,
          clinicalContextMessage: imageResult.clinicalContextMessage,
        };
      } catch (error) {
        console.error('[FileProcessor] Image OCR failed', error);
        return {
          ...baseResult,
          error:
            error instanceof Error
              ? `Image OCR failed: ${error.message}`
              : 'Image OCR failed due to an unknown error',
        };
      }
    }

    // Procesar archivos de texto
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      try {
        const text = await file.text();
        safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'text_file_processed');
        return {
          ...baseResult,
          extractedText: text,
        };
      } catch (error) {
        console.error(`[FileProcessor] Error reading text file:`, error);
        return {
          ...baseResult,
          error: 'Failed to read text file',
        };
      }
    }

    // Otros tipos de archivo (sin procesamiento específico)
    safeLogger.fileProcessed(fileExtension, fileSizeBytes, 'uploaded_without_text_extraction');
    return baseResult;
  }

  /**
   * Valida si un archivo puede ser procesado
   */
  static canProcess(file: File): boolean {
    return (
      isValidPDF(file) ||
      file.type.startsWith('image/') ||
      file.type.includes('text/')
    );
  }

  /**
   * Obtiene tipo de procesamiento para un archivo
   */
  static getProcessingType(file: File): 'pdf' | 'image' | 'text' | 'other' {
    if (isValidPDF(file)) return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('text/')) return 'text';
    return 'other';
  }

  /**
   * WO-IMAGE-OCR-001: Call Vertex AI (Gemini) via vertexAIProxy to perform OCR on medical images.
   * Sends the image as base64 and uses a strict OCR prompt to obtain raw extracted text.
   */
  private static async extractImageTextWithGemini(file: File): Promise<{
    extractedText: string;
    clinicalContextStatus: 'accepted_ocr_text' | 'rejected_no_text' | 'visual_reference_only';
    clinicalAttachmentKind: ClinicalAttachmentKind;
    clinicalContextMessage: {
      esES: string;
      enCA: string;
    };
  }> {
    const ocrExtractionResult = await (async () => {
      try {
        const ocrResult = await FileProcessorService.callVertexImagePrompt(file, IMAGE_OCR_PROMPT);
        return ocrResult;
      } catch (ocrError) {
        console.warn('[FileProcessor] OCR extraction failed, falling back to visual only:', ocrError);
        return null;
      }
    })();
    const visualScore = 0;
    const ocrScore = scoreImageExtractionUtility(ocrExtractionResult ?? '');
    const clinicalAttachmentKind = classifyImageAttachmentKind(file, ocrScore);
    const clinicalContextStatus = (() => {
      if (ocrScore > 0) {
        return 'accepted_ocr_text';
      }
      if (clinicalAttachmentKind === 'diagnostic_image' || clinicalAttachmentKind === 'diagnostic_study') {
        return 'rejected_no_text';
      }
      return 'visual_reference_only';
    })();
    const clinicalContextMessage = getMessageForAttachmentKind(clinicalAttachmentKind);

    console.log('[FileProcessor] Clinical context decision:', {
      fileName: file.name,
      ocrScore,
      visualScore,
      clinicalAttachmentKind,
      clinicalContextStatus,
    });

    if (clinicalContextStatus !== 'accepted_ocr_text') {
      return {
        extractedText: '',
        clinicalAttachmentKind,
        clinicalContextStatus,
        clinicalContextMessage,
      };
    }

    const ocrBody = stripImageDisclaimer(ocrExtractionResult ?? '');
    const extractedText = buildOcrClinicalContextText(ocrBody);
    return {
      extractedText,
      clinicalAttachmentKind,
      clinicalContextStatus,
      clinicalContextMessage,
    };
  }

  /**
   * WO-IMAGE-OCR-002: OCR fallback for scanned PDFs.
   * Renders each page via pdfjs canvas and sends to Gemini Vision OCR.
   * Max 3 pages to limit API cost; results are concatenated.
   */
  private static async extractScannedPDFWithGemini(file: File): Promise<{
    extractedText: string;
    clinicalContextStatus: 'accepted_ocr_text';
    clinicalAttachmentKind: 'written_report';
    clinicalContextMessage: {
      esES: string;
      enCA: string;
    };
  }> {
    const MAX_OCR_PAGES = 5;
    const pages = await renderPDFPagesAsBase64(file, MAX_OCR_PAGES);
    if (pages.length === 0) {
      throw new Error('Could not render PDF pages for OCR');
    }

    const pageTexts: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      try {
        const text = await FileProcessorService.callVertexPromptFromBase64('image/png', pages[i], IMAGE_OCR_PROMPT);
        if (text.trim()) pageTexts.push(text.trim());
      } catch (err) {
        console.warn(`[FileProcessor] Scanned PDF OCR failed on page ${i + 1}:`, err);
      }
    }

    if (pageTexts.length === 0) throw new Error('Gemini OCR returned no text from scanned PDF pages');

    const ocrBody = pageTexts.join('\n\n');
    const extractedText = buildOcrClinicalContextText(ocrBody);
    return {
      extractedText,
      clinicalContextStatus: 'accepted_ocr_text',
      clinicalAttachmentKind: 'written_report',
      clinicalContextMessage: getNoExtractableTextMessages(),
    };
  }

  private static async callVertexImagePrompt(file: File, prompt: string): Promise<string> {
    // Convert image file to base64 for transport
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
    return FileProcessorService.callVertexPromptFromBase64(file.type || 'image/*', base64Data, prompt);
  }

  private static async callVertexPromptFromBase64(mimeType: string, base64Data: string, prompt: string): Promise<string> {
    const payload = {
      action: 'image-ocr' as const,
      model: GEMINI_OCR_MODEL,
      prompt,
      image: {
        mimeType,
        data: base64Data,
      },
    };

    const headers = await buildAuthenticatedJsonHeaders();
    const response = await fetch(VERTEX_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`vertexAIProxy image-ocr HTTP ${response.status}: ${text}`);
    }

    const data: any = await response.json();
    const extracted = FileProcessorService.extractTextFieldFromVertexResponse(data);

    if (!extracted || !extracted.trim()) {
      throw new Error('Empty OCR result from Gemini Vision');
    }

    return extracted.trim();
  }

  /**
   * Helper para normalizar respuestas de Gemini / Vertex AI, reusando el patrón de vertex-ai-service-firebase.
   */
  private static extractTextFieldFromVertexResponse(data: any): string | null {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (typeof data.text === 'string') return data.text;
    if (typeof data.summary === 'string') return data.summary;
    if (typeof data.summaryText === 'string') return data.summaryText;
    if (typeof data.answer === 'string') return data.answer;
    if (typeof data.answerText === 'string') return data.answerText;
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  }
}
