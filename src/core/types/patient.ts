// @ts-nocheck
import { Timestamp } from 'firebase/firestore';

export type PatientCore = {
  firstName: string;
  lastName: string;
  chiefComplaint: string;
  birthDate?: string;           // ISO yyyy-mm-dd
  email?: string;
  phone?: string;
  status: 'active'|'inactive';
  ownerUid: string;
  createdAt: Date | Timestamp;
  consent?: { 
    simpleAccepted?: boolean; 
    acceptedAt?: string; 
    version?: string 
  };
  preferredLanguage?: 'es'|'en'|'pt'|'fr'|'other';
  uiPreferences?: { 
    density?: 'comfortable'|'compact'; 
    theme?: 'inside' 
  };
  communicationNotes?: string;
};

export type PatientClinicalSnapshot = {
  diagnoses?: Array<{ 
    code?: string; 
    system?: 'icd10'|'snomed'; 
    display: string 
  }>;
  comorbidities?: string[];
  allergies?: Array<{ 
    display: string; 
    code?: string 
  }>;
  precautions?: string[];
  riskFlags?: string[];
};

export type PatientAdvanced = {
  documentId?: { 
    type?: 'dni'|'passport'|'other'; 
    country?: string; 
    value: string 
  };
  payer?: { 
    insurer?: string; 
    planId?: string; 
    memberId?: string; 
    copay?: number 
  };
};

export type Patient = PatientCore & {
  clinical?: PatientClinicalSnapshot;
  advanced?: PatientAdvanced;
  tags?: string[];
  provenance?: { 
    createdBy: string; 
    updatedBy?: string 
  };
};

// FHIR MAPPING TYPES (para conversión futura)
export type FhirPatient = {
  // FHIR: Patient resource
  resourceType: 'Patient';
  identifier?: Array<{ system: string; value: string }>;
  name: Array<{ family: string; given: string[] }>;
  birthDate?: string;
  telecom?: Array<{ system: 'phone'|'email'; value: string }>;
  communication?: Array<{ language: { coding: Array<{ system: string; code: string }> } }>;
};

export type FhirCondition = {
  // FHIR: Condition resource (diagnoses)
  resourceType: 'Condition';
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string };
  clinicalStatus?: { coding: Array<{ system: string; code: string }> };
};

export type FhirAllergyIntolerance = {
  // FHIR: AllergyIntolerance resource
  resourceType: 'AllergyIntolerance';
  code: { coding: Array<{ system: string; code: string; display: string }> };
  patient: { reference: string };
  clinicalStatus?: { coding: Array<{ system: string; code: string }> };
};

export type FhirConsent = {
  // FHIR: Consent resource
  resourceType: 'Consent';
  status: 'active'|'inactive';
  scope: { coding: Array<{ system: string; code: string }> };
  patient: { reference: string };
  dateTime?: string;
};