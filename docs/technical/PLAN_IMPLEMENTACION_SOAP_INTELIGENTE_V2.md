# 🚀 PLAN DE IMPLEMENTACIÓN: Clasificador SOAP Inteligente V2.0
## Sistema de Asistencia Clínica Resiliente y Validable

**Fecha:** Enero 2025  
**Versión:** 2.0 (Integra recomendaciones del consultor experto)  
**Autor:** Equipo Técnico AiDuxCare  
**Objetivo:** Sistema SOAP con Human-in-the-loop, fallback y autoevaluación

---

## 🎯 MISIÓN ACTUALIZADA

**Objetivo Original:** Implementar clasificación SOAP con Gemini 1.5 Pro  
**Objetivo Actualizado:** Crear sistema de asistencia clínica resiliente, validable y preparado para futuro

### **Requisitos Críticos Integrados:**
1. ✅ **Modo Auditoría (Human-in-the-loop)** - Control total del profesional
2. ✅ **Estrategia de Fallback** - Resiliencia ante fallos de API
3. ✅ **Módulo de Autoevaluación (EVALs)** - Métricas objetivas de rendimiento
4. ✅ **Arquitectura Multi-disciplina** - Escalabilidad y prompt modular

---

## 📋 CRONOGRAMA ACTUALIZADO (8 SEMANAS)

### **SPRINT 1 (Semana 1-2): Configuración Base + Prompt Modular**

#### **Objetivos del Sprint:**
- Configurar Gemini 1.5 Pro con arquitectura modular
- Implementar prompt JSON modular consciente de especialidad
- Crear interfaces TypeScript para modo auditoría

#### **Tareas Técnicas:**

**Backend - Prompt Modular JSON:**
```typescript
// NUEVO: Prompt modular en formato JSON estructurado
interface PromptModular {
  system: {
    role: string;
    version: string;
    specialty_context: string;
  };
  context: {
    specialty: 'FISIOTERAPIA' | 'PSICOLOGIA' | 'MEDICINA_GENERAL';
    professional_profile: string;
    clinical_guidelines: string[];
  };
  input: {
    transcription: string;
    clinical_entities: ClinicalEntity[];
    speaker_segments: SpeakerSegment[];
  };
  output_schema: {
    classified_segments: ClassifiedSegmentSchema[];
    soap_summary: SOAPSummarySchema;
    quality_metrics: QualityMetricsSchema;
    confidence_breakdown: ConfidenceBreakdownSchema; // NUEVO
  };
}

const buildModularPrompt = (specialty: string, data: InputData): PromptModular => {
  return {
    system: {
      role: "Experto en documentación clínica médica especializado en análisis SOAP",
      version: "2.0_with_audit_mode",
      specialty_context: getSpecialtyContext(specialty)
    },
    context: {
      specialty: specialty as SpecialtyType,
      professional_profile: getSpecialtyProfile(specialty),
      clinical_guidelines: getSpecialtyGuidelines(specialty)
    },
    input: data,
    output_schema: getSOAPOutputSchema()
  };
};
```

**Backend - Configuración Especializada por Disciplina:**
```typescript
const getSpecialtyContext = (specialty: string): string => {
  const contexts = {
    FISIOTERAPIA: `
Especialidad: Fisioterapia y Rehabilitación
Enfoque: Evaluación funcional, rango de movimiento, dolor musculoesquelético
Terminología clave: contractura, movilización, fortalecimiento, biomecánica
Criterios SOAP específicos:
- S: Dolor, limitaciones funcionales reportadas por paciente
- O: Evaluaciones posturales, pruebas de movimiento, palpación
- A: Análisis biomecánico, diagnósticos funcionales
- P: Ejercicios terapéuticos, técnicas manuales, seguimiento`,
    
    PSICOLOGIA: `
Especialidad: Psicología Clínica
Enfoque: Estado mental, comportamiento, diagnósticos DSM-5
Terminología clave: ansiedad, depresión, cognición, comportamiento
Criterios SOAP específicos:
- S: Síntomas emocionales, pensamientos, comportamientos reportados
- O: Observaciones del estado mental, apariencia, comportamiento
- A: Impresión diagnóstica, evaluación de riesgo
- P: Intervenciones psicoterapéuticas, seguimiento psicológico`,
    
    MEDICINA_GENERAL: `
