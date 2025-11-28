/**
 * Clinical Note Schema - FHIR R4 Compatible
 * CONFIDENCIAL - Propiedad Intelectual Core de AiduxCare
 * Version: 1.0.0
 * 
 * Este schema define los campos obligatorios y validaciones
 * requeridas para cumplimiento regulatorio en Canadá (PIPEDA/PHIPA)
 */

export interface ClinicalNoteRequiredFields {
  // Identificación (obligatorio por regulación)
  patientId: string;
  practitionerId: string;
  sessionTimestamp: string;
  sessionType: 'initial' | 'followup' | 'discharge';
  
  // Evaluación clínica mínima (obligatorio)
  chiefComplaint: string;
  redFlagsAssessed: boolean;
  redFlagsDetected: string[];
  contraindicationsChecked: boolean;
  
  // Plan documentado (obligatorio)
  planDocumented: boolean;
  planDetails: string;
  followUpScheduled: boolean;
}

export interface ClinicalValidations {
  // Validaciones condicionales
  painScale?: {
    required: boolean;
    value: number | null; // 0-10 EVA scale
    location: string;
  };
  
  rangeOfMotion?: {
    joint: string;
    measurements: Record<string, number>;
    comparedToNormal: boolean;
  };
  
  medicationVerification?: {
    medicationsListed: string[];
    contraindicationsChecked: string[];
    unprescribedDetected: boolean;
  };
}

export interface ClinicalNoteSchema {
  required: ClinicalNoteRequiredFields;
  validations: ClinicalValidations;
  
  // Mapeo a estándares
  coding?: {
    snomedCT: string[];
    icd10CA: string[];
    cptCodes: string[];
  };
  
  // Metadata para auditoría
  metadata: {
    schemaVersion: string;
    generatedBy: string;
    modelUsed: string;
    timestamp: string;
    completenessScore: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  completenessScore: number;
  missingRequired: string[];
  missingConditional: string[];
}

/**
 * Validador principal - Lógica core del negocio
 */
export class ClinicalSchemaValidator {
  private static readonly SCHEMA_VERSION = '1.0.0';
  
  static validate(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];
    const missingConditional: string[] = [];
    
    // Validaciones OBLIGATORIAS (regulatory requirements)
    if (!data.required?.patientId) {
      errors.push('Patient ID is required by PIPEDA regulations');
      missingRequired.push('patientId');
    }
    
    if (!data.required?.practitionerId) {
      errors.push('Practitioner ID is required for liability');
      missingRequired.push('practitionerId');
    }
    
    if (!data.required?.redFlagsAssessed) {
      errors.push('Red flags assessment is mandatory - liability requirement');
      missingRequired.push('redFlagsAssessed');
    }
    
    if (!data.required?.planDocumented) {
      errors.push('Treatment plan must be documented');
      missingRequired.push('planDocumented');
    }
    
    // Validaciones CONDICIONALES (clinical logic)
    if (data.painReported && !data.validations?.painScale?.value) {
      warnings.push('Pain scale (EVA) should be documented when pain is reported');
      missingConditional.push('painScale');
    }
    
    if (data.medicationsReported && !data.validations?.medicationVerification) {
      warnings.push('Medication verification recommended when medications mentioned');
      missingConditional.push('medicationVerification');
    }
    
    // Calcular completeness
    const requiredFieldsCount = 9;
    const completedRequired = requiredFieldsCount - missingRequired.length;
    const completenessScore = (completedRequired / requiredFieldsCount) * 100;
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      completenessScore,
      missingRequired,
      missingConditional
    };
  }
  
  /**
   * Genera el schema para incluir en prompts
   */
  static getSchemaForPrompt(): string {
    return `
MANDATORY FIELDS (must be present or note will be rejected):
- patientId: string
- practitionerId: string  
- sessionTimestamp: ISO 8601 format
- chiefComplaint: primary reason for visit
- redFlagsAssessed: boolean (true/false)
- redFlagsDetected: array of red flags found (can be empty)
- contraindicationsChecked: boolean
- planDocumented: boolean
- planDetails: treatment plan text

CONDITIONAL FIELDS (required when applicable):
- If pain mentioned → painScale (0-10 EVA) required
- If medications mentioned → medicationVerification required
- If ROM limitations → rangeOfMotion measurements required

CODING (when identifiable):
- Map diagnoses to SNOMED CT codes
- Map conditions to ICD-10-CA codes
- Include CPT codes for procedures`;
  }
}

export default ClinicalSchemaValidator;
