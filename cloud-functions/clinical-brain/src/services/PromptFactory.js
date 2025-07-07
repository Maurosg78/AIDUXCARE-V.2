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

  // 🚀 PROMPTS ESTRUCTURADOS V2 - OPTIMIZACIÓN CRÍTICA PARA EVITAR TIMEOUT
  generatePrompt(transcription, specialty = 'physiotherapy', sessionType = 'initial') {
    // Obtener conocimiento específico de la knowledge base
    const redFlags = this.getRedFlagsForSpecialty(specialty);
    const contraindicaciones = this.getContraindicationsForSpecialty(specialty);
    const terminologiaEsencial = this.getEssentialTerminologyForSpecialty(specialty);
    
    // Prompt ultra-conciso y eficiente con conocimiento especializado
    const optimizedPrompt = `Analiza esta transcripción médica como FISIOTERAPEUTA EXPERTO especializado en ${specialty}.

TRANSCRIPCIÓN:
"""
${transcription}
"""

TAREAS ESPECÍFICAS:
1. Detecta BANDERAS ROJAS críticas (riesgo inmediato derivación urgente)
2. Identifica CONTRAINDICACIONES para terapia manual
3. Genera 3-5 SUGERENCIAS fisioterapéuticas específicas y accionables
4. Evalúa calidad SOAP (0-100%)

BANDERAS ROJAS CRÍTICAS A DETECTAR:
${redFlags}

CONTRAINDICACIONES ABSOLUTAS:
${contraindicaciones}

TERMINOLOGÍA CLAVE:
${terminologiaEsencial}

RESPONDE SOLO CON JSON:
{
  "warnings": [
    {
      "severity": "HIGH|MEDIUM|LOW",
      "category": "red_flag|contraindication|referral",
      "title": "Título específico fisioterapéutico",
      "description": "Descripción clínica detallada desde perspectiva fisioterapéutica",
      "action": "Acción específica: derivación urgente, contraindicación tratamiento, o precaución"
    }
  ],
  "suggestions": [
    {
      "type": "assessment|treatment|education|referral",
      "title": "Sugerencia fisioterapéutica específica",
      "description": "Descripción práctica con terminología de fisioterapia",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "soap_quality": {
    "subjective": 85,
    "objective": 70,
    "assessment": 90,
    "plan": 80,
    "overall": 81
  }
}`;

    logger.info('🚀 PROMPT FISIOTERAPÉUTICO V2 CALIBRADO:', {
      specialty,
      sessionType,
      transcriptionLength: transcription.length,
      promptLength: optimizedPrompt.length,
      redFlagsCount: this.getRedFlagsCount(specialty),
      terminologyCount: this.getTerminologyCount(specialty),
      hasKnowledgeBase: !!this.knowledgeBase,
      timestamp: new Date().toISOString()
    });

    return optimizedPrompt;
  }

  // Obtener banderas rojas específicas de la knowledge base
  getRedFlagsForSpecialty(specialty) {
    if (this.knowledgeBase && this.knowledgeBase.redFlags && this.knowledgeBase.redFlags[specialty]) {
      const redFlags = this.knowledgeBase.redFlags[specialty];
      // Seleccionar las más críticas para mantener prompt conciso
      const criticalRedFlags = redFlags.slice(0, 8); // Top 8 más críticas
      return criticalRedFlags.map(flag => `- ${flag}`).join('\n');
    }
    
    // Fallback si no hay knowledge base
    const fallbackRedFlags = {
      'physiotherapy': '- Dolor nocturno que no cede con cambios de postura\n- Pérdida de sensibilidad en silla de montar\n- Disfunción de esfínteres\n- Signos neurológicos progresivos\n- Síntomas de arteria vertebral\n- Debilidad progresiva en extremidades',
      'psychology': '- Ideación suicida/homicida\n- Psicosis activa\n- Episodio maníaco severo\n- Autolesiones\n- Comportamiento agresivo',
      'general': '- Dolor torácico cardíaco\n- Disnea severa\n- Síntomas neurológicos focales\n- Sepsis\n- Pérdida de conciencia'
    };
    return fallbackRedFlags[specialty] || fallbackRedFlags['general'];
  }

  // Obtener contraindicaciones específicas de la knowledge base
  getContraindicationsForSpecialty(specialty) {
    if (this.knowledgeBase && this.knowledgeBase.contraindications && this.knowledgeBase.contraindications.absolute) {
      const contraindications = this.knowledgeBase.contraindications.absolute;
      // Seleccionar las más relevantes para fisioterapia
      const criticalContraindications = contraindications.slice(0, 6);
      return criticalContraindications.map(contra => `- ${contra}`).join('\n');
    }
    
    // Fallback
    return '- Fractura no consolidada\n- Síndrome de cauda equina\n- Manipulación con inestabilidad articular\n- Crisis inflamatoria aguda\n- Sospecha de tumor maligno\n- Mielopatía cervical progresiva';
  }

  // Obtener terminología esencial de la knowledge base
  getEssentialTerminologyForSpecialty(specialty) {
    if (this.knowledgeBase && this.knowledgeBase.terminology && this.knowledgeBase.terminology[specialty]) {
      const terminology = this.knowledgeBase.terminology[specialty];
      // Seleccionar términos más relevantes para mantener prompt conciso
      const essentialTerms = terminology.slice(0, 6);
      return essentialTerms.map(term => `- ${term.term}: ${term.definition}`).join('\n');
    }
    
    // Fallback
    return '- ROM: Rango de movimiento articular\n- Test de Lasègue: Prueba neurológica ciática\n- Control motor: Coordinación del movimiento\n- Puntos gatillo: Nódulos miofasciales\n- Dolor mecánico: Empeora con actividad\n- Dolor inflamatorio: Rigidez matutina';
  }

  // Métricas para logging
  getRedFlagsCount(specialty) {
    if (this.knowledgeBase && this.knowledgeBase.redFlags && this.knowledgeBase.redFlags[specialty]) {
      return this.knowledgeBase.redFlags[specialty].length;
    }
    return 0;
  }

  getTerminologyCount(specialty) {
    if (this.knowledgeBase && this.knowledgeBase.terminology && this.knowledgeBase.terminology[specialty]) {
      return this.knowledgeBase.terminology[specialty].length;
    }
    return 0;
  }

  // Versión optimizada para chunking
  generateChunkPrompt(chunkText, specialty, sessionType, chunkNumber, totalChunks) {
    const redFlags = this.getRedFlagsForSpecialty(specialty);
    
    const optimizedChunkPrompt = `Analiza fragmento ${chunkNumber}/${totalChunks} de transcripción médica como FISIOTERAPEUTA (${specialty}).

FRAGMENTO:
"""
${chunkText}
"""

ANÁLISIS PARCIAL - Solo analiza lo presente en este fragmento:
- Banderas rojas inmediatas para derivación urgente
- Contraindicaciones para terapia manual
- Sugerencias fisioterapéuticas específicas para este segmento
- No asumas información de otros fragmentos

BANDERAS ROJAS CRÍTICAS:
${redFlags}

JSON REQUERIDO:
{
  "warnings": [{"severity": "HIGH|MEDIUM|LOW", "category": "red_flag|contraindication|referral", "title": "Título fisioterapéutico", "description": "Descripción clínica", "action": "Acción específica"}],
  "suggestions": [{"type": "assessment|treatment|referral", "title": "Sugerencia fisioterapéutica", "description": "Descripción práctica", "priority": "HIGH|MEDIUM|LOW"}],
  "fragment_analysis": {
    "fragment": "${chunkNumber}/${totalChunks}",
    "quality_score": 85,
    "completeness": "partial|complete"
  }
}`;

    logger.info('🚀 CHUNK FISIOTERAPÉUTICO V2:', {
      chunkNumber,
      totalChunks,
      chunkLength: chunkText.length,
      promptLength: optimizedChunkPrompt.length,
      specialty,
      timestamp: new Date().toISOString()
    });

    return optimizedChunkPrompt;
  }

  // MÉTODOS LEGACY MANTENIDOS PARA COMPATIBILIDAD
  getBasePrompt() {
    return 'Asistente clínico AiDuxCare - análisis fisioterapéutico especializado';
  }

  getSpecialtyPrompt(specialty) {
    return `Especialidad: ${specialty}`;
  }

  getSessionTypePrompt(sessionType) {
    return `Tipo de sesión: ${sessionType}`;
  }

  getKnowledgePrompt(specialty) {
    if (this.knowledgeBase && this.knowledgeBase.rules && this.knowledgeBase.rules[specialty]) {
      const rules = this.knowledgeBase.rules[specialty];
      return `Reglas clínicas ${specialty}: ${rules.slice(0, 3).join(', ')}`;
    }
    return `Conocimiento clínico: ${specialty}`;
  }

  getChunkSpecificPrompt(chunkNumber, totalChunks) {
    return `Fragmento ${chunkNumber}/${totalChunks}`;
  }

  getOutputFormatPrompt() {
    return 'Formato: JSON estructurado fisioterapéutico';
  }
}

module.exports = PromptFactory; 