Especialidad: Medicina General
Enfoque: Evaluación sistémica, diagnósticos médicos, tratamientos
Terminología clave: síntomas, signos vitales, diagnóstico, medicación
Criterios SOAP específicos:
- S: Historia clínica, síntomas reportados por paciente
- O: Examen físico, signos vitales, pruebas diagnósticas
- A: Diagnóstico diferencial, impresión clínica
- P: Tratamiento médico, medicamentos, seguimiento`
  };
  
  return contexts[specialty] || contexts.MEDICINA_GENERAL;
};
```

**Interfaces para Modo Auditoría:**
```typescript
interface ClassifiedSegmentWithAudit extends ClassifiedSegment {
  confidence: number; // 0.0 - 1.0
  confidence_breakdown: {
    speaker_recognition: number;
    clinical_relevance: number;
    soap_classification: number;
    entity_integration: number;
  };
  audit_metadata: {
    requires_review: boolean;
    uncertainty_factors: string[];
    alternative_classifications: {
      section: 'S' | 'O' | 'A' | 'P';
      confidence: number;
      reasoning: string;
    }[];
  };
}

interface AuditAction {
  action_type: 'RECLASSIFY' | 'REPORT_ERROR' | 'APPROVE' | 'REJECT';
  original_section: 'S' | 'O' | 'A' | 'P';
  new_section?: 'S' | 'O' | 'A' | 'P';
  professional_feedback: string;
  timestamp: string;
  confidence_override?: number;
}
```

**Entregables Sprint 1:**
- [ ] Prompt JSON modular implementado
- [ ] Configuración especializada por disciplina
- [ ] Interfaces TypeScript para auditoría
- [ ] Testing básico del prompt modular

---

### **SPRINT 2 (Semana 3-4): Backend Resiliente + Fallback**

#### **Objetivos del Sprint:**
- Implementar clasificación SOAP con fallback robusto
- Sistema de guardado garantizado de transcripciones
- Manejo de errores y recuperación automática

#### **Tareas Técnicas:**

