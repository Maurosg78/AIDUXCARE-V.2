/**
 * Identifies the origin layer of clinical input data.
 * Determines what analysis operations are permitted on that data.
 * See ENGINEERING.md §1.7 Diagnostic Imaging Scope Boundary.
 */
export type ClinicalSourceLevel =
  | 'transcript'       // direct audio transcription — highest trust
  | 'text_layer_pdf'   // PDF with native text layer
  | 'ocr_text'         // scanned PDF, OCR-extracted — medium trust
  | 'image_visual'     // AI visual description of an image — lowest trust
  | 'physio_input';    // manually entered by physiotherapist

/**
 * Whether data at this source level can be treated as a canonical clinical fact.
 */
export type CanonicalityStatus =
  | 'canonical'        // accepted as clinical fact
  | 'hypothesis'       // AI-generated; requires clinician confirmation
  | 'scope_boundary';  // requires review by competent professional; never a clinical finding

/**
 * Category of scope boundary signal for imaging/OCR-derived content.
 */
export type ScopeBoundarySignalCategory =
  | 'imaging_visual_observation'  // AI visual observation from diagnostic image
  | 'ocr_extraction'              // text extracted from scanned document
  | 'document_derived';           // extracted from text-layer document

/**
 * Policy governing how imaging or scanned-document input is handled
 * in analysis prompts and clinical decision pipelines.
 */
export interface ImagingInputPolicy {
  readonly sourceLevel: ClinicalSourceLevel;
  readonly canonicality: CanonicalityStatus;
  readonly allowRedFlagGeneration: boolean;
  readonly allowDiagnosticInterpretation: boolean;
  readonly requiresProfessionalReview: boolean;
  readonly traceabilityMarker?: string;
}

export interface SafetyReconciliationDelta {
  readonly new_red_flags: string[];
  readonly new_yellow_flags: string[];
  readonly resolved_flags: string[];
  readonly unchanged_flags: string[];
  readonly rationale: string[];
}

export interface ReconciliationInput {
  readonly initial_red_flags: string[];
  readonly initial_yellow_flags: string[];
  readonly corrected_medications: string[];
  readonly confirmed_antecedents: string[];
  readonly physical_evaluation_findings: string[];
}
