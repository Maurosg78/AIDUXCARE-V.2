/**
 * @fileoverview FHIR Patient Types - Lightweight Implementation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 */

// Base FHIR Resource
export interface FhirResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
    tag?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
}

// FHIR Patient Resource - Core Fields
export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  
  // Required fields for CA Core and US Core
  identifier?: Array<{
    use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
    system?: string;
    value: string;
    assigner?: {
      reference?: string;
      display?: string;
    };
  }>;
  
  active?: boolean;
  
  name?: Array<{
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  telecom?: Array<{
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
    rank?: number;
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  gender?: 'male' | 'female' | 'other' | 'unknown';
  
  birthDate?: string;
  
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  
  address?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type?: 'postal' | 'physical' | 'both';
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  maritalStatus?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  
  photo?: Array<{
    contentType?: string;
    language?: string;
    data?: string;
    url?: string;
    size?: number;
    hash?: string;
    title?: string;
    creation?: string;
  }>;
  
  contact?: Array<{
    relationship?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    name?: {
      use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
      text?: string;
      family?: string;
      given?: string[];
      prefix?: string[];
      suffix?: string[];
      period?: {
        start?: string;
        end?: string;
      };
    };
    telecom?: Array<{
      system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
      value?: string;
      use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
      rank?: number;
      period?: {
        start?: string;
        end?: string;
      };
    }>;
    address?: {
      use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
      type?: 'postal' | 'physical' | 'both';
      text?: string;
      line?: string[];
      city?: string;
      district?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      period?: {
        start?: string;
        end?: string;
      };
    };
    gender?: 'male' | 'female' | 'other' | 'unknown';
    organization?: {
      reference?: string;
      display?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  communication?: Array<{
    language: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    preferred?: boolean;
  }>;
  
  generalPractitioner?: Array<{
    reference?: string;
    display?: string;
  }>;
  
  managingOrganization?: {
    reference?: string;
    display?: string;
  };
  
  link?: Array<{
    other: {
      reference: string;
      display?: string;
    };
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }>;
}

// Validation result for Patient
export interface PatientValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: {
    caCore: boolean;
    usCore: boolean;
    fhirR4: boolean;
  };
  suggestions: string[];
}

// Patient mapping from internal to FHIR
export interface PatientMapping {
  internalId: string;
  fhirId: string;
  mappedFields: string[];
  unmappedFields: string[];
  validationScore: number;
}
