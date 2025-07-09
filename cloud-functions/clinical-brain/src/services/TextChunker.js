const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

class TextChunker {
  constructor() {
    this.maxChunkLength = 12000; // Caracteres máximos por chunk (conservador)
    this.overlapLength = 500;    // Overlap entre chunks para contexto
    this.maxTotalLength = 50000; // Límite total de transcripción
  }

  shouldChunk(transcription) {
    const shouldChunk = transcription.length > this.maxChunkLength;
    
    logger.info('🔍 EVALUANDO NECESIDAD DE CHUNKING', {
      transcriptionLength: transcription.length,
      maxChunkLength: this.maxChunkLength,
      shouldChunk,
      timestamp: new Date().toISOString()
    });

    return shouldChunk;
  }

  chunkTranscription(transcription) {
    if (transcription.length <= this.maxChunkLength) {
      logger.info('✅ No se requiere chunking');
      return [transcription];
    }

    if (transcription.length > this.maxTotalLength) {
      logger.warn('⚠️ Transcripción excede límite máximo, truncando', {
        originalLength: transcription.length,
        maxLength: this.maxTotalLength
      });
      transcription = transcription.substring(0, this.maxTotalLength);
    }

    const chunks = [];
    let currentPosition = 0;

    while (currentPosition < transcription.length) {
      const chunkEnd = Math.min(
        currentPosition + this.maxChunkLength,
        transcription.length
      );

      // Intentar cortar en punto natural (final de oración)
      let cutPosition = chunkEnd;
      if (chunkEnd < transcription.length) {
        const lastPeriod = transcription.lastIndexOf('.', chunkEnd);
        const lastExclamation = transcription.lastIndexOf('!', chunkEnd);
        const lastQuestion = transcription.lastIndexOf('?', chunkEnd);
        
        const bestCut = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (bestCut > currentPosition + (this.maxChunkLength * 0.7)) {
          cutPosition = bestCut + 1;
        }
      }

      const chunk = transcription.substring(currentPosition, cutPosition);
      chunks.push(chunk.trim());

      logger.info(`📄 Chunk ${chunks.length} creado`, {
        chunkLength: chunk.length,
        startPosition: currentPosition,
        endPosition: cutPosition
      });

      // Mover posición con overlap para mantener contexto
      currentPosition = cutPosition - this.overlapLength;
      if (currentPosition >= transcription.length) break;
    }

    logger.info('✅ CHUNKING COMPLETADO', {
      originalLength: transcription.length,
      chunksCreated: chunks.length,
      averageChunkLength: Math.round(chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length),
      timestamp: new Date().toISOString()
    });

    return chunks;
  }

  async processChunks(chunks, promptFactory, vertexClient, specialty, sessionType) {
    logger.info('🔄 PROCESANDO CHUNKS INDIVIDUALES', {
      totalChunks: chunks.length,
      specialty,
      sessionType
    });

    const chunkResults = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      logger.info(`🤖 Procesando chunk ${i + 1}/${chunks.length}`, {
        chunkLength: chunk.length,
        chunkPreview: chunk.substring(0, 100) + '...'
      });

      try {
        // Generar prompt para este chunk específico
        const chunkPrompt = promptFactory.generateChunkPrompt(chunk, specialty, sessionType, i + 1, chunks.length);
        
        // Analizar chunk con Vertex AI
        const rawResponse = await vertexClient.analyze(chunkPrompt);
        
        // Parsear respuesta del chunk
        const responseParser = new (require('./ResponseParser'))({});
        const chunkResult = responseParser.parse(rawResponse, specialty);
        
        chunkResults.push({
          chunkIndex: i,
          chunkLength: chunk.length,
          result: chunkResult
        });

        logger.info(`✅ Chunk ${i + 1} procesado exitosamente`, {
          warningsFound: chunkResult.warnings?.length || 0,
          suggestionsFound: chunkResult.suggestions?.length || 0
        });

      } catch (error) {
        logger.error(`❌ Error procesando chunk ${i + 1}`, {
          error: error.message,
          chunkLength: chunk.length
        });

        // Continuar con otros chunks aunque uno falle
        chunkResults.push({
          chunkIndex: i,
          chunkLength: chunk.length,
          error: error.message,
          result: null
        });
      }
    }

