/**
 * Data Deidentification Service
 * 
 * Removes or masks personal identifiers from text before sending to AI,
 * ensuring PHIPA compliance by preventing identifiable health information
 * from being processed outside Canadian borders.
 * 
 * @compliance PHIPA Section 18, PIPEDA Principle 4.1
 * @audit ISO 27001 A.8.2.1 (Data classification), A.8.2.3 (Handling of assets)
 */

export interface IdentifierMap {
  [placeholder: string]: string; // Maps placeholder (e.g., "[NAME_1]") to original value
}

export interface DeidentificationResult {
  deidentifiedText: string;
  identifiersMap: IdentifierMap;
  removedCount: number;
}

/**
 * Patterns for detecting personal identifiers
 */
const IDENTIFIER_PATTERNS = {
  // Names (common first/last names, capitalized words that might be names)
  name: /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
  
  // Phone numbers (Canadian formats)
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  
  // Postal codes (Canadian format: A1A 1A1)
  postalCode: /\b([A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9])\b/gi,
  
  // Health card numbers (Ontario format: 1234-567-890-AB)
  healthCard: /\b([0-9]{4}[-]?[0-9]{3}[-]?[0-9]{3}[-]?[A-Z]{2})\b/gi,
  
  // Dates (various formats)
  date: /\b([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})\b/g,
  
  // Email addresses
  email: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
  
  // Addresses (street numbers and names)
  address: /\b([0-9]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl))\b/gi,
  
  // SIN (Social Insurance Number - format: 123 456 789)
  sin: /\b([0-9]{3}\s?[0-9]{3}\s?[0-9]{3})\b/g,
  
  // Medical record numbers (various formats)
  medicalRecord: /\b(MRN|MR#|Chart#|File#)[:\s]?([A-Z0-9-]+)\b/gi,
};

/**
 * Deidentifies text by replacing personal identifiers with placeholders
 * 
 * @param text Original text containing potentially identifiable information
 * @returns Deidentified text and mapping of placeholders to original values
 */
export function deidentify(text: string): DeidentificationResult {
  if (!text || typeof text !== 'string') {
    return {
      deidentifiedText: text || '',
      identifiersMap: {},
      removedCount: 0,
    };
  }

  let deidentifiedText = text;
  const identifiersMap: IdentifierMap = {};
  let counter = 1;
  let totalRemoved = 0;

  // Process each identifier type
  for (const [type, pattern] of Object.entries(IDENTIFIER_PATTERNS)) {
    const matches = [...text.matchAll(new RegExp(pattern.source, pattern.flags))];
    
    for (const match of matches) {
      const originalValue = match[0].trim();
      
      // Skip if already replaced
      if (deidentifiedText.indexOf(originalValue) === -1) {
        continue;
      }
      
      // Create placeholder
      const placeholder = `[${type.toUpperCase()}_${counter}]`;
      
      // Replace in text
      deidentifiedText = deidentifiedText.replace(originalValue, placeholder);
      
      // Store mapping
      identifiersMap[placeholder] = originalValue;
      
      counter++;
      totalRemoved++;
    }
  }

  return {
    deidentifiedText,
    identifiersMap,
    removedCount: totalRemoved,
  };
}

/**
 * Reidentifies text by replacing placeholders with original values
 * 
 * @param text Deidentified text with placeholders
 * @param identifiersMap Mapping of placeholders to original values
 * @returns Reidentified text with original values restored
 */
export function reidentify(text: string, identifiersMap: IdentifierMap): string {
  if (!text || !identifiersMap || Object.keys(identifiersMap).length === 0) {
    return text || '';
  }

  let reidentifiedText = text;

  // Replace placeholders in reverse order (longest first) to avoid partial matches
  const sortedPlaceholders = Object.keys(identifiersMap).sort((a, b) => b.length - a.length);

  for (const placeholder of sortedPlaceholders) {
    const originalValue = identifiersMap[placeholder];
    if (originalValue) {
      reidentifiedText = reidentifiedText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), originalValue);
    }
  }

  return reidentifiedText;
}

/**
 * Validates that deidentification was successful
 * Checks if any identifiers remain in the deidentified text
 * 
 * @param deidentifiedText Text that should be deidentified
 * @returns Array of remaining identifiers found (empty if successful)
 */
export function validateDeidentification(deidentifiedText: string): string[] {
  if (!deidentifiedText) {
    return [];
  }

  const remainingIdentifiers: string[] = [];

  // Check each pattern
  for (const [type, pattern] of Object.entries(IDENTIFIER_PATTERNS)) {
    const matches = deidentifiedText.match(new RegExp(pattern.source, pattern.flags));
    if (matches) {
      // Filter out placeholders (they're allowed)
      const realMatches = matches.filter(m => !m.startsWith('[') && !m.endsWith(']'));
      if (realMatches.length > 0) {
        remainingIdentifiers.push(...realMatches);
      }
    }
  }

  return remainingIdentifiers;
}

/**
 * Logs deidentification event for audit purposes
 * 
 * @param action Action performed ('deidentify' | 'reidentify' | 'validate')
 * @param textLength Length of text processed
 * @param identifiersCount Number of identifiers processed
 * @param metadata Additional metadata for audit trail
 */
export async function logDeidentification(
  action: 'deidentify' | 'reidentify' | 'validate',
  textLength: number,
  identifiersCount: number,
  metadata?: {
    traceId?: string;
    userId?: string;
    patientId?: string;
    service?: string;
  }
): Promise<void> {
  try {
    // Dynamic import to avoid build issues
    const { default: FirestoreAuditLogger } = await import('../core/audit/FirestoreAuditLogger');
    
    await FirestoreAuditLogger.log({
      event: `data_deidentification_${action}`,
      userId: metadata?.userId || 'system',
      metadata: {
        textLength,
        identifiersCount,
        traceId: metadata?.traceId,
        patientId: metadata?.patientId,
        service: metadata?.service,
        timestamp: new Date().toISOString(),
      },
      securityLevel: 'high', // PHIPA compliance requires high security level
    });
  } catch (error) {
    // Fail silently in case of audit logging issues (don't break main flow)
    console.warn('[DataDeidentification] Failed to log audit event:', error);
  }
}


