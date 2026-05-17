import type { ClinicalAnalysis } from '@/utils/cleanVertexResponse';

type ImagingGuardAttachment = {
  fileName?: string;
  fileType?: string | null;
  extractedText?: string;
};

export type ImagingScopeGuardResult = {
  analysis: ClinicalAnalysis;
  removedImagingItems: number;
  rescuedMedications: number;
};

const FORBIDDEN_IMAGING_PATTERNS = [
  /hallazgos?\s+radiol[oó]gicos?/i,
  /an[aá]lisis\s+detallado\s+de\s+radiograf[ií]as?/i,
  /densidades?\s+radiopacas?/i,
  /patr[oó]n\s+de\s+gas/i,
  /la\s+radiograf[ií]a\s+muestra/i,
  /radiograf[ií]a\s+lateral/i,
  /radiograf[ií]a\s+anteroposterior/i,
  /descritos?\s+en\s+adjunto\s+\d+/i,
  /cambios?\s+degenerativos?\s+lumbares?/i,
];

const SAFE_ATTRIBUTION_PATTERNS = [
  /seg[uú]n\s+informe\s+adjunto/i,
  /comentado\s+por\s+el\s+profesional\s+durante\s+la\s+sesi[oó]n/i,
  /pendiente\s+de\s+correlaci[oó]n\s+cl[ií]nica/i,
  /requiere\s+revisi[oó]n\s+por\s+profesional\s+competente/i,
];

const IMAGE_FILE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|heic|heif)$/i;

const hasVisualImageAttachment = (attachments: ImagingGuardAttachment[] = []): boolean => {
  return attachments.some((attachment) => {
    const fileType = attachment.fileType ?? '';
    const fileName = attachment.fileName ?? '';
    const extractedText = attachment.extractedText ?? '';

    return (
      fileType.startsWith('image/') ||
      IMAGE_FILE_EXTENSION_PATTERN.test(fileName) ||
      /Hallazgos visibles del adjunto|Se observa una radiograf/i.test(extractedText)
    );
  });
};

const isUnsafeImagingItem = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;
  const isAttributed = SAFE_ATTRIBUTION_PATTERNS.some((pattern) => pattern.test(text));
  if (isAttributed) return false;
  return FORBIDDEN_IMAGING_PATTERNS.some((pattern) => pattern.test(text));
};

const filterUnsafeStrings = (items: string[] | undefined): { items: string[]; removed: number } => {
  const source = Array.isArray(items) ? items : [];
  const filtered = source.filter((item) => !isUnsafeImagingItem(item));
  return {
    items: filtered,
    removed: source.length - filtered.length,
  };
};

const filterUnsafeNotes = (notes: string | undefined): { notes: string; removed: number } => {
  if (!notes) return { notes: '', removed: 0 };
  const parts = notes
    .split(/\s+•\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return isUnsafeImagingItem(notes) ? { notes: '', removed: 1 } : { notes, removed: 0 };
  }

  const filtered = parts.filter((part) => !isUnsafeImagingItem(part));
  return {
    notes: filtered.join(' • '),
    removed: parts.length - filtered.length,
  };
};

const stringifyTestItem = (item: unknown): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item !== 'object') return String(item);

  const record = item as Record<string, unknown>;
  return [
    record.name,
    record.objective,
    record.rationale,
    record.description,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
};

const filterUnsafeTests = (items: any[] | undefined): { items: any[]; removed: number } => {
  const source = Array.isArray(items) ? items : [];
  const filtered = source.filter((item) => !isUnsafeImagingItem(stringifyTestItem(item)));
  return {
    items: filtered,
    removed: source.length - filtered.length,
  };
};

const MEDICATION_SENTENCE_PATTERN = /[^.\n]*(enantyum|dexketoprofeno)[^.\n]*/i;

const extractMedicationFromText = (text: string): string | null => {
  const sentenceMatch = MEDICATION_SENTENCE_PATTERN.exec(text);
  if (!sentenceMatch) return null;

  const sentence = sentenceMatch[0].trim();
  const medicationName = /enantyum/i.test(sentence) ? 'Enantyum' : 'dexketoprofeno';
  const medicationDetailMatch = sentence.match(new RegExp(`${medicationName}[^.\\n]*`, 'i'));
  const medicationDetail = medicationDetailMatch?.[0]?.trim() ?? medicationName;
  const normalizedMedicationDetail = medicationDetail.replace(/^enantyum/i, 'Enantyum');

  return `según informe adjunto/OCR — ${normalizedMedicationDetail} (requires_review: true)`;
};

const extractAttachmentMedications = (attachments: ImagingGuardAttachment[] = []): string[] => {
  const medications: string[] = [];

  attachments.forEach((attachment) => {
    const extractedText = attachment.extractedText ?? '';
    const medication = extractMedicationFromText(extractedText);
    if (medication && !medications.includes(medication)) {
      medications.push(medication);
    }
  });

  return medications;
};

const hasMedicationAlready = (items: string[] | undefined, medication: string): boolean => {
  const source = Array.isArray(items) ? items : [];
  const normalizedMedication = medication.toLowerCase();
  const refersToEnantyum = normalizedMedication.includes('enantyum');
  const refersToDexketoprofeno = normalizedMedication.includes('dexketoprofeno');

  return source.some((item) => {
    const normalizedItem = String(item).toLowerCase();
    if (refersToEnantyum && normalizedItem.includes('enantyum')) return true;
    if (refersToDexketoprofeno && normalizedItem.includes('dexketoprofeno')) return true;
    return false;
  });
};

export const applyImagingScopeGuard = (
  analysis: ClinicalAnalysis,
  attachments: ImagingGuardAttachment[] = []
): ImagingScopeGuardResult => {
  const shouldFilterImaging = hasVisualImageAttachment(attachments);
  let removedImagingItems = 0;

  let sanitizedAnalysis: ClinicalAnalysis = { ...analysis };

  if (shouldFilterImaging) {
    const redFlags = filterUnsafeStrings(sanitizedAnalysis.red_flags);
    const yellowFlags = filterUnsafeStrings(sanitizedAnalysis.yellow_flags);
    const findings = filterUnsafeStrings(sanitizedAnalysis.hallazgos_clinicos);
    const relevantFindings = filterUnsafeStrings(sanitizedAnalysis.hallazgos_relevantes);
    const notes = filterUnsafeNotes(sanitizedAnalysis.notas_seguridad);
    const tests = filterUnsafeTests(sanitizedAnalysis.evaluaciones_fisicas_sugeridas);

    removedImagingItems =
      redFlags.removed +
      yellowFlags.removed +
      findings.removed +
      relevantFindings.removed +
      notes.removed +
      tests.removed;

    sanitizedAnalysis = {
      ...sanitizedAnalysis,
      red_flags: redFlags.items,
      yellow_flags: yellowFlags.items,
      hallazgos_clinicos: findings.items,
      hallazgos_relevantes: relevantFindings.items,
      notas_seguridad: notes.notes,
      evaluaciones_fisicas_sugeridas: tests.items,
    };
  }

  const rescued = extractAttachmentMedications(attachments).filter(
    (medication) => !hasMedicationAlready(sanitizedAnalysis.medicacion_actual, medication)
  );

  if (rescued.length > 0) {
    sanitizedAnalysis = {
      ...sanitizedAnalysis,
      medicacion_actual: [
        ...(Array.isArray(sanitizedAnalysis.medicacion_actual) ? sanitizedAnalysis.medicacion_actual : []),
        ...rescued,
      ],
    };
  }

  return {
    analysis: sanitizedAnalysis,
    removedImagingItems,
    rescuedMedications: rescued.length,
  };
};
