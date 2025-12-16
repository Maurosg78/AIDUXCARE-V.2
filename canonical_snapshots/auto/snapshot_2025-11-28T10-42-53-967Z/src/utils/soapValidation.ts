/**
 * SOAP Validation Utilities
 * 
 * Validates SOAP notes for character limits and repetition.
 * Critical for piloto success - ensures concise, professional SOAP notes.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

export interface SOAPValidationResult {
  isValid: boolean;
  totalCharacters: number;
  sectionCharacters: {
    subjective: number;
    objective: number;
    assessment: number;
    plan: number;
  };
  sectionLimits: {
    subjective: number;
    objective: number;
    assessment: number;
    plan: number;
  };
  repetitionCheck: {
    hasRepetition: boolean;
    repeatedPhrases: string[];
  };
  errors: string[];
  warnings: string[];
}

// ✅ PILOTO OPTIMIZATION: Strict limits for EMR efficiency
// These are GUIDELINES for quality, optimized for <1200 char target
const SECTION_GUIDELINES = {
  subjective: 200,  // Optimized for concise patient reports
  objective: 350,   // Optimized for key findings and measurements
  assessment: 250,  // Optimized for clinical reasoning
  plan: 400,        // Optimized for treatment strategy
} as const;

const TOTAL_GUIDELINE = 1200; // Target: <1200 chars for EMR efficiency
const TOTAL_WARNING_THRESHOLD = 1500; // Warn if exceeds this (too verbose)

/**
 * Common phrases that indicate repetition
 */
const REPETITION_PATTERNS = [
  /when radializing the hand/gi,
  /when applying pressure to the cubitocarpal joint/gi,
  /the patient reports/gi,
  /on physical examination/gi,
  /the treatment plan will focus on/gi,
  /patterns consistent with.*patterns consistent with/gi, // Repeated phrase
];

/**
 * Validates SOAP note for character limits and repetition
 */
export function validateSOAP(soap: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}): SOAPValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const sectionCharacters = {
    subjective: soap.subjective.length,
    objective: soap.objective.length,
    assessment: soap.assessment.length,
    plan: soap.plan.length,
  };
  
  const totalCharacters = 
    sectionCharacters.subjective +
    sectionCharacters.objective +
    sectionCharacters.assessment +
    sectionCharacters.plan;
  
  // ✅ REFINED: Guidelines instead of strict limits - warn but don't error
  // Check total character guideline (warn if exceeds, error only if very excessive)
  if (totalCharacters > TOTAL_WARNING_THRESHOLD) {
    errors.push(
      `SOAP note is very lengthy: ${totalCharacters} characters. Consider condensing for EMR efficiency.`
    );
  } else if (totalCharacters > TOTAL_GUIDELINE) {
    warnings.push(
      `SOAP note exceeds guideline length: ${totalCharacters}/${TOTAL_GUIDELINE} characters. Consider condensing for EMR efficiency.`
    );
  }
  
  // Check section guidelines (warnings only, not errors)
  if (sectionCharacters.subjective > SECTION_GUIDELINES.subjective) {
    warnings.push(
      `Subjective section exceeds guideline: ${sectionCharacters.subjective}/${SECTION_GUIDELINES.subjective} characters. Consider condensing.`
    );
  }
  
  if (sectionCharacters.objective > SECTION_GUIDELINES.objective) {
    warnings.push(
      `Objective section exceeds guideline: ${sectionCharacters.objective}/${SECTION_GUIDELINES.objective} characters. Consider condensing.`
    );
  }
  
  if (sectionCharacters.assessment > SECTION_GUIDELINES.assessment) {
    warnings.push(
      `Assessment section exceeds guideline: ${sectionCharacters.assessment}/${SECTION_GUIDELINES.assessment} characters. Consider condensing.`
    );
  }
  
  if (sectionCharacters.plan > SECTION_GUIDELINES.plan) {
    warnings.push(
      `Plan section exceeds guideline: ${sectionCharacters.plan}/${SECTION_GUIDELINES.plan} characters. Consider condensing.`
    );
  }
  
  // Check for repetition
  const fullText = `${soap.subjective} ${soap.objective} ${soap.assessment} ${soap.plan}`;
  const repeatedPhrases: string[] = [];
  
  REPETITION_PATTERNS.forEach((pattern, index) => {
    const matches = fullText.match(pattern);
    if (matches && matches.length > 1) {
      repeatedPhrases.push(pattern.source);
    }
  });
  
  // Check for sentence-level repetition
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceCounts = new Map<string, number>();
  
  sentences.forEach(sentence => {
    const normalized = sentence.trim().toLowerCase();
    sentenceCounts.set(normalized, (sentenceCounts.get(normalized) || 0) + 1);
  });
  
  sentenceCounts.forEach((count, sentence) => {
    if (count > 1 && sentence.length > 20) {
      repeatedPhrases.push(`Repeated sentence: "${sentence.substring(0, 50)}..."`);
    }
  });
  
  if (repeatedPhrases.length > 0) {
    warnings.push(`Found ${repeatedPhrases.length} repeated phrase(s) or sentence(s)`);
  }
  
  return {
    isValid: errors.length === 0, // Only errors (very excessive length) invalidate
    totalCharacters,
    sectionCharacters,
    sectionLimits: SECTION_GUIDELINES, // Now guidelines, not strict limits
    repetitionCheck: {
      hasRepetition: repeatedPhrases.length > 0,
      repeatedPhrases,
    },
    errors,
    warnings,
  };
}

/**
 * Truncates SOAP note sections only if VERY excessive (exceeds warning threshold)
 * ✅ REFINED: Only truncate if truly excessive, preserve clinical content
 */
export function truncateSOAPToLimits(soap: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}): {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
} {
  // Only truncate if section is VERY excessive (2x guideline)
  return {
    subjective: soap.subjective.length > SECTION_GUIDELINES.subjective * 2
      ? truncateSection(soap.subjective, SECTION_GUIDELINES.subjective * 1.5)
      : soap.subjective,
    objective: soap.objective.length > SECTION_GUIDELINES.objective * 2
      ? truncateSection(soap.objective, SECTION_GUIDELINES.objective * 1.5)
      : soap.objective,
    assessment: soap.assessment.length > SECTION_GUIDELINES.assessment * 2
      ? truncateSection(soap.assessment, SECTION_GUIDELINES.assessment * 1.5)
      : soap.assessment,
    plan: soap.plan.length > SECTION_GUIDELINES.plan * 2
      ? truncateSection(soap.plan, SECTION_GUIDELINES.plan * 1.5)
      : soap.plan,
  };
}

/**
 * Truncates a section to a maximum length, preserving sentence boundaries
 */
function truncateSection(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to truncate at sentence boundary
  const truncated = text.substring(0, maxLength - 3);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > maxLength * 0.7) {
    // Truncate at sentence boundary if it's not too early
    return text.substring(0, lastSentenceEnd + 1);
  }
  
  // Otherwise truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return text.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

