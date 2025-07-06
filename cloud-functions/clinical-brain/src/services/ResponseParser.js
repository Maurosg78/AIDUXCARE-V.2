const Joi = require('joi');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

class ResponseParser {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.schema = this.createValidationSchema();
  }

  createValidationSchema() {
    return Joi.object({
      warnings: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          severity: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
          category: Joi.string().valid('contraindication', 'red_flag', 'safety_concern', 'clinical_alert').required(),
          title: Joi.string().required(),
          description: Joi.string().required(),
          recommendation: Joi.string().required(),
          evidence: Joi.string().required()
        })
      ).required(),
      
      suggestions: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          type: Joi.string().valid('assessment_question', 'treatment_modification', 'additional_evaluation', 'patient_education').required(),
          title: Joi.string().required(),
          description: Joi.string().required(),
          rationale: Joi.string().required(),
          priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required()
        })
      ).required(),
      
      soap_analysis: Joi.object({
        subjective_completeness: Joi.number().min(0).max(100).required(),
        objective_completeness: Joi.number().min(0).max(100).required(),
        assessment_quality: Joi.number().min(0).max(100).required(),
        plan_appropriateness: Joi.number().min(0).max(100).required(),
        overall_quality: Joi.number().min(0).max(100).required(),
        missing_elements: Joi.array().items(Joi.string()).required()
      }).required(),
      
      session_quality: Joi.object({
        communication_score: Joi.number().min(0).max(100).required(),
        clinical_thoroughness: Joi.number().min(0).max(100).required(),
        patient_engagement: Joi.number().min(0).max(100).required(),
        professional_standards: Joi.number().min(0).max(100).required(),
        areas_for_improvement: Joi.array().items(Joi.string()).required()
      }).required()
    });
  }

  parse(rawResponse, specialty) {
    const startTime = Date.now();
    
    try {
      logger.info('Starting response parsing', {
        specialty,
        responseLength: rawResponse.length,
        timestamp: new Date().toISOString()
      });

      // Intentar parsear JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (jsonError) {
        logger.error('Failed to parse JSON response', {
          error: jsonError.message,
          responsePreview: rawResponse.substring(0, 200)
        });
        
        // Intentar limpiar y reparar el JSON
        parsedResponse = this.repairJson(rawResponse);
      }

      // Validar estructura con Joi
      const { error, value } = this.schema.validate(parsedResponse, {
        abortEarly: false,
        allowUnknown: false
      });

      if (error) {
        logger.warn('Response validation failed, attempting to repair', {
          validationErrors: error.details.map(detail => ({
            path: detail.path,
            message: detail.message
          }))
        });
        
        // Intentar reparar la respuesta
        parsedResponse = this.repairResponse(parsedResponse, error.details);
        
        // Validar nuevamente
        const { error: repairError, value: repairedValue } = this.schema.validate(parsedResponse, {
          abortEarly: false,
          allowUnknown: false
        });
        
        if (repairError) {
          logger.error('Failed to repair response', {
            repairErrors: repairError.details.map(detail => ({
              path: detail.path,
              message: detail.message
            }))
          });
          throw new Error('Response validation failed after repair attempt');
        }
        
        parsedResponse = repairedValue;
      } else {
        parsedResponse = value;
      }

      // Aplicar enriquecimiento específico por especialidad
      const enrichedResponse = this.enrichResponse(parsedResponse, specialty);

      // Aplicar filtros de calidad
      const filteredResponse = this.applyQualityFilters(enrichedResponse);

      const processingTime = Date.now() - startTime;

      logger.info('Response parsing completed', {
        specialty,
        processingTimeMs: processingTime,
        warningsCount: filteredResponse.warnings.length,
        suggestionsCount: filteredResponse.suggestions.length,
        overallQuality: filteredResponse.soap_analysis.overall_quality,
        timestamp: new Date().toISOString()
      });

      return filteredResponse;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Response parsing failed', {
        error: error.message,
        stack: error.stack,
        specialty,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      });

      // Devolver respuesta de fallback
      return this.createFallbackResponse(specialty, error.message);
    }
  }

  repairJson(rawResponse) {
    try {
      // Intentar extraer JSON válido de la respuesta
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[0];
        return JSON.parse(extractedJson);
      }
      
      // Si no se puede extraer, crear estructura básica
      throw new Error('No valid JSON found in response');
      
    } catch (error) {
      logger.error('JSON repair failed', { error: error.message });
      throw new Error('Unable to repair malformed JSON response');
    }
  }

  repairResponse(response, validationErrors) {
    const repairedResponse = { ...response };

    // Reparar campos faltantes o inválidos
    validationErrors.forEach(error => {
      const path = error.path.join('.');
      
      switch (path) {
        case 'warnings':
          if (!repairedResponse.warnings || !Array.isArray(repairedResponse.warnings)) {
            repairedResponse.warnings = [];
          }
          break;
          
        case 'suggestions':
          if (!repairedResponse.suggestions || !Array.isArray(repairedResponse.suggestions)) {
            repairedResponse.suggestions = [];
          }
          break;
          
        case 'soap_analysis':
          if (!repairedResponse.soap_analysis) {
            repairedResponse.soap_analysis = {
              subjective_completeness: 50,
              objective_completeness: 50,
              assessment_quality: 50,
              plan_appropriateness: 50,
              overall_quality: 50,
              missing_elements: ['Unable to analyze - parsing error']
            };
          }
          break;
          
        case 'session_quality':
          if (!repairedResponse.session_quality) {
            repairedResponse.session_quality = {
              communication_score: 50,
              clinical_thoroughness: 50,
              patient_engagement: 50,
              professional_standards: 50,
              areas_for_improvement: ['Unable to analyze - parsing error']
            };
          }
          break;
      }
    });

    return repairedResponse;
  }

  enrichResponse(response, specialty) {
    const enrichedResponse = { ...response };

    // Enriquecer advertencias con contexto específico
    enrichedResponse.warnings = response.warnings.map(warning => ({
      ...warning,
      specialty,
      timestamp: new Date().toISOString(),
      confidence: this.calculateConfidence(warning, specialty)
    }));

    // Enriquecer sugerencias con priorización inteligente
    enrichedResponse.suggestions = response.suggestions.map(suggestion => ({
      ...suggestion,
      specialty,
      timestamp: new Date().toISOString(),
      relevance_score: this.calculateRelevance(suggestion, specialty)
    }));

    // Añadir métricas de calidad específicas por especialidad
    enrichedResponse.specialty_metrics = this.calculateSpecialtyMetrics(response, specialty);

    return enrichedResponse;
  }

  applyQualityFilters(response) {
    const filteredResponse = { ...response };

    // Filtrar advertencias de baja confianza
    filteredResponse.warnings = response.warnings.filter(warning => 
      warning.confidence >= 0.7 || warning.severity === 'HIGH'
    );

    // Ordenar sugerencias por relevancia
    filteredResponse.suggestions = response.suggestions
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10); // Limitar a top 10 sugerencias

    return filteredResponse;
  }

  calculateConfidence(warning, specialty) {
    // Lógica básica de confianza basada en categoría y especialidad
    const baseConfidence = {
      'contraindication': 0.9,
      'red_flag': 0.85,
      'safety_concern': 0.8,
      'clinical_alert': 0.75
    };

    let confidence = baseConfidence[warning.category] || 0.7;

    // Ajustar por especialidad
    if (this.knowledgeBase && this.knowledgeBase.rules && this.knowledgeBase.rules[specialty]) {
      const specialtyRules = this.knowledgeBase.rules[specialty];
      const isSpecialtyRelevant = specialtyRules.some(rule => 
        warning.description.toLowerCase().includes(rule.toLowerCase())
      );
      
      if (isSpecialtyRelevant) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  calculateRelevance(suggestion, specialty) {
    // Lógica básica de relevancia
    const baseRelevance = {
      'assessment_question': 0.8,
      'treatment_modification': 0.9,
      'additional_evaluation': 0.7,
      'patient_education': 0.6
    };

    let relevance = baseRelevance[suggestion.type] || 0.5;

    // Ajustar por prioridad
    const priorityMultiplier = {
      'HIGH': 1.2,
      'MEDIUM': 1.0,
      'LOW': 0.8
    };

    relevance *= priorityMultiplier[suggestion.priority] || 1.0;

    return Math.min(relevance, 1.0);
  }

  calculateSpecialtyMetrics(response, specialty) {
    const metrics = {
      specialty,
      clinical_accuracy_score: this.calculateClinicalAccuracy(response),
      safety_compliance_score: this.calculateSafetyCompliance(response),
      completeness_score: this.calculateCompleteness(response)
    };

    return metrics;
  }

  calculateClinicalAccuracy(response) {
    // Promedio ponderado de scores SOAP
    const soapScores = response.soap_analysis;
    const weights = {
      subjective_completeness: 0.2,
      objective_completeness: 0.3,
      assessment_quality: 0.3,
      plan_appropriateness: 0.2
    };

    let weightedSum = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      weightedSum += (soapScores[key] || 0) * weight;
    });

    return Math.round(weightedSum);
  }

  calculateSafetyCompliance(response) {
    // Basado en la presencia y calidad de advertencias de seguridad
    const highSeverityWarnings = response.warnings.filter(w => w.severity === 'HIGH').length;
    const totalWarnings = response.warnings.length;
    
    if (totalWarnings === 0) return 100; // No hay problemas de seguridad
    
    const safetyScore = Math.max(0, 100 - (highSeverityWarnings * 10));
    return Math.round(safetyScore);
  }

  calculateCompleteness(response) {
    // Basado en la completitud de la evaluación SOAP
    const soapScores = response.soap_analysis;
    const averageCompleteness = (
      soapScores.subjective_completeness +
      soapScores.objective_completeness +
      soapScores.assessment_quality +
      soapScores.plan_appropriateness
    ) / 4;

    return Math.round(averageCompleteness);
  }

  createFallbackResponse(specialty, errorMessage) {
    logger.warn('Creating fallback response due to parsing failure', {
      specialty,
      error: errorMessage
    });

    return {
      warnings: [{
        id: 'fallback_warning_001',
        severity: 'MEDIUM',
        category: 'clinical_alert',
        title: 'Análisis Clínico Incompleto',
        description: 'No se pudo completar el análisis clínico automatizado de esta transcripción.',
        recommendation: 'Revisar manualmente la transcripción para identificar posibles problemas clínicos.',
        evidence: 'Error en el procesamiento automático',
        specialty,
        timestamp: new Date().toISOString(),
        confidence: 0.5
      }],
      suggestions: [{
        id: 'fallback_suggestion_001',
        type: 'additional_evaluation',
        title: 'Revisión Manual Requerida',
        description: 'Se recomienda una revisión manual de la transcripción debido a limitaciones en el análisis automatizado.',
        rationale: 'El sistema no pudo procesar completamente la información clínica.',
        priority: 'MEDIUM',
        specialty,
        timestamp: new Date().toISOString(),
        relevance_score: 0.8
      }],
      soap_analysis: {
        subjective_completeness: 0,
        objective_completeness: 0,
        assessment_quality: 0,
        plan_appropriateness: 0,
        overall_quality: 0,
        missing_elements: ['Análisis automático fallido']
      },
      session_quality: {
        communication_score: 0,
        clinical_thoroughness: 0,
        patient_engagement: 0,
        professional_standards: 0,
        areas_for_improvement: ['Análisis automático fallido']
      },
      specialty_metrics: {
        specialty,
        clinical_accuracy_score: 0,
        safety_compliance_score: 0,
        completeness_score: 0
      }
    };
  }
}

module.exports = ResponseParser; 