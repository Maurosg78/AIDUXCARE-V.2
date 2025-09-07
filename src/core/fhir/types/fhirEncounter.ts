// @ts-nocheck
/**
 * @fileoverview FHIR Encounter Types - Lightweight Implementation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 */

import type { FhirResource } from './fhirPatient';

// FHIR Encounter Resource - Core Fields
export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  
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
  
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
  
  statusHistory?: Array<{
    status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
    period: {
      start?: string;
      end?: string;
    };
  }>;
  
  class: {
    system: string;
    code: string;
    display?: string;
  };
  
  classHistory?: Array<{
    class: {
      system: string;
      code: string;
      display?: string;
    };
    period: {
      start?: string;
      end?: string;
    };
  }>;
  
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  }>;
  
  serviceType?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  priority?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  subject?: {
    reference: string;
    display?: string;
  };
  
  episodeOfCare?: Array<{
    reference: string;
    display?: string;
  }>;
  
  basedOn?: Array<{
    reference: string;
    display?: string;
  }>;
  
  participant?: Array<{
    type?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    period?: {
      start?: string;
      end?: string;
    };
    individual?: {
      reference: string;
      display?: string;
    };
  }>;
  
  appointment?: Array<{
    reference: string;
    display?: string;
  }>;
  
  period?: {
    start?: string;
    end?: string;
  };
  
  length?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  }>;
  
  reasonReference?: Array<{
    reference: string;
    display?: string;
  }>;
  
  diagnosis?: Array<{
    condition: {
      reference: string;
      display?: string;
    };
    use?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    rank?: number;
  }>;
  
  account?: Array<{
    reference: string;
    display?: string;
  }>;
  
  hospitalization?: {
    preAdmissionIdentifier?: {
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
    };
    origin?: {
      reference: string;
      display?: string;
    };
    admitSource?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    reAdmission?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    dietPreference?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    specialCourtesy?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    specialArrangement?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    destination?: {
      reference: string;
      display?: string;
    };
    dischargeDisposition?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
  };
  
  location?: Array<{
    location: {
      reference: string;
      display?: string;
    };
    status?: 'planned' | 'active' | 'reserved' | 'completed';
    physicalType?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  serviceProvider?: {
    reference: string;
    display?: string;
  };
  
  partOf?: {
    reference: string;
    display?: string;
  };
}

// Validation result for Encounter
export interface EncounterValidationResult {
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

// Encounter mapping from internal to FHIR
export interface EncounterMapping {
  internalId: string;
  fhirId: string;
  mappedFields: string[];
  unmappedFields: string[];
  validationScore: number;
}
