/**
 * Certificate Types
 * 
 * TypeScript interfaces for medical certificate generation
 * for various medical certificates in Ontario, Canada.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: CPO Documentation Standards, Medical Certificate Standards
 */

import { SOAPNote } from './vertex-ai';

/**
 * Certificate Types
 */
export type CertificateType =
  | 'medical-certificate'        // Standard medical certificate for work absence
  | 'return-to-work-certificate' // Certificate clearing patient to return to work
  | 'fitness-to-work-certificate' // Certificate assessing fitness for work
  | 'disability-certificate'     // Certificate for disability benefits
  | 'accommodation-certificate';  // Certificate for workplace accommodations

/**
 * Patient Information for Certificates
 */
export interface CertificatePatientInfo {
  name: string;
  dateOfBirth: Date;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email?: string;
  healthCardNumber?: string; // OHIP number (optional, for privacy)
  employerName?: string;
  employerAddress?: string;
}

/**
 * Professional Information for Certificates
 */
export interface CertificateProfessionalInfo {
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
  licenseExpiry?: Date;
}

/**
 * Medical Condition Information
 */
export interface CertificateConditionInfo {
  diagnosis: string; // Primary diagnosis
  secondaryDiagnoses?: string[]; // Additional diagnoses if applicable
  onsetDate: Date; // When condition started
  currentStatus: string; // Current health status
  symptoms: string[]; // List of symptoms
  functionalImpact: string; // How condition affects daily activities
}

/**
 * Work-Related Information
 */
export interface CertificateWorkInfo {
  occupation: string; // Patient's occupation
  employerName?: string;
  workStartDate?: Date; // When patient started at this job
  lastWorkDate?: Date; // Last day patient worked
  expectedReturnDate?: Date; // Expected return to work date
  workRestrictions?: string[]; // Any work restrictions
  accommodations?: string[]; // Workplace accommodations needed
  clearedForWork: boolean; // Whether patient is cleared to return to work
  clearedForFullDuties: boolean; // Whether patient can perform full duties
  clearedForModifiedDuties: boolean; // Whether patient can perform modified duties
}

/**
 * Treatment Information
 */
export interface CertificateTreatmentInfo {
  treatmentProvided: string[]; // Treatments received
  medications?: string[]; // Medications prescribed
  followUpRequired: boolean;
  followUpDate?: Date;
  treatmentDuration: string; // Expected duration of treatment
  expectedRecoveryDate?: Date;
}

/**
 * Clinical Assessment (extracted from SOAP)
 */
export interface CertificateClinicalAssessment {
  subjective: string; // From SOAP Subjective
  objective: string; // From SOAP Objective
  assessment: string; // From SOAP Assessment
  plan: string; // From SOAP Plan
  prognosis: string; // Expected recovery timeline
  restrictions: {
    physical: string[]; // Physical restrictions
    work: string[]; // Work-related restrictions
    activities: string[]; // Activity restrictions
  };
}

/**
 * Compliance and Legal Information
 */
export interface CertificateCompliance {
  dateOfIssue: Date;
  expiryDate?: Date; // If certificate has expiry
  signatureRequired: boolean;
  disclaimers: string[];
  cpoCompliant: boolean;
  phipaCompliant: boolean;
  medicalCertificateStandardsCompliant: boolean;
  patientConsentObtained: boolean;
}

/**
 * Complete Certificate Data Structure
 */
export interface CertificateData {
  // Certificate Metadata
  certificateType: CertificateType;
  certificateNumber?: string; // Optional certificate number for tracking
  issueDate: Date;
  
  // Patient Information
  patient: CertificatePatientInfo;
  
  // Professional Information
  professional: CertificateProfessionalInfo;
  
  // Medical Condition
  condition: CertificateConditionInfo;
  
  // Work-Related Information
  work: CertificateWorkInfo;
  
  // Treatment Information
  treatment: CertificateTreatmentInfo;
  
  // Clinical Assessment
  clinical: CertificateClinicalAssessment;
  
  // Compliance
  compliance: CertificateCompliance;
  
  // Additional Notes
  additionalNotes?: string;
}

/**
 * Certificate Validation Result
 */
export interface CertificateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

/**
 * Certificate Generation Options
 */
export interface CertificateGenerationOptions {
  includeSignature?: boolean;
  includeDisclaimers?: boolean;
  format?: 'pdf' | 'json' | 'both';
  expiryDate?: Date; // Optional expiry date for certificate
  certificateNumber?: string; // Optional certificate number
}

