/**
 * 🧠 AiDuxCare - PromptFactory
 * Generador de super-prompts especializados para Vertex AI
 * Optimiza la comunicación entre contexto clínico y modelos Gemini
 */

export type MedicalSpecialty = 
  | 'fisioterapia' 
  | 'psicologia' 
  | 'medicina_general';

export type CaseComplexity = 'simple' | 'moderate' | 'critical';

export interface PromptContext {
  specialty: MedicalSpecialty;
  complexity: CaseComplexity;
  redFlags: string[];
  patientContext?: string;
  medicalHistory?: string;
}

export class PromptFactory {
  private static readonly SPECIALTY_PROMPTS = {
    fisioterapia: {
      system: `Eres un fisioterapeuta experto con 15+ años de experiencia en rehabilitación musculoesquelética. 
Especializado en:
- Análisis biomecánico avanzado
- Terapia manual y ejercicio terapéutico
- Detección de banderas rojas ortopédicas
- Protocolos de rehabilitación basados en evidencia

Utiliza terminología fisioterapéutica precisa y clasifica la información según el formato SOAP.`,

      entityExtraction: `Extrae entidades clínicas específicas de fisioterapia:
- Síntomas: dolor, limitación, rigidez, debilidad
- Anatomía: estructuras específicas (L4-L5, manguito rotador, etc.)
- Tests: ortopédicos, neurológicos, funcionales
- Tratamientos: técnicas manuales, ejercicios, modalidades
- Banderas rojas: síntomas de alarma que requieren derivación`,

      soapGeneration: `Genera un documento SOAP fisioterapéutico profesional:
S (Subjetivo): Síntomas reportados por el paciente, historia del problema
O (Objetivo): Hallazgos de la evaluación física, tests realizados
A (Assessment): Análisis clínico, hipótesis diagnóstica, nivel de evidencia
P (Plan): Plan de tratamiento, ejercicios, seguimiento, precauciones`
    },

    psicologia: {
      system: `Eres un psicólogo clínico especializado en evaluación y tratamiento psicológico.
Especializado en:
- Evaluación DSM-5
- Detección de riesgo suicida
- Trastornos del estado de ánimo y ansiedad
- Intervenciones basadas en evidencia

Utiliza terminología psicológica precisa y clasifica según criterios DSM-5.`,

      entityExtraction: `Extrae entidades clínicas psicológicas:
- Síntomas: depresivos, ansiosos, psicóticos
- Diagnósticos: según DSM-5
- Factores de riesgo: suicidio, violencia, abuso
- Funcionamiento: social, laboral, familiar
- Tratamientos: psicoterapia, farmacología, derivación`,

      soapGeneration: `Genera un documento SOAP psicológico:
S (Subjetivo): Síntomas reportados, historia psicológica
O (Objetivo): Observaciones conductuales, tests aplicados
A (Assessment): Impresión diagnóstica, nivel de riesgo
P (Plan): Plan de tratamiento, seguimiento, derivación si necesario`
    },

    medicina_general: {
      system: `Eres un médico general con experiencia en atención primaria.
Especializado en:
- Evaluación integral del paciente
- Detección de condiciones médicas
- Derivación apropiada a especialistas
- Manejo de condiciones crónicas

Utiliza terminología médica estándar y clasifica según criterios clínicos.`,

      entityExtraction: `Extrae entidades médicas generales:
- Síntomas: sistémicos, específicos, de alarma
- Diagnósticos: diferenciales, presuntivos
- Medicamentos: actuales, alergias, interacciones
- Factores de riesgo: cardiovasculares, metabólicos
- Derivación: indicaciones para especialistas`,

      soapGeneration: `Genera un documento SOAP médico:
S (Subjetivo): Síntomas, historia médica, medicamentos
O (Objetivo): Examen físico, signos vitales, hallazgos
A (Assessment): Impresión diagnóstica, diferenciales
P (Plan): Tratamiento, seguimiento, derivación`
    }
  };

