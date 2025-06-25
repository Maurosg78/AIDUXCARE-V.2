/**
 * MEDICAL DYNAMIC SOAP EDITOR - SOAP EDITABLE Y DINÁMICO CON MODO AUDITORÍA
 * SEARCH MODO AUDITORÍA: Indicadores de confianza y controles de reclasificación
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ClinicalSuggestion, 
  ExamTemplate, 
  ExamTest, 
  RedFlag 
} from '../../services/ClinicalAssistantService';

// TARGET: DATOS SIMULADOS PARA TESTING DEL MODO AUDITORÍA
const MOCK_AUDIT_DATA = {
  classifiedSegments: [
    {
      id: 'seg_1',
      originalText: 'El paciente refiere dolor lumbar intenso desde hace 3 días',
      soapSection: 'S' as const,
      confidence: 0.95,
      speaker: 'PACIENTE',
      entities: [{ text: 'dolor lumbar', type: 'SYMPTOM', confidence: 0.9 }]
    },
    {
      id: 'seg_2',
      originalText: 'Limitación de movilidad en flexión anterior',
      soapSection: 'O' as const,
      confidence: 0.78,
      speaker: 'TERAPEUTA',
      entities: [{ text: 'limitación movilidad', type: 'FINDING', confidence: 0.85 }]
    },
    {
      id: 'seg_3',
      originalText: 'Posible lumbalgia mecánica',
      soapSection: 'A' as const,
      confidence: 0.65,
      speaker: 'TERAPEUTA',
      entities: [{ text: 'lumbalgia mecánica', type: 'DIAGNOSIS', confidence: 0.7 }]
    },
    {
      id: 'seg_4',
      originalText: 'Se recomienda fisioterapia y reposo relativo',
      soapSection: 'P' as const,
      confidence: 0.88,
      speaker: 'TERAPEUTA',
      entities: [{ text: 'fisioterapia', type: 'TREATMENT', confidence: 0.9 }]
    }
  ],
  redFlags: [
    {
      id: 'rf_1',
      type: 'NEUROLOGICAL',
      severity: 'HIGH',
      title: 'Pérdida de fuerza en extremidades inferiores',
      description: 'El paciente presenta debilidad muscular que requiere evaluación neurológica inmediata',
      recommendation: 'Derivar a urgencias para evaluación neurológica completa'
    },
    {
      id: 'rf_2',
      type: 'PAIN',
      severity: 'MEDIUM',
      title: 'Dolor nocturno persistente',
      description: 'El dolor empeora por la noche y no mejora con reposo',
      recommendation: 'Considerar evaluación por traumatología'
    }
  ]
};

interface SOAPSection {
  id: string;
  type: 'S' | 'O' | 'A' | 'P';
  title: string;
  content: string;
  suggestions: SOAPSuggestion[];
  isEditing: boolean;
  auditMetadata?: {
    confidence: number;
    requiresReview: boolean;
    alternativeClassifications: {
      section: 'S' | 'O' | 'A' | 'P';
      confidence: number;
      reasoning: string;
    }[];
    professionalOverride?: {
      originalSection: 'S' | 'O' | 'A' | 'P';
      newSection: 'S' | 'O' | 'A' | 'P';
      timestamp: string;
      reasoning: string;
    };
  };
}

interface SOAPSuggestion {
  id: string;
  text: string;
  source: 'ASSISTANT' | 'TEMPLATE' | 'RED_FLAG';
  isApplied: boolean;
  timestamp: string;
}

interface AuditAction {
  actionType: 'RECLASSIFY' | 'REPORT_ERROR' | 'APPROVE' | 'REJECT';
  originalSection: 'S' | 'O' | 'A' | 'P';
  newSection?: 'S' | 'O' | 'A' | 'P';
  professionalFeedback: string;
  timestamp: string;
  confidenceOverride?: number;
}

interface ProfessionalFeedback {
  sectionId: string;
  errorType: 'CLASSIFICATION_ERROR' | 'CONTENT_ERROR' | 'MISSING_INFO' | 'OTHER';
  feedbackText: string;
  originalClassification: 'S' | 'O' | 'A' | 'P';
  professionalId: string;
  timestamp: string;
}

interface ClassifiedSegment {
  id: string;
  originalText: string;
  soapSection: 'S' | 'O' | 'A' | 'P';
  confidence: number;
  speaker: string;
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

interface RedFlag {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
}

interface DynamicSOAPEditorProps {
  initialSOAP?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  acceptedSuggestions: ClinicalSuggestion[];
  completedTests: { [templateId: string]: { [testId: string]: { result: string; notes?: string } } };
  onSOAPChange: (soap: { subjective: string; objective: string; assessment: string; plan: string }) => void;
  onSuggestionApplied: (suggestionId: string, section: 'S' | 'O' | 'A' | 'P') => void;
  isReadOnly?: boolean;
  auditMode?: boolean;
  onAuditAction?: (action: AuditAction) => Promise<void>;
  onFeedbackReport?: (feedback: ProfessionalFeedback) => Promise<void>;
  classifiedSegments?: ClassifiedSegment[];
  redFlags?: RedFlag[];
}

const DynamicSOAPEditor: React.FC<DynamicSOAPEditorProps> = ({
  initialSOAP,
  acceptedSuggestions,
  completedTests,
  onSOAPChange,
  onSuggestionApplied,
  isReadOnly = false,
  auditMode = false,
  onAuditAction,
  onFeedbackReport,
  classifiedSegments = MOCK_AUDIT_DATA.classifiedSegments,
  redFlags = MOCK_AUDIT_DATA.redFlags
}) => {

  const [soapSections, setSOAPSections] = useState<SOAPSection[]>([
    {
      id: 'subjective',
      type: 'S',
      title: 'Subjetivo (S)',
      content: initialSOAP?.subjective || '',
      suggestions: [],
      isEditing: false,
      auditMetadata: {
        confidence: 0.85,
        requiresReview: false,
        alternativeClassifications: []
      }
    },
    {
      id: 'objective',
      type: 'O',
      title: 'Objetivo (O)',
      content: initialSOAP?.objective || '',
      suggestions: [],
      isEditing: false,
      auditMetadata: {
        confidence: 0.85,
        requiresReview: false,
        alternativeClassifications: []
      }
    },
    {
      id: 'assessment',
      type: 'A',
      title: 'Evaluación (A)',
      content: initialSOAP?.assessment || '',
      suggestions: [],
      isEditing: false,
      auditMetadata: {
        confidence: 0.85,
        requiresReview: false,
        alternativeClassifications: []
      }
    },
    {
      id: 'plan',
      type: 'P',
      title: 'Plan (P)',
      content: initialSOAP?.plan || '',
      suggestions: [],
      isEditing: false,
      auditMetadata: {
        confidence: 0.85,
        requiresReview: false,
        alternativeClassifications: []
      }
    }
  ]);

  const [pendingSuggestions, setPendingSuggestions] = useState<SOAPSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [auditState, setAuditState] = useState({
    segmentsUnderReview: [] as string[],
    pendingActions: [] as AuditAction[],
    professionalOverrides: {} as Record<string, 'S' | 'O' | 'A' | 'P'>,
    showConfidenceIndicators: true,
    showRedFlags: true
  });
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  useEffect(() => {
    generateSOAPSuggestions();
    updateAuditMetadata();
  }, [acceptedSuggestions, completedTests, classifiedSegments]);

  useEffect(() => {
    const currentSOAP = {
      subjective: soapSections.find(s => s.type === 'S')?.content || '',
      objective: soapSections.find(s => s.type === 'O')?.content || '',
      assessment: soapSections.find(s => s.type === 'A')?.content || '',
      plan: soapSections.find(s => s.type === 'P')?.content || ''
    };
    onSOAPChange(currentSOAP);
  }, [soapSections, onSOAPChange]);

  const updateAuditMetadata = () => {
    setSOAPSections(prev => prev.map(section => {
      const sectionSegments = classifiedSegments.filter(seg => seg.soapSection === section.type);
      const avgConfidence = sectionSegments.length > 0 
        ? sectionSegments.reduce((sum, seg) => sum + seg.confidence, 0) / sectionSegments.length
        : 0.85;
      
      const requiresReview = avgConfidence < 0.7 || sectionSegments.some(seg => seg.confidence < 0.6);
      
      return {
        ...section,
        auditMetadata: {
          ...section.auditMetadata,
          confidence: avgConfidence,
          requiresReview,
          alternativeClassifications: generateAlternativeClassifications(section.type, sectionSegments)
        }
      };
    }));
  };

  const generateAlternativeClassifications = (currentSection: 'S' | 'O' | 'A' | 'P', segments: ClassifiedSegment[]) => {
    const alternatives = [];
    const sections: ('S' | 'O' | 'A' | 'P')[] = ['S', 'O', 'A', 'P'];
    
    sections.forEach(section => {
      if (section !== currentSection) {
        const confidence = Math.random() * 0.3 + 0.1; // Simular confianza alternativa
        if (confidence > 0.2) {
          alternatives.push({
            section,
            confidence,
            reasoning: `Clasificación alternativa basada en patrones semánticos`
          });
        }
      }
    });
    
    return alternatives.sort((a, b) => b.confidence - a.confidence);
  };

  const generateSOAPSuggestions = () => {
    const newSuggestions: SOAPSuggestion[] = [];

    acceptedSuggestions.forEach(suggestion => {
      if (suggestion.type === 'EXAM_TEMPLATE') {
        const template = suggestion.data as ExamTemplate;
        const templateTests = completedTests[template.id] || {};
        
        Object.entries(templateTests).forEach(([testId, testResult]) => {
          const test = template.tests.find(t => t.id === testId);
          if (test && testResult.result) {
            const objectiveSuggestion: SOAPSuggestion = {
              id: `obj-${testId}`,
              text: `${test.name}: ${testResult.result}${testResult.notes ? ` (${testResult.notes})` : ''}`,
              source: 'TEMPLATE',
              isApplied: false,
              timestamp: new Date().toISOString()
            };
            newSuggestions.push(objectiveSuggestion);
          }
        });
      }
    });

    acceptedSuggestions.forEach(suggestion => {
      if (suggestion.type === 'RED_FLAG') {
        const redFlag = suggestion.data as RedFlag;
        const assessmentSuggestion: SOAPSuggestion = {
          id: `assess-${redFlag.id}`,
          text: `WARNING: Consideración clínica: ${redFlag.description}`,
          source: 'RED_FLAG',
          isApplied: false,
          timestamp: new Date().toISOString()
        };
        newSuggestions.push(assessmentSuggestion);
      }
    });

    setPendingSuggestions(newSuggestions);
    
    setSOAPSections(prev => prev.map(section => ({
      ...section,
      suggestions: newSuggestions.filter(s => getSuggestionSection(s) === section.type)
    })));

    console.log('NOTES Sugerencias SOAP generadas:', newSuggestions.length);
  };

  const getSuggestionSection = (suggestion: SOAPSuggestion): 'S' | 'O' | 'A' | 'P' => {
    if (suggestion.source === 'TEMPLATE') return 'O';
    if (suggestion.source === 'RED_FLAG') return 'A';
    return 'S';
  };

  const handleSectionEdit = (sectionId: string, isEditing: boolean) => {
    setSOAPSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, isEditing } : section
    ));

    if (isEditing) {
      setTimeout(() => {
        const textarea = textareaRefs.current[sectionId];
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 100);
    }
  };

  const handleContentChange = (sectionId: string, content: string) => {
    setSOAPSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, content } : section
    ));
  };

  const handleApplySuggestion = (suggestion: SOAPSuggestion, sectionType: 'S' | 'O' | 'A' | 'P') => {
    const targetSection = soapSections.find(s => s.type === sectionType);
    if (targetSection) {
      const newContent = targetSection.content 
        ? `${targetSection.content}\n${suggestion.text}`
        : suggestion.text;
      
      handleContentChange(targetSection.id, newContent);
      
      const updatedSuggestion = { ...suggestion, isApplied: true };
      setPendingSuggestions(prev => prev.map(s => 
        s.id === suggestion.id ? updatedSuggestion : s
      ));
      
      onSuggestionApplied(suggestion.id, sectionType);
    }
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setPendingSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    setSOAPSections(prev => prev.map(section => ({
      ...section,
      suggestions: section.suggestions.filter(s => s.id !== suggestionId)
    })));

    console.log('ERROR: Sugerencia descartada:', suggestionId);
  };

  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const handleReclassifySection = async (sectionId: string, newSection: 'S' | 'O' | 'A' | 'P') => {
    const section = soapSections.find(s => s.id === sectionId);
    if (!section || !onAuditAction) return;

    const auditAction: AuditAction = {
      actionType: 'RECLASSIFY',
      originalSection: section.type,
      newSection,
      professionalFeedback: `Reclasificado de ${section.type} a ${newSection}`,
      timestamp: new Date().toISOString()
    };

    try {
      await onAuditAction(auditAction);
      
      // Actualizar estado local
      setAuditState(prev => ({
        ...prev,
        professionalOverrides: {
          ...prev.professionalOverrides,
          [sectionId]: newSection
        }
      }));

      console.log('SUCCESS: Sección reclasificada:', sectionId, '→', newSection);
    } catch (error) {
      console.error('ERROR: Error en reclasificación:', error);
    }
  };

  const handleReportError = async (sectionId: string, errorType: string, feedback: string) => {
    const section = soapSections.find(s => s.id === sectionId);
    if (!section || !onFeedbackReport) return;

    const professionalFeedback: ProfessionalFeedback = {
      sectionId: sectionId,
      errorType: errorType as any,
      feedbackText: feedback,
      originalClassification: section.type,
      professionalId: 'current-user', // TODO: Obtener del contexto de autenticación
      timestamp: new Date().toISOString()
    };

    try {
      await onFeedbackReport(professionalFeedback);
      console.log('SUCCESS: Error reportado:', sectionId, errorType);
    } catch (error) {
      console.error('ERROR: Error reportando error:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Media';
    return 'Baja';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 border-red-700';
      case 'HIGH': return 'bg-red-500 border-red-600';
      case 'MEDIUM': return 'bg-yellow-500 border-yellow-600';
      case 'LOW': return 'bg-blue-500 border-blue-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'ALERT';
      case 'HIGH': return 'WARNING:';
      case 'MEDIUM': return '⚡';
      case 'LOW': return 'INFO';
      default: return 'NOTES:';
    }
  };

  const AuditControls = ({ section }: { section: SOAPSection }) => {
    const [showReclassifyMenu, setShowReclassifyMenu] = useState(false);
    const [showErrorReport, setShowErrorReport] = useState(false);
    const [errorFeedback, setErrorFeedback] = useState('');

    return (
      <div className="audit-controls bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Confianza IA:</span>
            <div className={`w-3 h-3 rounded-full ${getConfidenceColor(section.auditMetadata?.confidence || 0)}`}></div>
            <span className="text-sm text-gray-600">
              {getConfidenceLabel(section.auditMetadata?.confidence || 0)} 
              ({Math.round((section.auditMetadata?.confidence || 0) * 100)}%)
            </span>
          </div>
          
          {section.auditMetadata?.requiresReview && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Requiere Revisión
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowReclassifyMenu(!showReclassifyMenu)}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            RELOAD: Reclasificar
          </button>
          
          <button
            onClick={() => setShowErrorReport(!showErrorReport)}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            WARNING: Reportar Error
          </button>
        </div>

        {showReclassifyMenu && (
          <div className="mt-2 p-2 bg-white border rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Mover a sección:</p>
            <div className="flex space-x-1">
              {(['S', 'O', 'A', 'P'] as const).map(sec => (
                <button
                  key={sec}
                  onClick={() => {
                    handleReclassifySection(section.id, sec);
                    setShowReclassifyMenu(false);
                  }}
                  disabled={sec === section.type}
                  className={`px-2 py-1 text-xs rounded ${
                    sec === section.type 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
        )}

        {showErrorReport && (
          <div className="mt-2 p-2 bg-white border rounded-lg">
            <textarea
              value={errorFeedback}
              onChange={(e) => setErrorFeedback(e.target.value)}
              placeholder="Describe el error encontrado..."
              className="w-full p-2 text-xs border rounded resize-none"
              rows={3}
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => {
                  handleReportError(section.id, 'CLASSIFICATION_ERROR', errorFeedback);
                  setErrorFeedback('');
                  setShowErrorReport(false);
                }}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Enviar Reporte
              </button>
              <button
                onClick={() => {
                  setErrorFeedback('');
                  setShowErrorReport(false);
                }}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ClinicalAlerts = () => {
    if (!auditState.showRedFlags || redFlags.length === 0) return null;

    return (
      <div className="clinical-alerts mb-6">
        <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
          ALERT Alertas Clínicas ({redFlags.length})
        </h3>
        
        <div className="space-y-3">
          {redFlags.map(flag => (
            <div
              key={flag.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(flag.severity)} text-white`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{getSeverityIcon(flag.severity)}</span>
                  <h4 className="font-semibold text-lg">{flag.title}</h4>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full uppercase">
                    {flag.severity}
                  </span>
                </div>
              </div>
              
              <p className="text-sm mb-3 opacity-90">{flag.description}</p>
              
              <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">TIP Recomendación:</p>
                <p className="text-sm">{flag.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ClassifiedSegmentsView = () => {
    if (!auditMode || !auditState.showConfidenceIndicators) return null;

    return (
      <div className="classified-segments mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          SEARCH Segmentos Clasificados ({classifiedSegments.length})
        </h3>
        
        <div className="space-y-2">
          {classifiedSegments.map(segment => (
            <div
              key={segment.id}
              className="p-3 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${
                      segment.soapSection === 'S' ? 'bg-blue-500' :
                      segment.soapSection === 'O' ? 'bg-green-500' :
                      segment.soapSection === 'A' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}>
                      {segment.soapSection}
                    </span>
                    <span className="text-xs text-gray-500">({segment.speaker})</span>
                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(segment.confidence)}`}></div>
                    <span className="text-xs text-gray-600">
                      {Math.round(segment.confidence * 100)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-800">{segment.originalText}</p>
                  
                  {segment.entities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {segment.entities.map((entity, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {entity.text} ({entity.type})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dynamic-soap-editor bg-white rounded-lg shadow-lg p-6">
      <ClinicalAlerts />
      <ClassifiedSegmentsView />
      {auditMode && (
        <div className="audit-controls-panel mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              SEARCH Modo Auditoría Activo
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setAuditState(prev => ({ ...prev, showConfidenceIndicators: !prev.showConfidenceIndicators }))}
                className={`px-3 py-1 text-xs rounded ${
                  auditState.showConfidenceIndicators 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {auditState.showConfidenceIndicators ? 'SUCCESS:' : 'ERROR:'} Indicadores
              </button>
              <button
                onClick={() => setAuditState(prev => ({ ...prev, showRedFlags: !prev.showRedFlags }))}
                className={`px-3 py-1 text-xs rounded ${
                  auditState.showRedFlags 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {auditState.showRedFlags ? 'SUCCESS:' : 'ERROR:'} Alertas
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Segmentos bajo revisión:</span> {auditState.segmentsUnderReview.length}
            </div>
            <div>
              <span className="font-medium">Acciones pendientes:</span> {auditState.pendingActions.length}
            </div>
          </div>
        </div>
      )}

      <div className="soap-sections space-y-6">
        {soapSections.map(section => (
          <div key={section.id} className="soap-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
              
              {auditMode && section.auditMetadata && (
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getConfidenceColor(section.auditMetadata.confidence)}`}></div>
                  <span className="text-sm text-gray-600">
                    {Math.round(section.auditMetadata.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>

            {auditMode && <AuditControls section={section} />}

            <div className="content-area">
              {section.isEditing ? (
                <textarea
                  ref={(el) => { textareaRefs.current[section.id] = el; }}
                  value={section.content}
                  onChange={(e) => handleContentChange(section.id, e.target.value)}
                  onBlur={() => handleSectionEdit(section.id, false)}
                  onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={Math.max(3, section.content.split('\n').length)}
                  disabled={isReadOnly}
                />
              ) : (
                <div
                  onClick={() => !isReadOnly && handleSectionEdit(section.id, true)}
                  className={`p-3 border border-gray-300 rounded-lg min-h-[80px] ${
                    isReadOnly ? 'bg-gray-50' : 'cursor-pointer hover:bg-gray-50'
                  }`}
                >
                  {section.content || (
                    <span className="text-gray-400 italic">
                      {isReadOnly ? 'Sin contenido' : 'Haz clic para editar...'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showSuggestions && pendingSuggestions.length > 0 && (
        <div className="suggestions-panel mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            TIP Sugerencias Disponibles ({pendingSuggestions.length})
          </h3>
          
          <div className="space-y-2">
            {pendingSuggestions.map(suggestion => (
              <div key={suggestion.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span className="text-sm text-gray-700">{suggestion.text}</span>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApplySuggestion(suggestion, getSuggestionSection(suggestion))}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => handleDismissSuggestion(suggestion.id)}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicSOAPEditor;
