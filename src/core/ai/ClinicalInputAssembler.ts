export const MAIN_TRANSCRIPT_BUDGET_CHARS = 5000;
export const ATTACHMENT_TOTAL_BUDGET_CHARS = 3000;
export const PROFESSIONAL_CONTEXT_BUDGET_CHARS = 500;

const ASSEMBLER_VERSION = 'clinical-input-assembler-v1' as const;

const RELEVANT_SNIPPET_KEYWORDS = [
  'medicamento',
  'medicacion',
  'medicación',
  'pastilla',
  'tomo',
  'me tomo',
  'alergia',
  'reacción',
  'reaccion',
  'diabetes',
  'ansiedad',
  'dolor',
  'caída',
  'caida',
  'golpe',
  'caminar',
  'dormir',
  'rodilla',
  'lumbar',
  'tratamiento',
  'ejercicio',
  'fuerza',
  'inflamación',
  'inflamacion',
];

const INELIGIBLE_ATTACHMENT_STATUSES = [
  'suspected_mismatch',
  'not_eligible',
  'ineligible',
  'blocked',
];

type AttachmentInput = {
  id?: string;
  type?: string;
  extractedText: string;
  eligibilityStatus?: string;
};

export type ClinicalInputAssemblerInput = {
  transcript: string;
  attachmentsText?: AttachmentInput[];
  preExtractedMedications?: unknown[];
  preExtractedMajorHistory?: unknown[];
  preExtractedRedFlags?: unknown[];
  professionalContext?: string;
  visitType?: string;
  locale?: string;
};

export type ClinicalInputPackage = {
  version: typeof ASSEMBLER_VERSION;
  budgetReport: {
    transcriptOriginalChars: number;
    transcriptIncludedChars: number;
    attachmentOriginalChars: number;
    attachmentIncludedChars: number;
    preExtractedJsonChars: number;
    professionalContextChars: number;
    budgetMode: 'compact' | 'standard';
  };
  criticalExtractedData: {
    medications: unknown[];
    majorHistory: unknown[];
    redFlags: unknown[];
  };
  transcriptEvidence: {
    beginningExcerpt: string;
    endingExcerpt: string;
    relevantSnippets: string[];
  };
  attachmentEvidence: Array<{
    id?: string;
    type?: string;
    excerpt: string;
    originalChars: number;
    includedChars: number;
  }>;
  professionalContext?: string;
  visitType?: string;
  locale?: string;
};

const normalizeWhitespace = (value: string): string => {
  const normalizedValue = value.replace(/\s+/g, ' ').trim();
  return normalizedValue;
};

const trimToBudget = (value: string, budget: number): string => {
  if (budget <= 0) return '';
  if (value.length <= budget) return value;
  const slicedValue = value.slice(0, budget);
  const lastWhitespaceIndex = slicedValue.lastIndexOf(' ');
  if (lastWhitespaceIndex < Math.floor(budget * 0.7)) {
    return slicedValue.trim();
  }
  return slicedValue.slice(0, lastWhitespaceIndex).trim();
};

const trimEndToBudget = (value: string, budget: number): string => {
  if (budget <= 0) return '';
  if (value.length <= budget) return value;
  const startIndex = Math.max(value.length - budget, 0);
  const slicedValue = value.slice(startIndex);
  const firstWhitespaceIndex = slicedValue.indexOf(' ');
  if (firstWhitespaceIndex < 0 || firstWhitespaceIndex > Math.floor(budget * 0.3)) {
    return slicedValue.trim();
  }
  return slicedValue.slice(firstWhitespaceIndex).trim();
};

const getIncludedTranscriptChars = (beginningExcerpt: string, endingExcerpt: string, relevantSnippets: string[]): number => {
  const snippetsChars = relevantSnippets.reduce((total, snippet) => total + snippet.length, 0);
  const includedChars = beginningExcerpt.length + endingExcerpt.length + snippetsChars;
  return includedChars;
};

