import { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

export interface CanadianPromptParams {
  transcript: string;
  professionalProfile?: ProfessionalProfile;
  contextoPaciente?: string;
  instrucciones?: string;
}

export const CanadianPromptFactory = {
  create: (params: CanadianPromptParams) => {
    const profile = params.professionalProfile;
    const specialty = profile?.specialty || 'general physiotherapy';
    const experience = profile?.experienceYears || 'standard';
    
    // Personalización basada en perfil
    const specialtyInstructions = getSpecialtyInstructions(specialty, profile);
    const legalComplianceSection = getUpdatedOntarioLegalFramework();
    const techniquePersonalization = getTechniquePersonalization(profile);
    
    return `You are a specialized clinical assistant for physiotherapy in Ontario, Canada. 

PROFESSIONAL CONTEXT:
- Specialization: ${specialty}
- Experience Level: ${experience} years
- Ontario Legal Framework: PHIPA, PIPEDA, CPO compliance required
${techniquePersonalization}

LEGAL COMPLIANCE (ONTARIO):
${legalComplianceSection}

CLINICAL ANALYSIS INSTRUCTIONS:
${specialtyInstructions}
- Provide evidence-based assessments per current research
- Suggest interventions based on latest evidence
- Prioritize by clinical relevance and demonstrated effectiveness
- Maintain conciseness: maximum 15 words per item

REQUIRED JSON OUTPUT:
{
  "chief_complaint": "Precise description in <20 words",
  "clinical_findings": [],
  "occupational_context": [],
  "psychosocial_context": [],
  "current_medication": [],
  "medical_history": [],
  "relevant_findings": [],
  "probable_diagnoses": [],
  "red_flags": [],
  "yellow_flags": [],
  "physical_assessments_suggested": [
    "Provide MINIMUM 3 specific tests with real S/E values",
    {
      "test": "test name",
      "sensitivity": 0.00,
      "specificity": 0.00,
      "purpose": "what it evaluates",
      "contraindicated_if": "",
      "rationale": ""
    }
  ],
  "treatment_plan_suggested": [],
  "referral_recommended": "",
  "estimated_prognosis": "",
  "safety_notes": "",
  "legal_risk": "low",
  "ontario_compliance_notes": "PHIPA/PIPEDA/CPO considerations"
}

TRANSCRIPT:
${params.transcript}`;
  }
};

function getSpecialtyInstructions(specialty: string, profile?: ProfessionalProfile): string {
  const specialtyMap: { [key: string]: string } = {
    'ortopedia': 'Focus on musculoskeletal conditions, joint mechanics, and movement patterns',
    'deportiva': 'Emphasize sport-specific injuries, return-to-play protocols, and performance optimization',
    'neurologia': 'Prioritize neurological assessments, motor control, and functional rehabilitation',
    'pediatrica': 'Consider developmental milestones, family dynamics, and age-appropriate interventions'
  };
  
  return specialtyMap[specialty.toLowerCase()] || 'General physiotherapy assessment and treatment planning';
}

function getTechniquePersonalization(profile?: ProfessionalProfile): string {
  // Aquí iría la lógica para detectar técnicas certificadas del perfil
  // Por ahora, placeholder para futuras expansiones
  let techniques = '';
  
  // Ejemplo de cómo se podría personalizar:
  if (profile?.specialty?.includes('ortopedia')) {
    techniques += `
SPECIALIZED TECHNIQUES AVAILABLE:
- Consider dry needling for trigger point management (Ontario certified)
- Kinesio taping applications for support and proprioception
- Manual therapy techniques per Ontario scope of practice`;
  }
  
  return techniques;
}

function getUpdatedOntarioLegalFramework(): string {
  return `
PHIPA (Personal Health Information Protection Act):
- Patient consent documented for all assessments
- Privacy protection protocols followed
- Information sharing limitations observed

PIPEDA (Personal Information Protection):
- Data retention policies applied
- Patient rights notification provided
- Breach prevention measures active

CPO (College of Physicians and Surgeons Ontario):
- Professional standards maintained
- Scope of practice boundaries observed
- Documentation requirements met
- Continuing education compliance verified`;
}

import { PHIPA_REGULATIONS } from '../legal/ontario/phipa-regulations';
import { CPO_STANDARDS } from '../legal/ontario/cpo-standards';

