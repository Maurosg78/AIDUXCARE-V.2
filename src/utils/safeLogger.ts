/**
 * Non-PHI logging helpers.
 *
 * Policy: console output must never receive clinical content, patient names,
 * filenames, transcript text, SOAP text, free-text notes, contact data,
 * tokens, or database identifiers. Helpers only accept non-identifiable
 * metadata such as counts, lengths, booleans, enum-like status values,
 * file extensions, byte sizes, durations, and trace categories.
 */
export const safeLogger = {
  fileProcessed(extension: string, sizeBytes: number, operation: string): void {
    console.log('[FileProcessor]', operation, 'ext:', extension, 'size_bytes:', sizeBytes);
  },

  vertexResponse(charCount: number, hasContent: boolean, stage: string): void {
    console.log('[Vertex]', stage, 'char_count:', charCount, 'has_content:', hasContent);
  },

  clinicalTextUpdated(fieldType: string, charCount: number): void {
    console.log('[EditableResults] field_updated field_type:', fieldType, 'char_count:', charCount);
  },

  soapGenerated(sectionKeys: string[], hasContent: boolean): void {
    console.log('[SoapService] plan_generated section_keys:', sectionKeys, 'has_plan:', hasContent);
  },

  transcriptProcessed(segmentCount: number, totalChars: number): void {
    console.log('[Transcript] processed segment_count:', segmentCount, 'total_chars:', totalChars);
  },

  clinicalContextBuilt(contextKeys: string[], stage: string): void {
    console.log('[ClinicalContext]', stage, 'context_keys:', contextKeys);
  },

  attachmentEligibility(status: string, eligible: boolean): void {
    console.log('[AttachmentSafety] eligibility status:', status, 'eligible:', eligible);
  },
};
