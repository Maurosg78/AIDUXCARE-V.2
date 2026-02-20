/**
 * SOAP Partial Update Service
 * 
 * WO-002: Update only specific sections of SOAP without regenerating entire note.
 * Preserves user manual edits when updating red flag justifications.
 * 
 * @compliance PHIPA compliant, ISO 27001 auditable
 */

import { Timestamp } from 'firebase/firestore';

export interface RedFlagJustification {
  flagId: string;
  flagTitle: string;
  justification: string;
  justifiedAt: Timestamp;
}

interface SOAPSections {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  redFlagsClinicalReasoning?: string;
}

/**
 * Parse SOAP note into sections (S/O/A/P/Red Flags)
 */
export function parseSOAPSections(soap: string | { subjective?: string; objective?: string; assessment?: string; plan?: string }): SOAPSections {
  // If SOAP is already an object, return it directly
  if (typeof soap !== 'string') {
    return {
      subjective: soap.subjective,
      objective: soap.objective,
      assessment: soap.assessment,
      plan: soap.plan,
    };
  }

  const sections: SOAPSections = {};
  
  // Regex to find section headers (case-insensitive, flexible spacing)
  const sectionRegex = /^(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|RED FLAGS CLINICAL REASONING):?\s*$/gmi;
  
  const matches: Array<{ name: string; index: number; length: number }> = [];
  let match;
  
  // Find all section headers
  while ((match = sectionRegex.exec(soap)) !== null) {
    matches.push({
      name: match[1].toUpperCase(),
      index: match.index,
      length: match[0].length,
    });
  }
  
  // Extract content for each section
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    
    const startIndex = currentMatch.index + currentMatch.length;
    const endIndex = nextMatch ? nextMatch.index : soap.length;
    
    const content = soap.substring(startIndex, endIndex).trim();
    
    // Map section names to our interface
    const sectionName = currentMatch.name.replace(/\s+/g, '');
    if (sectionName === 'SUBJECTIVE') {
      sections.subjective = content;
    } else if (sectionName === 'OBJECTIVE') {
      sections.objective = content;
    } else if (sectionName === 'ASSESSMENT') {
      sections.assessment = content;
    } else if (sectionName === 'PLAN') {
      sections.plan = content;
    } else if (sectionName === 'REDFLAGSCLINICALREASONING') {
      sections.redFlagsClinicalReasoning = content;
    }
  }
  
  return sections;
}

/**
 * Generate Red Flags Clinical Reasoning section from justifications
 */
export function generateRedFlagsSection(justifications: RedFlagJustification[]): string {
  if (justifications.length === 0) return '';
  
  let section = '';
  
  justifications.forEach((justif, index) => {
    section += `${index + 1}. ${justif.flagTitle}\n`;
    section += `   Clinical Justification: ${justif.justification}\n`;
    const dateStr = justif.justifiedAt instanceof Timestamp 
      ? justif.justifiedAt.toDate().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
      : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    section += `   Documented: ${dateStr}\n\n`;
  });
  
  return section.trim();
}

/**
 * Reconstruct SOAP note from sections
 */
export function reconstructSOAP(sections: SOAPSections): string {
  const order: Array<keyof SOAPSections> = ['subjective', 'objective', 'assessment', 'redFlagsClinicalReasoning', 'plan'];
  
  const parts: string[] = [];
  
  order.forEach(sectionName => {
    const content = sections[sectionName];
    if (content && content.trim()) {
      const header = sectionName === 'redFlagsClinicalReasoning' 
        ? 'RED FLAGS CLINICAL REASONING' 
        : sectionName.toUpperCase();
      parts.push(`${header}:\n\n${content.trim()}\n`);
    }
  });
  
  return parts.join('\n').trim();
}

/**
 * Update only the Red Flags Clinical Reasoning section of SOAP
 * Preserves all other sections (including user manual edits)
 * 
 * WO-002: Partial update to avoid regenerating entire SOAP
 */
export function updateSOAPRedFlagsSection(
  existingSOAP: string | { subjective?: string; objective?: string; assessment?: string; plan?: string },
  redFlagJustifications: RedFlagJustification[]
): string {
  // 1. Parse existing SOAP into sections
  const sections = parseSOAPSections(existingSOAP);
  
  // 2. Generate red flags section from justifications
  const redFlagsSection = generateRedFlagsSection(redFlagJustifications);
  
  // 3. Update or add red flags section
  if (redFlagsSection) {
    sections.redFlagsClinicalReasoning = redFlagsSection;
  } else {
    // If no justifications, remove the section
    delete sections.redFlagsClinicalReasoning;
  }
  
  // 4. Reconstruct SOAP with updated section (preserving all other sections)
  return reconstructSOAP(sections);
}

/**
 * Update SOAP note object (structured format) with red flag justifications
 * Preserves all other fields and user manual edits
 * WO-002: Partial update - only modifies assessment section to append red flags reasoning
 */
export function updateSOAPNoteRedFlags(
  existingSOAP: { subjective?: string; objective?: string; assessment?: string; plan?: string; [key: string]: any },
  redFlagJustifications: RedFlagJustification[]
): { subjective?: string; objective?: string; assessment?: string; plan?: string; [key: string]: any } {
  // Generate red flags section text
  const redFlagsSection = generateRedFlagsSection(redFlagJustifications);
  
  if (!redFlagsSection) {
    // No justifications, return SOAP unchanged
    return existingSOAP;
  }

  // WO-002: Append red flags reasoning to assessment section (preserve existing content)
  // Check if assessment already has red flags section
  const assessmentText = existingSOAP.assessment || '';
  const hasExistingRedFlags = /RED FLAGS CLINICAL REASONING:/i.test(assessmentText);
  
  let updatedAssessment: string;
  if (hasExistingRedFlags) {
    // Replace existing red flags section
    updatedAssessment = assessmentText.replace(
      /RED FLAGS CLINICAL REASONING:[\s\S]*$/i,
      `RED FLAGS CLINICAL REASONING:\n\n${redFlagsSection}`
    );
  } else {
    // Append new red flags section
    updatedAssessment = assessmentText.trim()
      ? `${assessmentText.trim()}\n\nRED FLAGS CLINICAL REASONING:\n\n${redFlagsSection}`
      : `RED FLAGS CLINICAL REASONING:\n\n${redFlagsSection}`;
  }
  
  // Return updated SOAP preserving all other fields
  return {
    ...existingSOAP,
    assessment: updatedAssessment,
    // Also store as separate field for easy access
    redFlagsClinicalReasoning: redFlagsSection,
  };
}

export default {
  parseSOAPSections,
  generateRedFlagsSection,
  reconstructSOAP,
  updateSOAPRedFlagsSection,
  updateSOAPNoteRedFlags,
};