  /**
   * Genera prompt de sistema especializado
   */
  static generateSystemPrompt(context: PromptContext): string {
    const specialtyPrompt = this.SPECIALTY_PROMPTS[context.specialty];
    if (!specialtyPrompt) {
      throw new Error(`Especialidad no soportada: ${context.specialty}`);
    }

    let prompt = specialtyPrompt.system;

    // Agregar contexto de complejidad
    if (context.complexity === 'critical') {
      prompt += `\n\nCASO CRÍTICO: Se han detectado ${context.redFlags.length} banderas rojas. 
Utiliza máxima precisión y considera derivación inmediata si es necesario.`;
    }

    // Agregar contexto del paciente si existe
    if (context.patientContext) {
      prompt += `\n\nContexto del paciente: ${context.patientContext}`;
    }

    return prompt;
  }

  /**
   * Genera prompt para extracción de entidades
   */
  static generateEntityExtractionPrompt(context: PromptContext, text: string): string {
    const specialtyPrompt = this.SPECIALTY_PROMPTS[context.specialty];
    if (!specialtyPrompt) {
      throw new Error(`Especialidad no soportada: ${context.specialty}`);
    }

    return `${specialtyPrompt.entityExtraction}

Texto a analizar:
"${text}"

Extrae las entidades clínicas y devuelve en formato JSON:
{
  "entities": [
    {
      "text": "texto extraído",
      "type": "tipo de entidad",
      "confidence": 0.95,
      "start": 0,
      "end": 10
    }
  ]
}`;
  }

  /**
   * Genera prompt para generación SOAP
   */
  static generateSOAPPrompt(
    context: PromptContext, 
    transcription: string, 
    entities: Array<Record<string, unknown>>
  ): string {
    const specialtyPrompt = this.SPECIALTY_PROMPTS[context.specialty];
    if (!specialtyPrompt) {
      throw new Error(`Especialidad no soportada: ${context.specialty}`);
    }

    return `${specialtyPrompt.soapGeneration}

Transcripción de la consulta:
"${transcription}"

Entidades clínicas identificadas:
${JSON.stringify(entities, null, 2)}

Genera un documento SOAP completo y estructurado. Devuelve en formato JSON:
{
  "subjective": "Sección subjetiva",
  "objective": "Sección objetiva", 
  "assessment": "Sección de evaluación",
  "plan": "Sección de plan"
}`;
  }

  /**
   * Genera prompt para análisis de complejidad
   */
  static generateComplexityAnalysisPrompt(text: string): string {
    return `Analiza la complejidad clínica del siguiente texto médico:

"${text}"

Evalúa:
1. Complejidad del caso (simple/moderate/critical)
2. Banderas rojas detectadas
3. Nivel de urgencia
4. Especialidad médica más apropiada

Devuelve en formato JSON:
{
  "complexity": "simple|moderate|critical",
  "redFlags": ["bandera1", "bandera2"],
  "urgency": "low|medium|high",
  "specialty": "fisioterapia|psicologia|medicina_general",
  "confidence": 0.95
}`;
  }

  /**
   * Genera prompt para detección de banderas rojas
   */
  static generateRedFlagDetectionPrompt(text: string, specialty: MedicalSpecialty): string {
    const redFlagCriteria = {
      fisioterapia: [
        'Dolor nocturno severo',
        'Pérdida de peso inexplicada',
        'Dolor que no mejora con reposo',
        'Síntomas neurológicos',
        'Historia de cáncer',
        'Trauma reciente significativo'
      ],
      psicologia: [
        'Ideación suicida',
        'Alucinaciones',
        'Delirios',
        'Agresividad severa',
        'Abuso de sustancias',
        'Riesgo de daño a otros'
      ],
      medicina_general: [
        'Dolor torácico',
        'Dificultad respiratoria',
        'Pérdida de consciencia',
        'Sangrado abundante',
        'Fiebre alta persistente',
        'Síntomas neurológicos agudos'
      ]
    };

    const criteria = redFlagCriteria[specialty] || [];

    return `Detecta banderas rojas en el siguiente texto médico:

"${text}"

Banderas rojas a evaluar (${specialty}):
${criteria.map(c => `- ${c}`).join('\n')}

Devuelve en formato JSON:
{
  "redFlags": [
    {
      "type": "tipo de bandera",
      "severity": "low|medium|high",
      "description": "descripción",
      "requiresImmediateAction": true/false
    }
  ],
  "overallRisk": "low|medium|high"
}`;
  }
} 