**Sistema de Fallback Robusto:**
```typescript
class AdvancedTextProcessingService {
  
  /**
   * MÉTODO PRINCIPAL con fallback automático
   */
  async processTextToAdvancedSOAP(
    transcription: string,
    clinicalEntities: ClinicalEntity[],
    speakerSegments: SpeakerSegment[],
    specialty: string = 'FISIOTERAPIA'
  ): Promise<SOAPProcessingResult> {
    
    const sessionId = uuidv4();
    const startTime = Date.now();
    
    // 1. GARANTIZAR guardado de transcripción cruda (compliance legal)
    await this.saveRawTranscription(sessionId, transcription, speakerSegments);
    
    try {
      // 2. INTENTAR clasificación inteligente con Gemini
      console.log('🚀 Intentando clasificación SOAP inteligente...');
      const advancedResult = await this.attemptGeminiClassification(
        transcription, 
        clinicalEntities, 
        speakerSegments,
        specialty
      );
      
      console.log('✅ Clasificación inteligente exitosa');
      return {
        ...advancedResult,
        processing_method: 'GEMINI_ADVANCED',
        fallback_used: false,
        session_id: sessionId
      };
      
    } catch (geminiError) {
      // 3. FALLBACK automático a heurísticas
      console.warn('⚠️ Gemini falló, activando fallback:', geminiError.message);
      
      const fallbackResult = await this.fallbackToHeuristics(
        transcription, 
        clinicalEntities,
        specialty
      );
      
      // 4. REGISTRAR el fallback para monitoreo
      await this.logFallbackEvent(sessionId, geminiError, fallbackResult);
      
      console.log('✅ Fallback completado exitosamente');
      return {
        ...fallbackResult,
        processing_method: 'HEURISTIC_FALLBACK',
        fallback_used: true,
        fallback_reason: geminiError.message,
        session_id: sessionId
      };
    }
  }

  /**
   * GUARDADO GARANTIZADO de transcripción (compliance)
   */
  private async saveRawTranscription(
    sessionId: string, 
    transcription: string, 
    speakerSegments: SpeakerSegment[]
  ): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection('transcriptions_raw').doc(sessionId).set({
        transcription,
        speaker_segments: speakerSegments,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        compliance_status: 'SAVED',
        processing_status: 'PENDING'
      });
      
      console.log('💾 Transcripción cruda guardada para compliance');
    } catch (error) {
      // CRÍTICO: Si no podemos guardar, el sistema debe fallar
      throw new Error(`CRITICAL: No se pudo guardar transcripción para compliance: ${error.message}`);
    }
  }

  /**
   * CLASIFICACIÓN con Gemini 1.5 Pro
   */
  private async attemptGeminiClassification(
    transcription: string,
    clinicalEntities: ClinicalEntity[],
    speakerSegments: SpeakerSegment[],
    specialty: string
  ): Promise<AdvancedSOAPResult> {
    
    // Construir prompt modular
    const modularPrompt = this.buildModularPrompt(specialty, {
      transcription,
      clinical_entities: clinicalEntities,
      speaker_segments: speakerSegments
    });
    
    // Llamada a Gemini con timeout y reintentos
    const response = await this.callGeminiWithRetry(modularPrompt, 3);
    
    // Parsear y validar respuesta
    const classifiedResult = this.parseGeminiResponse(response);
    
    // Validar calidad mínima
    if (classifiedResult.quality_metrics.confidence_average < 0.5) {
      throw new Error('Calidad de clasificación Gemini por debajo del umbral mínimo');
    }
    
    return classifiedResult;
  }

  /**
   * FALLBACK a heurísticas (sistema anterior)
   */
  private async fallbackToHeuristics(
    transcription: string,
    clinicalEntities: ClinicalEntity[],
    specialty: string
  ): Promise<AdvancedSOAPResult> {
    
    console.log('🔄 Ejecutando clasificación heurística...');
    
    // Usar sistema anterior como fallback
    const heuristicResult = await this.generateAdvancedSOAPStructure(
      transcription, 
      clinicalEntities
    );
    
    // Convertir resultado heurístico a formato avanzado
    const fallbackSegments = this.convertHeuristicToSegments(
      transcription, 
      heuristicResult.soapStructure
    );
    
    return {
      classifiedSegments: fallbackSegments,
      soapSummary: heuristicResult.soapStructure,
      qualityMetrics: {
        total_segments_classified: fallbackSegments.length,
        confidence_average: 0.6, // Confianza moderada para heurísticas
        entities_utilized: clinicalEntities.length,
        classification_completeness: 0.8
      },
      processingTime: Date.now() - Date.now()
    };
  }

  /**
   * REGISTRO de eventos de fallback para monitoreo
   */
  private async logFallbackEvent(
    sessionId: string,
    error: Error,
    fallbackResult: AdvancedSOAPResult
  ): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection('fallback_events').doc(sessionId).set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error_message: error.message,
        error_stack: error.stack,
        fallback_quality: fallbackResult.qualityMetrics,
        requires_investigation: fallbackResult.qualityMetrics.confidence_average < 0.7
      });
    } catch (logError) {
      console.error('❌ Error registrando evento de fallback:', logError);
      // No fallar por error de logging
    }
  }
}
```

**Entregables Sprint 2:**
- [ ] Sistema de fallback robusto implementado
- [ ] Guardado garantizado de transcripciones
- [ ] Logging de eventos de fallback
- [ ] Testing de recuperación ante errores

---

### **SPRINT 3 (Semana 5-6): Frontend Modo Auditoría**

#### **Objetivos del Sprint:**
- Implementar interfaz de auditoría en DynamicSOAPEditor
- Visualización de confianza y reclasificación manual
- Sistema de feedback del profesional

#### **Tareas Técnicas:**

