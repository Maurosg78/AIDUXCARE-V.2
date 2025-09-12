export interface ProfessionalProfile {
  specialty: string[];
  country: string;
  licenseNumber?: string;
  yearsExperience?: number;
  certifications?: string[];
}

export class ProfessionalContextManager {
  // Tests por especialidad y país
  static readonly TEST_LIBRARY = {
    MSK: {
      ES: [
        { name: "Test de Lasègue", sensitivity: 0.91, specificity: 0.26, indication: "radiculopatía lumbar" },
        { name: "Test de Spurling", sensitivity: 0.93, specificity: 0.93, indication: "radiculopatía cervical" },
        { name: "Test de Neer", sensitivity: 0.79, specificity: 0.53, indication: "pinzamiento subacromial" },
        { name: "Test de Hawkins-Kennedy", sensitivity: 0.79, specificity: 0.59, indication: "pinzamiento subacromial" },
        { name: "Test de Lachman", sensitivity: 0.86, specificity: 0.91, indication: "lesión LCA" },
        { name: "Test de McMurray", sensitivity: 0.61, specificity: 0.84, indication: "lesión meniscal" },
        { name: "Test de Faber", sensitivity: 0.60, specificity: 0.75, indication: "patología sacroilíaca" }
      ],
      GENERIC: [
        { name: "Timed Up and Go", sensitivity: 0.87, specificity: 0.87, indication: "riesgo de caídas" },
        { name: "6-Minute Walk Test", sensitivity: 0.82, specificity: 0.77, indication: "capacidad funcional" }
      ]
    },
    NEUROLOGICAL: {
      ES: [
        { name: "Mini-Mental State Exam", sensitivity: 0.79, specificity: 0.86, indication: "deterioro cognitivo" },
        { name: "Test de Romberg", sensitivity: 0.50, specificity: 0.95, indication: "propiocepción" }
      ]
    },
    LEGAL_COVERAGE: {
      UNIVERSAL: [
        { name: "PHQ-9", sensitivity: 0.88, specificity: 0.88, indication: "screening depresión - OBLIGATORIO si ideación suicida" },
        { name: "AUDIT-C", sensitivity: 0.86, specificity: 0.89, indication: "screening alcohol - RECOMENDADO si consumo referido" },
        { name: "Valoración nutricional MNA-SF", sensitivity: 0.85, specificity: 0.85, indication: "malnutrición en >65 años" }
      ]
    }
  };

  static generateContextualPrompt(
    transcript: string, 
    profile: ProfessionalProfile
  ): string {
    const testsForSpecialty = this.getRelevantTests(profile);
    
    return `You are a ${profile.specialty.join('/')} physiotherapist in ${profile.country}.
Extract and NORMALIZE clinical information following local standards.

CRITICAL REQUIREMENTS:
1. NORMALIZE medications to generic names (Spanish nomenclature preferred)
2. DETECT safety issues (suicidal ideation MUST be in redFlags)
3. SUGGEST tests relevant for:
   - Your specialty: ${profile.specialty.join(', ')}
   - Legal coverage in ${profile.country}
   - Patient presentation

MANDATORY TESTS FOR LEGAL COVERAGE:
- If suicidal ideation detected → PHQ-9 (REQUIRED)
- If fall risk → Timed Up and Go (REQUIRED)
- If cognitive concerns → Mini-Mental or MoCA (REQUIRED)

SPECIALTY-SPECIFIC TESTS FOR ${profile.specialty[0]}:
${testsForSpecialty.map(t => `- ${t.name}: ${t.indication}`).join('\n')}

TRANSCRIPT: "${transcript}"

RESPOND WITH NORMALIZED JSON including sensitivity/specificity for all tests.`;
  }

  static getRelevantTests(profile: ProfessionalProfile): any[] {
    const tests = [];
    
    // Tests específicos de especialidad
    profile.specialty.forEach(spec => {
      const specTests = this.TEST_LIBRARY[spec as keyof typeof this.TEST_LIBRARY];
      if (specTests) {
        const countryTests = specTests[profile.country as keyof typeof specTests] || specTests.GENERIC || [];
        tests.push(...countryTests);
      }
    });
    
    // Tests de cobertura legal (siempre incluir)
    tests.push(...this.TEST_LIBRARY.LEGAL_COVERAGE.UNIVERSAL);
    
    return tests;
  }
}
