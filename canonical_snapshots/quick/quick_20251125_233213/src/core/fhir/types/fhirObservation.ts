// @ts-nocheck
/**
 * @fileoverview FHIR Observation Types - Lightweight Implementation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 */

import type { FhirResource } from './fhirPatient';

// FHIR Observation Resource - Core Fields
export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  
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
  
  basedOn?: Array<{
    reference: string;
    display?: string;
  }>;
  
  partOf?: Array<{
    reference: string;
    display?: string;
  }>;
  
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  }>;
  
  code: {
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
  
  focus?: Array<{
    reference: string;
    display?: string;
  }>;
  
  encounter?: {
    reference: string;
    display?: string;
  };
  
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  effectiveTiming?: {
    event?: string[];
    repeat?: {
      boundsDuration?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      boundsRange?: {
        low?: {
          value?: number;
          unit?: string;
          system?: string;
          code?: string;
        };
        high?: {
          value?: number;
          unit?: string;
          system?: string;
          code?: string;
        };
      };
      boundsPeriod?: {
        start?: string;
        end?: string;
      };
      count?: number;
      countMax?: number;
      duration?: number;
      durationMax?: number;
      durationUnit?: 'h' | 'min' | 's' | 'ms' | 'a' | 'mo' | 'wk' | 'd';
      frequency?: number;
      frequencyMax?: number;
      period?: number;
      periodMax?: number;
      periodUnit?: 'h' | 'min' | 's' | 'ms' | 'a' | 'mo' | 'wk' | 'd';
      timeOfDay?: string[];
      when?: 'MORN' | 'MORN.early' | 'MORN.late' | 'NOON' | 'AFT' | 'AFT.early' | 'AFT.late' | 'EVE' | 'EVE.early' | 'EVE.late' | 'NIGHT' | 'PHS' | 'HS' | 'WAKE' | 'C' | 'CM' | 'CD' | 'CV' | 'AC' | 'ACM' | 'ACD' | 'ACV' | 'PC' | 'PCM' | 'PCD' | 'PCV';
      offset?: number;
    };
    code?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
  };
  effectiveInstant?: string;
  
  issued?: string;
  
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  
  valueQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  valueString?: string;
  
  valueBoolean?: boolean;
  
  valueInteger?: number;
  
  valueRange?: {
    low?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    high?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  };
  
  valueRatio?: {
    numerator?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    denominator?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  };
  
  valueSampledData?: {
    origin: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    period: number;
    factor?: number;
    lowerLimit?: number;
    upperLimit?: number;
    dimensions: number;
    data?: string;
  };
  
  valueTime?: string;
  
  valueDateTime?: string;
  
  valuePeriod?: {
    start?: string;
    end?: string;
  };
  
  valueAttachment?: {
    contentType?: string;
    language?: string;
    data?: string;
    url?: string;
    size?: number;
    hash?: string;
    title?: string;
    creation?: string;
  };
  
  valueReference?: {
    reference: string;
    display?: string;
  };
  
  dataAbsentReason?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  }>;
  
  note?: Array<{
    authorString?: string;
    authorReference?: {
      reference: string;
      display?: string;
    };
    time?: string;
    text: string;
  }>;
  
  bodySite?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  method?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  
  specimen?: {
    reference: string;
    display?: string;
  };
  
  device?: {
    reference: string;
    display?: string;
  };
  
  referenceRange?: Array<{
    low?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    high?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    appliesTo?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    age?: {
      low?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      high?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    };
    text?: string;
  }>;
  
  hasMember?: Array<{
    reference: string;
    display?: string;
  }>;
  
  derivedFrom?: Array<{
    reference: string;
    display?: string;
  }>;
  
  component?: Array<{
    code: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    valueQuantity?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    valueCodeableConcept?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueRange?: {
      low?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      high?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    };
    valueRatio?: {
      numerator?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      denominator?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    };
    valueSampledData?: {
      origin: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      period: number;
      factor?: number;
      lowerLimit?: number;
      upperLimit?: number;
      dimensions: number;
      data?: string;
    };
    valueTime?: string;
    valueDateTime?: string;
    valuePeriod?: {
      start?: string;
      end?: string;
    };
    valueAttachment?: {
      contentType?: string;
      language?: string;
      data?: string;
      url?: string;
      size?: number;
      hash?: string;
      title?: string;
      creation?: string;
    };
    valueReference?: {
      reference: string;
      display?: string;
    };
    dataAbsentReason?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    };
    interpretation?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
      text?: string;
    }>;
    referenceRange?: Array<{
      low?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      high?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      type?: {
        coding: Array<{
          system: string;
          code: string;
          display?: string;
        }>;
        text?: string;
      };
      appliesTo?: Array<{
        coding: Array<{
          system: string;
          code: string;
          display?: string;
        }>;
        text?: string;
      }>;
      age?: {
        low?: {
          value?: number;
          unit?: string;
          system?: string;
          code?: string;
        };
        high?: {
          value?: number;
          unit?: string;
          system?: string;
          code?: string;
        };
      };
      text?: string;
    }>;
  }>;
}

// Validation result for Observation
export interface ObservationValidationResult {
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

// Observation mapping from internal to FHIR
export interface ObservationMapping {
  internalId: string;
  fhirId: string;
  mappedFields: string[];
  unmappedFields: string[];
  validationScore: number;
}

// Vital Signs specific types
export interface VitalSignsObservation extends FhirObservation {
  category: [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/observation-category';
      code: 'vital-signs';
      display: 'Vital Signs';
    }];
    text: 'Vital Signs';
  }];
}

// Common vital signs codes
export const VITAL_SIGNS_CODES = {
  BLOOD_PRESSURE: {
    system: 'http://loinc.org',
    code: '85354-9',
    display: 'Blood pressure panel with all children optional'
  },
  HEART_RATE: {
    system: 'http://loinc.org',
    code: '8867-4',
    display: 'Heart rate'
  },
  RESPIRATORY_RATE: {
    system: 'http://loinc.org',
    code: '9279-1',
    display: 'Respiratory rate'
  },
  BODY_TEMPERATURE: {
    system: 'http://loinc.org',
    code: '8310-5',
    display: 'Body temperature'
  },
  BODY_WEIGHT: {
    system: 'http://loinc.org',
    code: '29463-7',
    display: 'Body weight'
  },
  BODY_HEIGHT: {
    system: 'http://loinc.org',
    code: '8302-2',
    display: 'Body height'
  }
} as const;
