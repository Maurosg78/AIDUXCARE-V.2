/**
 * MVA (Motor Vehicle Accident) Types
 * 
 * TypeScript interfaces for MVA-specific document generation
 * for motor vehicle accident claims in Ontario, Canada.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: OCF Standards, CPO Documentation Standards
 */

import { SOAPNote } from './vertex-ai';

/**
 * MVA Form Types (Ontario Claim Forms)
 */
export type MVAFormType =
  | 'treatment-plan'              // OCF-18: Treatment Plan
  | 'treatment-confirmation'      // OCF-19: Treatment Confirmation
  | 'attendant-care-assessment'   // OCF-21: Assessment of Attendant Care Needs
  | 'treatment-plan-update'       // OCF-23: Treatment Plan Update
  | 'treatment-confirmation-update'; // OCF-24: Treatment Confirmation Update

/**
 * Patient Information for MVA Forms
 */
export interface MVAPatientInfo {
  name: string;
  dateOfBirth: Date;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email?: string;
  insurancePolicyNumber?: string;
  claimNumber?: string;
  dateOfAccident: Date;
  driverLicenseNumber?: string;
}

/**
 * Professional Information for MVA Forms
 */
export interface MVAProfessionalInfo {
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
 * Accident Information
 */
export interface MVAAccidentInfo {
  dateOfAccident: Date;
  timeOfAccident?: string;
  location: string; // Address or location description
  accidentType: string; // e.g., "Rear-end collision", "Side impact", "Rollover"
  vehicleRole: 'driver' | 'passenger' | 'pedestrian' | 'cyclist' | 'motorcyclist';
  seatbeltUsed?: boolean;
  airbagDeployed?: boolean;
  ambulanceRequired: boolean;
  hospitalAdmitted: boolean;
  hospitalName?: string;
  hospitalAdmissionDate?: Date;
  hospitalDischargeDate?: Date;
  accidentDescription: string; // Detailed description
}

/**
 * Injury Information
 */
export interface MVAInjuryInfo {
  bodyPartsAffected: string[]; // List of affected body parts
  primaryInjury: string; // Primary injury diagnosis
  secondaryInjuries: string[]; // Additional injuries
  preAccidentStatus: string; // Patient's status before accident
  currentStatus: string; // Current functional status
  painLevel?: number; // 0-10 scale
  painLocation?: string[];
  symptoms: string[]; // e.g., ["Headache", "Neck pain", "Dizziness"]
}

/**
 * Functional Limitations
 */
export interface MVAFunctionalLimitation {
  activity: string; // e.g., "Driving", "Lifting", "Sleeping"
  limitation: string; // Description of limitation
  severity: 'mild' | 'moderate' | 'severe';
  duration: string; // How long the limitation lasts
  frequency: string; // How often it occurs
}

/**
 * Treatment Information
 */
export interface MVATreatmentInfo {
  startDate: Date;
  frequency: string; // e.g., "2x per week"
  duration: string; // e.g., "6 weeks"
  modalities: string[]; // Treatment modalities used
  exercises: string[]; // Prescribed exercises
  expectedOutcome: string;
  goals: string[];
  estimatedCost?: number;
  priorApprovalRequired: boolean;
}

/**
 * Attendant Care Information (for OCF-21)
 */
export interface MVAAttendantCareInfo {
  required: boolean;
  hoursPerDay?: number;
  hoursPerWeek?: number;
  typeOfCare: string[]; // e.g., ["Personal care", "Housekeeping", "Transportation"]
  reason: string; // Clinical reason for attendant care
  startDate?: Date;
  endDate?: Date;
  estimatedCost?: number;
}

/**
 * Clinical Assessment (extracted from SOAP)
 */
export interface MVAClinicalAssessment {
  subjective: string; // From SOAP Subjective
  objective: string; // From SOAP Objective
  assessment: string; // From SOAP Assessment
  plan: string; // From SOAP Plan
  functionalLimitations: MVAFunctionalLimitation[];
  prognosis: string; // Expected recovery timeline
  returnToActivitiesRecommendations: {
    driving: {
      cleared: boolean;
      restrictions?: string;
      timeline?: string;
    };
    work: {
      cleared: boolean;
      restrictions?: string;
      timeline?: string;
    };
    activitiesOfDailyLiving: {
      status: string;
      restrictions?: string;
    };
  };
}

/**
 * Insurance Information
 */
export interface MVAInsuranceInfo {
  insuranceCompany: string;
  policyNumber: string;
  claimNumber: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  dateOfReport: Date;
}

/**
 * Compliance and Legal Information
 */
export interface MVACompliance {
  dateOfReport: Date;
  signatureRequired: boolean;
  disclaimers: string[];
  cpoCompliant: boolean;
  phipaCompliant: boolean;
  ocfCompliant: boolean;
  statutoryAccidentBenefitsSchedule: boolean; // SABS compliance
}

/**
 * Complete MVA Form Data Structure
 */
export interface MVAFormData {
  // Form Metadata
  formType: MVAFormType;
  formVersion: string; // e.g., "OCF-18"
  reportDate: Date;
  
  // Patient Information
  patient: MVAPatientInfo;
  
  // Professional Information
  professional: MVAProfessionalInfo;
  
  // Accident Information
  accident: MVAAccidentInfo;
  
  // Injury Information
  injury: MVAInjuryInfo;
  
  // Clinical Assessment
  clinical: MVAClinicalAssessment;
  
  // Treatment Information
  treatment: MVATreatmentInfo;
  
  // Attendant Care (if applicable)
  attendantCare?: MVAAttendantCareInfo;
  
  // Insurance Information
  insurance: MVAInsuranceInfo;
  
  // Compliance
  compliance: MVACompliance;
  
  // Additional Notes
  additionalNotes?: string;
}

/**
 * MVA Form Validation Result
 */
export interface MVAValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

/**
 * MVA Form Generation Options
 */
export interface MVAFormGenerationOptions {
  includeSignature?: boolean;
  includeDisclaimers?: boolean;
  format?: 'pdf' | 'json' | 'both';
  previousReport?: MVAFormData; // For update forms
}