    return chunkResults;
  }

  consolidateResults(chunkResults, originalTranscription) {
    logger.info('🔗 CONSOLIDANDO RESULTADOS DE CHUNKS', {
      totalChunks: chunkResults.length,
      successfulChunks: chunkResults.filter(r => r.result).length,
      failedChunks: chunkResults.filter(r => r.error).length
    });

    const consolidatedResult = {
      warnings: [],
      suggestions: [],
      soap_analysis: {
        subjective_completeness: 0,
        objective_completeness: 0,
        assessment_quality: 0,
        plan_appropriateness: 0,
        overall_quality: 0,
        missing_elements: []
      },
      session_quality: {
        communication_score: 0,
        clinical_thoroughness: 0,
        patient_engagement: 0,
        professional_standards: 0,
        areas_for_improvement: []
      },
      specialty_metrics: {
        specialty: '',
        clinical_accuracy_score: 0,
        safety_compliance_score: 0,
        completeness_score: 0
      }
    };

    const validResults = chunkResults.filter(r => r.result && !r.error);
    
    if (validResults.length === 0) {
      logger.error('❌ No hay resultados válidos para consolidar');
      return this.createEmptyResult();
    }

    // Consolidar warnings (eliminar duplicados)
    const allWarnings = [];
    validResults.forEach(chunk => {
      if (chunk.result.warnings) {
        chunk.result.warnings.forEach(warning => {
          const isDuplicate = allWarnings.some(w => 
            w.title === warning.title || w.description === warning.description
          );
          if (!isDuplicate) {
            allWarnings.push({
              ...warning,
              id: `consolidated_warning_${allWarnings.length + 1}`,
              source_chunks: [chunk.chunkIndex]
            });
          }
        });
      }
    });

    // Consolidar suggestions (eliminar duplicados)
    const allSuggestions = [];
    validResults.forEach(chunk => {
      if (chunk.result.suggestions) {
        chunk.result.suggestions.forEach(suggestion => {
          const isDuplicate = allSuggestions.some(s => 
            s.title === suggestion.title || s.description === suggestion.description
          );
          if (!isDuplicate) {
            allSuggestions.push({
              ...suggestion,
              id: `consolidated_suggestion_${allSuggestions.length + 1}`,
              source_chunks: [chunk.chunkIndex]
            });
          }
        });
      }
    });

    // Promediar métricas SOAP
    const soapMetrics = ['subjective_completeness', 'objective_completeness', 'assessment_quality', 'plan_appropriateness'];
    soapMetrics.forEach(metric => {
      const values = validResults
        .map(r => r.result.soap_analysis[metric])
        .filter(v => typeof v === 'number');
      
      consolidatedResult.soap_analysis[metric] = values.length > 0 
        ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
        : 0;
    });

    // Calcular overall quality
    consolidatedResult.soap_analysis.overall_quality = Math.round(
      (consolidatedResult.soap_analysis.subjective_completeness +
       consolidatedResult.soap_analysis.objective_completeness +
       consolidatedResult.soap_analysis.assessment_quality +
       consolidatedResult.soap_analysis.plan_appropriateness) / 4
    );

    // Consolidar missing elements
    const allMissingElements = [];
    validResults.forEach(chunk => {
      if (chunk.result.soap_analysis.missing_elements) {
        chunk.result.soap_analysis.missing_elements.forEach(element => {
          if (!allMissingElements.includes(element)) {
            allMissingElements.push(element);
          }
        });
      }
    });

    // Promediar métricas de calidad de sesión
    const qualityMetrics = ['communication_score', 'clinical_thoroughness', 'patient_engagement', 'professional_standards'];
    qualityMetrics.forEach(metric => {
      const values = validResults
        .map(r => r.result.session_quality[metric])
        .filter(v => typeof v === 'number');
      
      consolidatedResult.session_quality[metric] = values.length > 0 
        ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
        : 0;
    });

    // Consolidar areas for improvement
    const allImprovements = [];
    validResults.forEach(chunk => {
      if (chunk.result.session_quality.areas_for_improvement) {
        chunk.result.session_quality.areas_for_improvement.forEach(area => {
          if (!allImprovements.includes(area)) {
            allImprovements.push(area);
          }
        });
      }
    });

    // Asignar resultados consolidados
    consolidatedResult.warnings = allWarnings.slice(0, 10); // Limitar a 10 warnings más importantes
    consolidatedResult.suggestions = allSuggestions.slice(0, 8); // Limitar a 8 sugerencias más relevantes
    consolidatedResult.soap_analysis.missing_elements = allMissingElements;
    consolidatedResult.session_quality.areas_for_improvement = allImprovements;

    // Establecer specialty desde el primer resultado válido
    if (validResults[0].result.specialty_metrics) {
      consolidatedResult.specialty_metrics.specialty = validResults[0].result.specialty_metrics.specialty;
    }

    logger.info('✅ CONSOLIDACIÓN COMPLETADA', {
      finalWarnings: consolidatedResult.warnings.length,
      finalSuggestions: consolidatedResult.suggestions.length,
      overallQuality: consolidatedResult.soap_analysis.overall_quality,
      chunksProcessed: validResults.length,
      timestamp: new Date().toISOString()
    });

    return consolidatedResult;
  }

  createEmptyResult() {
    return {
      warnings: [{
        id: 'chunking_error_001',
        severity: 'HIGH',
        category: 'clinical_alert',
        title: 'Error en Procesamiento de Transcripción',
        description: 'No se pudo procesar la transcripción debido a su longitud o complejidad',
        recommendation: 'Revisar transcripción manualmente o dividir en secciones más pequeñas',
        evidence: 'Error en chunking automático'
      }],
      suggestions: [],
      soap_analysis: {
        subjective_completeness: 0,
        objective_completeness: 0,
        assessment_quality: 0,
        plan_appropriateness: 0,
        overall_quality: 0,
        missing_elements: ['Procesamiento automático fallido']
      },
      session_quality: {
        communication_score: 0,
        clinical_thoroughness: 0,
        patient_engagement: 0,
        professional_standards: 0,
        areas_for_improvement: ['Procesamiento automático fallido']
      },
      specialty_metrics: {
        specialty: 'unknown',
        clinical_accuracy_score: 0,
        safety_compliance_score: 0,
        completeness_score: 0
      }
    };
  }
}

module.exports = TextChunker; 