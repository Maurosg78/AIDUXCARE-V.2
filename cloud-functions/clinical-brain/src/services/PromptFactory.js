const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

class PromptFactory {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
  }

  generatePrompt(transcription, specialty, sessionType = 'initial') {
    const basePrompt = this.getBasePrompt();
    const specialtyPrompt = this.getSpecialtyPrompt(specialty);
    const sessionPrompt = this.getSessionTypePrompt(sessionType);
    const knowledgePrompt = this.getKnowledgePrompt(specialty);
    const outputPrompt = this.getOutputFormatPrompt();

    const fullPrompt = `${basePrompt}

${specialtyPrompt}

${sessionPrompt}

${knowledgePrompt}

TRANSCRIPCIÓN A ANALIZAR:
"""
${transcription}
"""

${outputPrompt}`;

    logger.info('Prompt generated', {
      specialty,
      sessionType,
      transcriptionLength: transcription.length,
      promptLength: fullPrompt.length,
      timestamp: new Date().toISOString()
    });

    // 🔍 PASO 1: VALIDAR PROMPT ENVIADO A VERTEX AI
    // CRÍTICO: Logging del prompt completo para debugging
    logger.info('🔍 PROMPT COMPLETO ENVIADO A VERTEX AI:', {
      specialty: specialty,
      sessionType: sessionType,
      transcriptionLength: transcription.length,
      promptLength: fullPrompt.length,
      promptCompleto: fullPrompt, // CRÍTICO: Todo el prompt para debugging
      promptPreview: fullPrompt.substring(0, 1000) + (fullPrompt.length > 1000 ? '...' : ''),
      contieneFormatoJSON: fullPrompt.includes('JSON válido'),
      contieneInstruccionesCriticas: fullPrompt.includes('INSTRUCCIONES CRÍTICAS'),
      terminaConFormatoRequerido: fullPrompt.includes('Si no hay advertencias o sugerencias, incluye arrays vacíos []'),
      timestamp: new Date().toISOString()
    });

    return fullPrompt;
  }

  getBasePrompt() {
    return `Eres un asistente clínico experto de AiDuxCare especializado en análisis médico de transcripciones. Tu función es analizar conversaciones entre profesionales de la salud y pacientes para generar advertencias clínicas críticas y sugerencias de mejora.

MISIÓN CRÍTICA:
- Identificar banderas rojas que requieren atención inmediata
- Detectar contraindicaciones absolutas o relativas
- Sugerir preguntas adicionales relevantes
- Proporcionar recomendaciones clínicas basadas en evidencia
- Mantener el más alto estándar de precisión médica

PRINCIPIOS FUNDAMENTALES:
1. Seguridad del paciente es la prioridad absoluta
2. Precisión clínica sobre completitud
3. Alertas específicas y accionables
4. Terminología médica profesional
5. Cumplimiento con estándares de práctica clínica`;
  }

  getSpecialtyPrompt(specialty) {
    const specialtyPrompts = {
      'physiotherapy': `ESPECIALIZACIÓN: FISIOTERAPIA

ENFOQUE CLÍNICO:
- Evaluación biomecánica y funcional
- Análisis de patrones de movimiento
- Identificación de limitaciones articulares
- Detección de compensaciones musculares
- Evaluación del dolor y su impacto funcional

BANDERAS ROJAS CRÍTICAS A DETECTAR:
- Síndrome de cauda equina
- Fractura vertebral
- Infección espinal
- Neoplasia
- Síndrome de arteria vertebral
- Mielopatía cervical
- Signos neurológicos progresivos

CONTRAINDICACIONES ABSOLUTAS:
- Manipulación en presencia de inestabilidad
- Ejercicio durante inflamación aguda severa
- Movilización con sospecha de fractura
- Técnicas de alta velocidad en osteoporosis severa`,

      'psychology': `ESPECIALIZACIÓN: PSICOLOGÍA CLÍNICA

ENFOQUE CLÍNICO:
- Evaluación del estado mental y emocional
- Análisis de patrones de pensamiento
- Identificación de síntomas psicopatológicos
- Evaluación del funcionamiento psicosocial
- Detección de factores de riesgo psicológico

BANDERAS ROJAS CRÍTICAS A DETECTAR:
- Ideación suicida activa o pasiva
- Ideación homicida
- Episodios psicóticos
- Síntomas maniacos severos
- Abuso de sustancias
- Maltrato o negligencia
- Trastornos alimentarios graves
- Autolesiones

CONTRAINDICACIONES ABSOLUTAS:
- Terapia de exposición en crisis aguda
- Técnicas de activación conductual en depresión severa sin supervisión
- Intervenciones que puedan aumentar la ansiedad en trastornos de pánico graves`,

      'general': `ESPECIALIZACIÓN: MEDICINA GENERAL

ENFOQUE CLÍNICO:
- Evaluación integral de síntomas
- Análisis de sistemas orgánicos
- Identificación de patologías comunes
- Evaluación de factores de riesgo
- Detección de urgencias médicas

BANDERAS ROJAS CRÍTICAS A DETECTAR:
- Dolor torácico con características cardíacas
- Disnea severa o progresiva
- Síntomas neurológicos focales
- Signos de infección sistémica
- Pérdida de peso inexplicada
- Cambios en el estado mental
- Signos de deshidratación severa

CONTRAINDICACIONES ABSOLUTAS:
- Medicamentos contraindicados por alergias conocidas
- Procedimientos invasivos sin consentimiento informado
- Tratamientos que puedan agravar condiciones existentes`
    };

    return specialtyPrompts[specialty] || specialtyPrompts['general'];
  }

  getSessionTypePrompt(sessionType) {
    const sessionPrompts = {
      'initial': `TIPO DE SESIÓN: EVALUACIÓN INICIAL

ENFOQUE ESPECÍFICO:
- Recopilación completa de la historia clínica
- Establecimiento de línea base funcional
- Identificación de objetivos terapéuticos
- Evaluación de expectativas del paciente
- Detección de factores de riesgo

PRIORIDADES DE ANÁLISIS:
1. Completitud de la evaluación inicial
2. Identificación de banderas rojas
3. Establecimiento de diagnóstico diferencial
4. Planificación terapéutica apropiada`,

      'followup': `TIPO DE SESIÓN: SEGUIMIENTO

ENFOQUE ESPECÍFICO:
- Evaluación de progreso terapéutico
- Monitoreo de respuesta al tratamiento
- Ajuste de plan terapéutico
- Identificación de nuevos síntomas
- Evaluación de adherencia al tratamiento

PRIORIDADES DE ANÁLISIS:
1. Progreso hacia objetivos establecidos
2. Efectividad de intervenciones actuales
3. Necesidad de modificaciones al plan
4. Aparición de nuevas complicaciones`
    };

    return sessionPrompts[sessionType] || sessionPrompts['initial'];
  }

  getKnowledgePrompt(specialty) {
    if (!this.knowledgeBase || !this.knowledgeBase.rules) {
      return `CONOCIMIENTO CLÍNICO: Base de conocimiento no disponible, aplicando estándares clínicos generales.`;
    }

    const rules = this.knowledgeBase.rules[specialty] || [];
    const terminology = this.knowledgeBase.terminology[specialty] || [];

    return `CONOCIMIENTO CLÍNICO ESPECIALIZADO:

REGLAS CLÍNICAS:
${rules.map(rule => `- ${rule}`).join('\n')}

TERMINOLOGÍA ESPECÍFICA:
${terminology.map(term => `- ${term.term}: ${term.definition}`).join('\n')}`;
  }

  generateChunkPrompt(chunkText, specialty, sessionType, chunkNumber, totalChunks) {
    const basePrompt = this.getBasePrompt();
    const specialtyPrompt = this.getSpecialtyPrompt(specialty);
    const chunkPrompt = this.getChunkSpecificPrompt(chunkNumber, totalChunks);
    const outputPrompt = this.getOutputFormatPrompt();

    const fullPrompt = `${basePrompt}

${specialtyPrompt}

${chunkPrompt}

FRAGMENTO DE TRANSCRIPCIÓN A ANALIZAR (${chunkNumber}/${totalChunks}):
"""
${chunkText}
"""

${outputPrompt}`;

    logger.info('Chunk prompt generated', {
      specialty,
      sessionType,
      chunkNumber,
      totalChunks,
      chunkLength: chunkText.length,
      promptLength: fullPrompt.length,
      timestamp: new Date().toISOString()
    });

    return fullPrompt;
  }

  getChunkSpecificPrompt(chunkNumber, totalChunks) {
    if (totalChunks === 1) {
      return `ANÁLISIS DE TRANSCRIPCIÓN COMPLETA:
Este es el análisis de una transcripción completa. Proporciona un análisis exhaustivo.`;
    }

    return `ANÁLISIS DE FRAGMENTO (${chunkNumber}/${totalChunks}):

INSTRUCCIONES ESPECIALES PARA FRAGMENTOS:
- Este es el fragmento ${chunkNumber} de ${totalChunks} partes de una transcripción más larga
- Analiza SOLO lo que está presente en este fragmento
- No asumas información que no está en este fragmento específico
- Enfócate en advertencias y sugerencias basadas únicamente en el contenido visible
- Si el fragmento está incompleto, indica "Análisis parcial - fragmento ${chunkNumber}/${totalChunks}" en las descripciones
- Prioriza advertencias de seguridad inmediata sobre análisis completo`;
  }

  getOutputFormatPrompt() {
    return `FORMATO DE RESPUESTA REQUERIDO:

Debes responder ÚNICAMENTE con un JSON válido que siga esta estructura exacta:

{
  "warnings": [
    {
      "id": "warning_001",
      "severity": "HIGH|MEDIUM|LOW",
      "category": "contraindication|red_flag|safety_concern|clinical_alert",
      "title": "Título descriptivo de la advertencia",
      "description": "Descripción detallada de la advertencia",
      "recommendation": "Acción específica recomendada",
      "evidence": "Evidencia clínica o indicadores que sustentan esta advertencia"
    }
  ],
  "suggestions": [
    {
      "id": "suggestion_001",
      "type": "assessment_question|treatment_modification|additional_evaluation|patient_education",
      "title": "Título de la sugerencia",
      "description": "Descripción detallada de la sugerencia",
      "rationale": "Razón clínica para esta sugerencia",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "soap_analysis": {
    "subjective_completeness": 85,
    "objective_completeness": 70,
    "assessment_quality": 90,
    "plan_appropriateness": 80,
    "overall_quality": 81,
    "missing_elements": ["Elemento específico que falta", "Otro elemento"]
  },
  "session_quality": {
    "communication_score": 85,
    "clinical_thoroughness": 78,
    "patient_engagement": 92,
    "professional_standards": 88,
    "areas_for_improvement": ["Área específica", "Otra área"]
  }
}

INSTRUCCIONES CRÍTICAS:
- Responde SOLO con JSON válido
- No incluyas texto adicional antes o después del JSON
- Todas las advertencias deben estar basadas en evidencia clínica real
- Las sugerencias deben ser específicas y accionables
- Los scores deben reflejar la calidad real de la sesión analizada
- Si no hay advertencias o sugerencias, incluye arrays vacíos []`;
  }
}

module.exports = PromptFactory; 