const buildKeywordRegex = (): RegExp => {
  const escapedKeywords = RELEVANT_SNIPPET_KEYWORDS.map((keyword) =>
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = escapedKeywords.join('|');
  return new RegExp(pattern, 'gi');
};

const overlapsBoundary = (startIndex: number, endIndex: number, beginningEnd: number, endingStart: number): boolean => {
  const overlapsBeginning = startIndex < beginningEnd;
  const overlapsEnding = endIndex > endingStart;
  return overlapsBeginning || overlapsEnding;
};

const selectRelevantSnippets = (
  transcript: string,
  snippetBudget: number,
  beginningEnd: number,
  endingStart: number
): string[] => {
  if (snippetBudget <= 0) return [];

  const snippets: string[] = [];
  const seen = new Set<string>();
  const keywordRegex = buildKeywordRegex();
  let remainingBudget = snippetBudget;
  let match = keywordRegex.exec(transcript);

  while (match && remainingBudget > 0) {
    const matchIndex = match.index;
    const windowRadius = 260;
    const startIndex = Math.max(matchIndex - windowRadius, 0);
    const endIndex = Math.min(matchIndex + windowRadius, transcript.length);
    const boundaryOverlap = overlapsBoundary(startIndex, endIndex, beginningEnd, endingStart);

    if (!boundaryOverlap) {
      const rawSnippet = transcript.slice(startIndex, endIndex);
      const snippet = trimToBudget(rawSnippet, Math.min(remainingBudget, 520));
      const snippetKey = snippet.toLowerCase();

      if (snippet.length > 0 && !seen.has(snippetKey)) {
        snippets.push(snippet);
        seen.add(snippetKey);
        remainingBudget -= snippet.length;
      }
    }

    match = keywordRegex.exec(transcript);
  }

  return snippets;
};

const buildTranscriptEvidence = (transcript: string) => {
  const transcriptOriginalChars = transcript.length;

  if (transcriptOriginalChars <= MAIN_TRANSCRIPT_BUDGET_CHARS) {
    const beginningExcerpt = transcript;
    const endingExcerpt = '';
    const relevantSnippets: string[] = [];
    const transcriptIncludedChars = getIncludedTranscriptChars(beginningExcerpt, endingExcerpt, relevantSnippets);

    return {
      transcriptEvidence: {
        beginningExcerpt,
        endingExcerpt,
        relevantSnippets,
      },
      transcriptIncludedChars,
      budgetMode: 'standard' as const,
    };
  }

  const beginningBudget = 1500;
  const endingBudget = 1500;
  const snippetBudget = MAIN_TRANSCRIPT_BUDGET_CHARS - beginningBudget - endingBudget;
  const beginningExcerpt = trimToBudget(transcript, beginningBudget);
  const endingExcerpt = trimEndToBudget(transcript, endingBudget);
  const endingStart = Math.max(transcript.length - endingBudget, 0);
  const relevantSnippets = selectRelevantSnippets(
    transcript,
    snippetBudget,
    beginningExcerpt.length,
    endingStart
  );
  const transcriptIncludedChars = getIncludedTranscriptChars(beginningExcerpt, endingExcerpt, relevantSnippets);

  return {
    transcriptEvidence: {
      beginningExcerpt,
      endingExcerpt,
      relevantSnippets,
    },
    transcriptIncludedChars,
    budgetMode: 'compact' as const,
  };
};

const isAttachmentEligibleForText = (eligibilityStatus?: string): boolean => {
  if (!eligibilityStatus) return true;
  const normalizedStatus = eligibilityStatus.toLowerCase();
  const isIneligible = INELIGIBLE_ATTACHMENT_STATUSES.some((status) =>
    normalizedStatus.includes(status)
  );
  return !isIneligible;
};

const buildAttachmentEvidence = (attachments: AttachmentInput[] = []) => {
  const attachmentOriginalChars = attachments.reduce((total, attachment) => {
    const normalizedText = normalizeWhitespace(attachment.extractedText || '');
    return total + normalizedText.length;
  }, 0);

  if (attachments.length === 0) {
    return {
      attachmentEvidence: [],
      attachmentIncludedChars: 0,
      attachmentOriginalChars,
    };
  }

  let remainingBudget = ATTACHMENT_TOTAL_BUDGET_CHARS;
  const attachmentEvidence = attachments.map((attachment) => {
    const normalizedText = normalizeWhitespace(attachment.extractedText || '');
    const originalChars = normalizedText.length;
    const canIncludeText = isAttachmentEligibleForText(attachment.eligibilityStatus);
    const attachmentBudget = canIncludeText
      ? Math.floor(remainingBudget / Math.max(attachments.length, 1))
      : 0;
    const excerpt = canIncludeText ? trimToBudget(normalizedText, attachmentBudget) : '';
    const includedChars = excerpt.length;
    remainingBudget = Math.max(remainingBudget - includedChars, 0);

    return {
      ...(attachment.id ? { id: attachment.id } : {}),
      ...(attachment.type ? { type: attachment.type } : {}),
      excerpt,
      originalChars,
      includedChars,
    };
  });
  const attachmentIncludedChars = attachmentEvidence.reduce((total, attachment) => {
    return total + attachment.includedChars;
  }, 0);

  return {
    attachmentEvidence,
    attachmentIncludedChars,
    attachmentOriginalChars,
  };
};

export const createClinicalInputPackage = (input: ClinicalInputAssemblerInput): ClinicalInputPackage => {
  const normalizedTranscript = normalizeWhitespace(input.transcript || '');
  const medications = Array.isArray(input.preExtractedMedications) ? input.preExtractedMedications : [];
  const majorHistory = Array.isArray(input.preExtractedMajorHistory) ? input.preExtractedMajorHistory : [];
  const redFlags = Array.isArray(input.preExtractedRedFlags) ? input.preExtractedRedFlags : [];
  const criticalExtractedData = {
    medications,
    majorHistory,
    redFlags,
  };
  const preExtractedJson = JSON.stringify(criticalExtractedData);
  const preExtractedJsonChars = preExtractedJson.length;
  const professionalContextRaw = normalizeWhitespace(input.professionalContext || '');
  const professionalContext = trimToBudget(professionalContextRaw, PROFESSIONAL_CONTEXT_BUDGET_CHARS);
  const professionalContextChars = professionalContext.length;
  const transcriptResult = buildTranscriptEvidence(normalizedTranscript);
  const attachmentResult = buildAttachmentEvidence(input.attachmentsText);

  return {
    version: ASSEMBLER_VERSION,
    budgetReport: {
      transcriptOriginalChars: normalizedTranscript.length,
      transcriptIncludedChars: transcriptResult.transcriptIncludedChars,
      attachmentOriginalChars: attachmentResult.attachmentOriginalChars,
      attachmentIncludedChars: attachmentResult.attachmentIncludedChars,
      preExtractedJsonChars,
      professionalContextChars,
      budgetMode: transcriptResult.budgetMode,
    },
    criticalExtractedData,
    transcriptEvidence: transcriptResult.transcriptEvidence,
    attachmentEvidence: attachmentResult.attachmentEvidence,
    ...(professionalContext ? { professionalContext } : {}),
    ...(input.visitType ? { visitType: input.visitType } : {}),
    ...(input.locale ? { locale: input.locale } : {}),
  };
};

export const serializeClinicalInputPackage = (clinicalInputPackage: ClinicalInputPackage): string => {
  return JSON.stringify(clinicalInputPackage);
};
