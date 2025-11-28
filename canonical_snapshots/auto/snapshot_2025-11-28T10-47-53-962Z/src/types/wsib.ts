/**
 * WSIB (Workplace Safety and Insurance Board) Types
 * 
 * TypeScript interfaces for WSIB-specific document generation
 * for workplace injury claims in Ontario, Canada.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: WSIB Standards, CPO Documentation Standards
 */

import { SOAPNote } from './vertex-ai';

/**
 * WSIB Form Types
 */
export type WSIBFormType = 
  | 'functional-abilities-form'    // FAF-8: Functional Abilities Form
  | 'treatment-plan'               // Treatment Plan Submission
  | 'progress-report'              // Progress Report
  | 'return-to-work-assessment';   // Return-to-Work Assessment

/**
 * Patient Information for WSIB Forms
 */
export interface WSIBPatientInfo {
  name: string;
  dateOfBirth: Date;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email?: string;
  wsibClaimNumber?: string;
  dateOfInjury: Date;
}

/**
 * Professional Information for WSIB Forms
 */
export interface WSIBProfessionalInfo {
  name: string;
  registrationNumber: string; // COTO registration number (e.g., ON-12345)
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicProvince: string;
  clinicPostalCode: string;
  phone: string;
  email: string;
  signature?: string; // Base64 encoded signature image
}

/**
 * Injury Information
 */
export interface WSIBInjuryInfo {
  dateOfInjury: Date;
  mechanismOfInjury: string; // How the injury occurred
  bodyPartAffected: string[]; // List of affected body parts
  workRelated: boolean;
  preInjuryStatus: string; // Patient's status before injury
  currentStatus: string; // Current functional status
  injuryDescription: string; // Detailed description
}

/**
 * Functional Limitations
 */
export interface WSIBFunctionalLimitation {
  activity: string; // e.g., "Lifting", "Standing", "Walking"
  limitation: string; // Description of limitation
  duration: string; // How long the limitation lasts
  frequency: string; // How often it occurs
}

/**
 * Work Restrictions
 */
export interface WSIBWorkRestriction {
  restriction: string; // e.g., "No lifting >20 lbs"
  reason: string; // Clinical reason
  duration: string; // Expected duration
  reviewDate?: Date; // When to review
}

/**
 * Treatment Information
 */
export interface WSIBTreatmentInfo {
  startDate: Date;
  frequency: string; // e.g., "2x per week"
  duration: string; // e.g., "6 weeks"
  modalities: string[]; // Treatment modalities used
  exercises: string[]; // Prescribed exercises
  expectedOutcome: string;
  goals: string[];
}

/**
 * Return-to-Work Recommendations
 */
export interface WSIBReturnToWork {
  currentCapacity: string; // Current work capacity
  recommendedWorkType: string; // Type of work recommended
  restrictions: WSIBWorkRestriction[];
  timeline: string; // Expected timeline for RTW
  accommodations: string[]; // Workplace accommodations needed
  reviewDate: Date; // When to reassess
}

/**
 * Clinical Assessment (extracted from SOAP)
 */
export interface WSIBClinicalAssessment {
  subjective: string; // From SOAP Subjective
  objective: string; // From SOAP Objective
  assessment: string; // From SOAP Assessment
  plan: string; // From SOAP Plan
  functionalLimitations: WSIBFunctionalLimitation[];
  workRestrictions: WSIBWorkRestriction[];
  returnToWorkRecommendations: WSIBReturnToWork;
}

/**
 * Compliance and Legal Information
 */
export interface WSIBCompliance {
  dateOfReport: Date;
  signatureRequired: boolean;
  disclaimers: string[];
  cpoCompliant: boolean;
  phipaCompliant: boolean;
  wsibCompliant: boolean;
}

/**
 * Complete WSIB Form Data Structure
 */
export interface WSIBFormData {
  // Form Metadata
  formType: WSIBFormType;
  formVersion: string; // e.g., "FAF-8"
  reportDate: Date;
  
  // Patient Information
  patient: WSIBPatientInfo;
  
  // Professional Information
  professional: WSIBProfessionalInfo;
  
  // Injury Information
  injury: WSIBInjuryInfo;
  
  // Clinical Assessment
  clinical: WSIBClinicalAssessment;
  
  // Treatment Information
  treatment: WSIBTreatmentInfo;
  
  // Compliance
  compliance: WSIBCompliance;
  
  // Additional Notes
  additionalNotes?: string;
}

/**
 * WSIB Form Validation Result
 */
export interface WSIBValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

/**
 * WSIB Form Generation Options
 */
export interface WSIBFormGenerationOptions {
  includeSignature?: boolean;
  includeDisclaimers?: boolean;
  format?: 'pdf' | 'json' | 'both';
  previousReport?: WSIBFormData; // For progress reports
}