**DynamicSOAPEditor con Modo Auditoría:**
```typescript
interface DynamicSOAPEditorProps {
  classifiedSegments: ClassifiedSegmentWithAudit[];
  auditMode: boolean; // NUEVO: modo auditoría activado
  onAuditAction: (action: AuditAction) => Promise<void>; // NUEVO: callback auditoría
  onFeedbackReport: (feedback: ProfessionalFeedback) => Promise<void>; // NUEVO
}

const DynamicSOAPEditor: React.FC<DynamicSOAPEditorProps> = ({
  classifiedSegments,
  auditMode = true,
  onAuditAction,
  onFeedbackReport,
  // ... resto de props
}) => {
  
  const [auditState, setAuditState] = useState<AuditState>({
    segmentsUnderReview: [],
    pendingActions: [],
    professionalOverrides: {}
  });

  /**
   * NUEVO: Renderizar segmento con controles de auditoría
   */
  const renderAuditableSegment = (segment: ClassifiedSegmentWithAudit) => {
    const confidenceLevel = segment.confidence > 0.8 ? 'high' : 
                           segment.confidence > 0.6 ? 'medium' : 'low';
    
    return (
      <div className={`audit-segment ${confidenceLevel}-confidence`}>
        {/* Contenido del segmento */}
        <div className="flex justify-between items-start p-3 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">[{segment.speaker}]</span>
              <span className="text-sm">{segment.original_text}</span>
              
              {/* NUEVO: Indicador visual de confianza */}
              <ConfidenceIndicator 
                confidence={segment.confidence}
                breakdown={segment.confidence_breakdown}
              />
            </div>
            
            <div className="text-xs text-gray-600 mb-2">
              {segment.reasoning}
            </div>

            {/* NUEVO: Controles de reclasificación */}
            {auditMode && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Reclasificar a:</span>
                {['S', 'O', 'A', 'P'].map(section => (
                  <button
                    key={section}
                    onClick={() => handleReclassification(segment, section)}
                    className={`px-2 py-1 text-xs rounded ${
                      segment.soap_section === section 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {section}
                  </button>
                ))}
                
                {/* Botón reportar error */}
                <button
                  onClick={() => openErrorReportModal(segment)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  ⚠️ Reportar Error
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NUEVO: Mostrar clasificaciones alternativas si las hay */}
        {segment.audit_metadata.alternative_classifications.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-xs text-yellow-800 font-medium mb-1">
              Clasificaciones alternativas sugeridas:
            </div>
            {segment.audit_metadata.alternative_classifications.map((alt, idx) => (
              <div key={idx} className="text-xs text-yellow-700">
                {alt.section}: {alt.reasoning} (confianza: {(alt.confidence * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /**
   * NUEVO: Manejar reclasificación manual
   */
  const handleReclassification = async (
    segment: ClassifiedSegmentWithAudit, 
    newSection: 'S' | 'O' | 'A' | 'P'
  ) => {
    const auditAction: AuditAction = {
      action_type: 'RECLASSIFY',
      original_section: segment.soap_section,
      new_section: newSection,
      professional_feedback: `Reclasificado de ${segment.soap_section} a ${newSection}`,
      timestamp: new Date().toISOString()
    };

    await onAuditAction(auditAction);
    
    // Actualizar estado local
    setAuditState(prev => ({
      ...prev,
      professionalOverrides: {
        ...prev.professionalOverrides,
        [segment.segment_id]: newSection
      }
    }));
  };

  /**
   * NUEVO: Modal para reportar errores
   */
  const ErrorReportModal = ({ segment, isOpen, onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [errorType, setErrorType] = useState('');

    const submitErrorReport = async () => {
      const feedbackData: ProfessionalFeedback = {
        segment_id: segment.segment_id,
        error_type: errorType,
        feedback_text: feedback,
        original_classification: segment.soap_section,
        professional_id: getCurrentProfessionalId(),
        timestamp: new Date().toISOString()
      };

      await onFeedbackReport(feedbackData);
      onClose();
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Reportar Error de Clasificación</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tipo de error:</label>
            <select 
              value={errorType} 
              onChange={(e) => setErrorType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Seleccionar tipo de error</option>
              <option value="wrong_section">Sección SOAP incorrecta</option>
              <option value="speaker_misidentification">Hablante mal identificado</option>
              <option value="clinical_context_error">Error de contexto clínico</option>
              <option value="entity_misclassification">Entidad mal clasificada</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Descripción del error:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border rounded h-24"
              placeholder="Describa qué está mal y cómo debería ser clasificado..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
              Cancelar
            </button>
            <button onClick={submitErrorReport} className="px-4 py-2 bg-red-500 text-white rounded">
              Reportar Error
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="dynamic-soap-editor-audit">
      {/* Header con indicadores de auditoría */}
      {auditMode && (
        <div className="audit-header bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-blue-800">Modo Auditoría Activo</h4>
              <p className="text-sm text-blue-600">
                Revise las clasificaciones y reclasifique si es necesario
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-800">
                {classifiedSegments.filter(s => s.confidence > 0.8).length}/{classifiedSegments.length}
              </div>
              <div className="text-xs text-blue-600">Alta confianza</div>
            </div>
          </div>
        </div>
      )}

      {/* Secciones SOAP con segmentos auditables */}
      <div className="space-y-6">
        {soapSections.map((section) => (
          <div key={section.id} className="soap-section-audit">
            <div className="section-header">
              <h3>{section.title}</h3>
              
              {/* NUEVO: Estadísticas de confianza por sección */}
              <div className="confidence-stats">
                {section.classifiedSegments?.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Confianza promedio: {(
                      section.classifiedSegments.reduce((sum, seg) => sum + seg.confidence, 0) / 
                      section.classifiedSegments.length * 100
                    ).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>

            <div className="section-content">
              {section.classifiedSegments?.map(segment => 
                renderAuditableSegment(segment)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Componente de Indicador de Confianza:**
```typescript
const ConfidenceIndicator: React.FC<{
  confidence: number;
  breakdown: ConfidenceBreakdown;
}> = ({ confidence, breakdown }) => {
  const getConfidenceColor = (conf: number) => {
    if (conf > 0.8) return 'bg-green-500';
    if (conf > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="confidence-indicator">
      <div 
        className={`w-3 h-3 rounded-full ${getConfidenceColor(confidence)}`}
        title={`Confianza: ${(confidence * 100).toFixed(0)}%`}
      />
      
      {/* Desglose detallado en tooltip */}
      <div className="confidence-tooltip hidden">
        <div>Reconocimiento de hablante: {(breakdown.speaker_recognition * 100).toFixed(0)}%</div>
        <div>Relevancia clínica: {(breakdown.clinical_relevance * 100).toFixed(0)}%</div>
        <div>Clasificación SOAP: {(breakdown.soap_classification * 100).toFixed(0)}%</div>
        <div>Integración de entidades: {(breakdown.entity_integration * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
};
```

**Entregables Sprint 3:**
- [ ] DynamicSOAPEditor con modo auditoría
- [ ] Controles de reclasificación manual
- [ ] Sistema de reporte de errores
- [ ] Indicadores visuales de confianza

---

### **SPRINT 4 (Semana 7-8): Sistema de Autoevaluación (EVALs)**

#### **Objetivos del Sprint:**
- Implementar métricas de rendimiento de IA
- Dashboard ejecutivo con estadísticas
- Sistema de mejora continua

#### **Tareas Técnicas:**

**Servicio de Evaluación y Métricas:**
```typescript
class SOAPEvaluationService {
  
  /**
   * EVALUAR cuando el profesional guarda la versión final
   */
  async evaluateSOAPAccuracy(
    sessionId: string,
    originalAISuggestion: AdvancedSOAPResult,
    finalProfessionalVersion: SOAPStructure,
    auditActions: AuditAction[]
  ): Promise<EvaluationResult> {
    
    const startTime = Date.now();
    
    // 1. Calcular métricas de precisión
    const accuracyMetrics = this.calculateAccuracyMetrics(
      originalAISuggestion.classifiedSegments,
      auditActions
    );
    
    // 2. Medir tiempo de corrección
    const timeMetrics = this.calculateTimeMetrics(auditActions);
    
    // 3. Analizar patrones de error
    const errorPatterns = this.analyzeErrorPatterns(auditActions);
    
    // 4. Guardar evaluación
    const evaluation: EvaluationResult = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      accuracy_metrics: accuracyMetrics,
      time_metrics: timeMetrics,
      error_patterns: errorPatterns,
      overall_quality_score: this.calculateOverallQuality(accuracyMetrics, timeMetrics)
    };
    
    await this.saveEvaluation(evaluation);
    
    return evaluation;
  }

  /**
   * CALCULAR métricas de precisión SOAP
   */
  private calculateAccuracyMetrics(
    originalSegments: ClassifiedSegment[],
    auditActions: AuditAction[]
  ): AccuracyMetrics {
    
    const totalSegments = originalSegments.length;
    const reclassifiedSegments = auditActions.filter(a => a.action_type === 'RECLASSIFY').length;
    const approvedSegments = auditActions.filter(a => a.action_type === 'APPROVE').length;
    const rejectedSegments = auditActions.filter(a => a.action_type === 'REJECT').length;
    
    // Calcular precisión por sección SOAP
    const sectionAccuracy = {
      'S': this.calculateSectionAccuracy('S', originalSegments, auditActions),
      'O': this.calculateSectionAccuracy('O', originalSegments, auditActions),
      'A': this.calculateSectionAccuracy('A', originalSegments, auditActions),
      'P': this.calculateSectionAccuracy('P', originalSegments, auditActions)
    };
    
    return {
      soap_accuracy_percentage: ((totalSegments - reclassifiedSegments) / totalSegments) * 100,
      segments_unchanged: totalSegments - reclassifiedSegments,
      segments_reclassified: reclassifiedSegments,
      segments_approved: approvedSegments,
      segments_rejected: rejectedSegments,
      section_accuracy: sectionAccuracy,
      confidence_correlation: this.calculateConfidenceCorrelation(originalSegments, auditActions)
    };
  }

  /**
   * MEDIR tiempo dedicado a correcciones
   */
  private calculateTimeMetrics(auditActions: AuditAction[]): TimeMetrics {
    if (auditActions.length === 0) {
      return {
        total_review_time_seconds: 0,
        average_time_per_correction: 0,
        time_efficiency_score: 100
      };
    }

    const timestamps = auditActions.map(a => new Date(a.timestamp).getTime());
    const firstAction = Math.min(...timestamps);
    const lastAction = Math.max(...timestamps);
    
    const totalReviewTime = (lastAction - firstAction) / 1000; // segundos
    const corrections = auditActions.filter(a => a.action_type === 'RECLASSIFY');
    const avgTimePerCorrection = corrections.length > 0 ? totalReviewTime / corrections.length : 0;
    
    // Calcular score de eficiencia (menos tiempo = mejor score)
    const efficiencyScore = Math.max(0, 100 - (totalReviewTime / 60) * 10); // penalizar por minuto
    
    return {
      total_review_time_seconds: totalReviewTime,
      average_time_per_correction: avgTimePerCorrection,
      time_efficiency_score: efficiencyScore,
      corrections_made: corrections.length
    };
  }

  /**
   * ANALIZAR patrones de error para mejora
   */
  private analyzeErrorPatterns(auditActions: AuditAction[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    
    // Analizar reclasificaciones más comunes
    const reclassifications = auditActions.filter(a => a.action_type === 'RECLASSIFY');
    const commonMisclassifications = this.findCommonMisclassifications(reclassifications);
    
    // Analizar errores reportados
    const errorReports = auditActions.filter(a => a.action_type === 'REPORT_ERROR');
    const errorCategories = this.categorizeErrors(errorReports);
    
    patterns.push(...commonMisclassifications, ...errorCategories);
    
    return patterns;
  }

  /**
   * GUARDAR evaluación en Firestore
   */
  private async saveEvaluation(evaluation: EvaluationResult): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection('soap_evaluations').doc(evaluation.session_id).set(evaluation);
      
      // También actualizar estadísticas agregadas
      await this.updateAggregateStats(evaluation);
      
    } catch (error) {
      console.error('❌ Error guardando evaluación:', error);
      throw error;
    }
  }

  /**
   * ACTUALIZAR estadísticas agregadas para dashboard
   */
  private async updateAggregateStats(evaluation: EvaluationResult): Promise<void> {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    const statsRef = db.collection('daily_stats').doc(today);
    
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      if (statsDoc.exists) {
        const currentStats = statsDoc.data() as DailyStats;
        const updatedStats = this.mergeStats(currentStats, evaluation);
        transaction.update(statsRef, updatedStats);
      } else {
        const newStats = this.createInitialStats(evaluation);
        transaction.set(statsRef, newStats);
      }
    });
  }
}
```

**Dashboard Ejecutivo con Métricas:**
```typescript
const ExecutiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  useEffect(() => {
    loadDashboardMetrics(timeRange);
  }, [timeRange]);

  return (
    <div className="executive-dashboard p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Rendimiento IA - AiDuxCare</h1>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Precisión SOAP"
          value={`${metrics?.soap_accuracy_avg.toFixed(1)}%`}
          trend={metrics?.soap_accuracy_trend}
          color="blue"
        />
        
        <MetricCard
          title="Tiempo Promedio de Revisión"
          value={`${(metrics?.avg_review_time / 60).toFixed(1)} min`}
          trend={metrics?.review_time_trend}
          color="green"
        />
        
        <MetricCard
          title="Segmentos sin Corrección"
          value={`${metrics?.unchanged_segments_percentage.toFixed(1)}%`}
          trend={metrics?.unchanged_trend}
          color="purple"
        />
        
        <MetricCard
          title="Score de Confianza"
          value={`${metrics?.confidence_score_avg.toFixed(1)}/10`}
          trend={metrics?.confidence_trend}
          color="orange"
        />
      </div>

      {/* Gráficos de rendimiento */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Precisión SOAP por Sección</h3>
          <SOAPAccuracyChart data={metrics?.section_accuracy} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Evolución de Precisión</h3>
          <AccuracyTrendChart data={metrics?.accuracy_timeline} />
        </div>
      </div>

      {/* Análisis de errores */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Patrones de Error Más Comunes</h3>
        <ErrorPatternsTable patterns={metrics?.common_errors} />
      </div>

      {/* Recomendaciones de mejora */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🎯 Recomendaciones de Mejora</h3>
        <ImprovementRecommendations recommendations={metrics?.improvement_suggestions} />
      </div>
    </div>
  );
};
```

**Entregables Sprint 4:**
- [ ] Servicio de evaluación de precisión SOAP
- [ ] Dashboard ejecutivo con métricas en tiempo real
- [ ] Análisis de patrones de error
- [ ] Recomendaciones automáticas de mejora

---

## 🎯 ENTREGABLES FINALES DEL PLAN

### **Sistema Completo Entregado:**

1. **✅ Clasificador SOAP Inteligente**
   - Gemini 1.5 Pro con prompt modular JSON
   - Clasificación frase-por-frase con confianza granular
   - Especialización por disciplina médica

2. **✅ Modo Auditoría (Human-in-the-loop)**
   - Control total del profesional sobre clasificaciones
   - Reclasificación manual con drag & drop
   - Sistema de reporte de errores para mejora continua

3. **✅ Sistema de Resiliencia**
   - Fallback automático a heurísticas
   - Guardado garantizado de transcripciones (compliance)
   - Monitoreo y logging de eventos de fallback

4. **✅ Autoevaluación (EVALs)**
   - Métricas objetivas de rendimiento de IA
   - Dashboard ejecutivo con estadísticas en tiempo real
   - Análisis de patrones de error y recomendaciones

5. **✅ Arquitectura Escalable**
   - Prompt modular preparado para múltiples especialidades
   - Interfaces TypeScript robustas
   - Sistema preparado para fine-tuning futuro

---

## 💰 IMPACTO ESPERADO

### **Métricas de Éxito:**
- **Precisión SOAP:** 90%+ (vs 60% actual)
- **Tiempo de revisión:** <5 minutos por consulta
- **Satisfacción profesional:** 8.5/10 o superior
- **Disponibilidad del sistema:** 99.9% (con fallback)

### **Diferenciación Competitiva:**
- Primer EMR con clasificación SOAP frase-por-frase
- Sistema de auditoría transparente y profesional
- Métricas objetivas de calidad de IA
- Arquitectura resiliente de grado hospitalario

---

**Documento preparado por:** Equipo Técnico AiDuxCare  
**Estado:** Ready for Implementation V2.0  
**Próximo paso:** Iniciar Sprint 1 con configuración de prompt modular 