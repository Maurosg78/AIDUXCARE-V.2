/**
 * 🏥 DYNAMIC SOAP EDITOR - SOAP EDITABLE Y DINÁMICO CON MODO AUDITORÍA
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ClinicalSuggestion, 
  ExamTemplate, 
  ExamTest, 
  RedFlag 
} from '../../services/ClinicalAssistantService';

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
  classifiedSegments?: Array<{
    id: string;
    originalText: string;
    soapSection: 'S' | 'O' | 'A' | 'P';
    confidence: number;
    speaker: string;
    entities: any[];
  }>;
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
  classifiedSegments = []
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
    professionalOverrides: {} as Record<string, 'S' | 'O' | 'A' | 'P'>
  });
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  useEffect(() => {
    generateSOAPSuggestions();
  }, [acceptedSuggestions, completedTests]);

  useEffect(() => {
    const currentSOAP = {
      subjective: soapSections.find(s => s.type === 'S')?.content || '',
      objective: soapSections.find(s => s.type === 'O')?.content || '',
      assessment: soapSections.find(s => s.type === 'A')?.content || '',
      plan: soapSections.find(s => s.type === 'P')?.content || ''
    };
    onSOAPChange(currentSOAP);
  }, [soapSections, onSOAPChange]);

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
          text: `⚠️ Consideración clínica: ${redFlag.description}`,
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

    console.log('📝 Sugerencias SOAP generadas:', newSuggestions.length);
  };

  const getSuggestionSection = (suggestion: SOAPSuggestion): 'S' | 'O' | 'A' | 'P' => {
    if (suggestion.id.startsWith('obj-')) return 'O';
    if (suggestion.id.startsWith('assess-')) return 'A';
    if (suggestion.id.startsWith('plan-')) return 'P';
    return 'S';
  };

  const handleSectionEdit = (sectionId: string, isEditing: boolean) => {
    setSOAPSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isEditing }
        : section
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
      section.id === sectionId 
        ? { ...section, content }
        : section
    ));
  };

  const handleApplySuggestion = (suggestion: SOAPSuggestion, sectionType: 'S' | 'O' | 'A' | 'P') => {
    setSOAPSections(prev => prev.map(section => {
      if (section.type === sectionType) {
        const newContent = section.content 
          ? `${section.content}\n• ${suggestion.text}`
          : `• ${suggestion.text}`;
        
        return {
          ...section,
          content: newContent,
          suggestions: section.suggestions.map(s => 
            s.id === suggestion.id ? { ...s, isApplied: true } : s
          )
        };
      }
      return section;
    }));

    setPendingSuggestions(prev => prev.map(s => 
      s.id === suggestion.id ? { ...s, isApplied: true } : s
    ));

    onSuggestionApplied(suggestion.id, sectionType);
    console.log('✅ Sugerencia aplicada:', suggestion.text);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setPendingSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    setSOAPSections(prev => prev.map(section => ({
      ...section,
      suggestions: section.suggestions.filter(s => s.id !== suggestionId)
    })));

    console.log('❌ Sugerencia descartada:', suggestionId);
  };

  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // NUEVO: Funciones de auditoría
  const handleReclassifySection = async (sectionId: string, newSection: 'S' | 'O' | 'A' | 'P') => {
    const section = soapSections.find(s => s.id === sectionId);
    if (!section || !onAuditAction) return;

    const auditAction: AuditAction = {
      actionType: 'RECLASSIFY',
      originalSection: section.type,
      newSection: newSection,
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

      console.log('✅ Sección reclasificada:', sectionId, '→', newSection);
    } catch (error) {
      console.error('❌ Error en reclasificación:', error);
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
      console.log('✅ Error reportado:', sectionId, errorType);
    } catch (error) {
      console.error('❌ Error reportando error:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Media';
    return 'Baja';
  };

  // NUEVO: Componente para controles de auditoría
  const AuditControls = ({ section }: { section: SOAPSection }) => {
    const [showReclassifyMenu, setShowReclassifyMenu] = useState(false);
    const [showErrorReport, setShowErrorReport] = useState(false);
    const [errorFeedback, setErrorFeedback] = useState('');

    if (!auditMode) return null;

    return (
      <div className="flex items-center space-x-2">
        {/* Indicador de confianza */}
        <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(section.auditMetadata?.confidence || 0)}`}>
          {getConfidenceLabel(section.auditMetadata?.confidence || 0)}: {(section.auditMetadata?.confidence || 0) * 100}%
        </div>

        {/* Botón de reclasificación */}
        <div className="relative">
          <button
            onClick={() => setShowReclassifyMenu(!showReclassifyMenu)}
            className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium hover:bg-blue-200"
          >
            🔄 Reclasificar
          </button>
          
          {showReclassifyMenu && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {(['S', 'O', 'A', 'P'] as const).map((sectionType) => (
                <button
                  key={sectionType}
                  onClick={() => {
                    handleReclassifySection(section.id, sectionType);
                    setShowReclassifyMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  → {sectionType}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón de reportar error */}
        <button
          onClick={() => setShowErrorReport(true)}
          className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200"
        >
          ⚠️ Reportar Error
        </button>

        {/* Modal de reporte de error */}
        {showErrorReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h4 className="font-semibold mb-4">Reportar Error en {section.title}</h4>
              
              <select 
                className="w-full p-2 border border-gray-300 rounded mb-4"
                onChange={(e) => setErrorFeedback(e.target.value)}
              >
                <option value="">Seleccionar tipo de error...</option>
                <option value="CLASSIFICATION_ERROR">Error de clasificación</option>
                <option value="CONTENT_ERROR">Error en contenido</option>
                <option value="MISSING_INFO">Información faltante</option>
                <option value="OTHER">Otro</option>
              </select>

              <textarea
                placeholder="Describe el problema..."
                className="w-full p-2 border border-gray-300 rounded mb-4 h-24"
                value={errorFeedback}
                onChange={(e) => setErrorFeedback(e.target.value)}
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowErrorReport(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (errorFeedback) {
                      handleReportError(section.id, 'OTHER', errorFeedback);
                      setShowErrorReport(false);
                      setErrorFeedback('');
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Reportar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
      
      {/* NUEVO: Header de auditoría */}
      {auditMode && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-blue-800 flex items-center">
                🔍 Modo Auditoría Activo
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                  PROFESIONAL
                </span>
              </h4>
              <p className="text-sm text-blue-600 mt-1">
                Revise las clasificaciones automáticas y reclasifique si es necesario
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-800">
                {soapSections.filter(s => (s.auditMetadata?.confidence || 0) > 0.8).length}/{soapSections.length}
              </div>
              <div className="text-xs text-blue-600">Alta confianza</div>
            </div>
          </div>
          
          {/* Estadísticas de auditoría */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-800">Segmentos Clasificados</div>
                <div className="text-blue-600">{classifiedSegments.length}</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Confianza Promedio</div>
                <div className="text-blue-600">
                  {soapSections.length > 0 
                    ? Math.round((soapSections.reduce((sum, s) => sum + (s.auditMetadata?.confidence || 0), 0) / soapSections.length) * 100)
                    : 0}%
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Reclasificaciones</div>
                <div className="text-blue-600">{Object.keys(auditState.professionalOverrides).length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-[#2C3E50]">
            Nota SOAP Dinámica
            {auditMode && <span className="ml-2 text-sm text-blue-600">(Modo Auditoría)</span>}
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          {pendingSuggestions.filter(s => !s.isApplied).length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#A8E6CF] rounded-full animate-pulse"></div>
              <span className="text-xs text-[#5DA5A3] font-medium">
                {pendingSuggestions.filter(s => !s.isApplied).length} sugerencias
              </span>
            </div>
          )}
          
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              showSuggestions 
                ? 'bg-[#5DA5A3] text-white' 
                : 'bg-[#BDC3C7] text-[#2C3E50]'
            }`}
          >
            {showSuggestions ? '👁️ Ocultar' : '👁️ Mostrar'} Sugerencias
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {soapSections.map((section) => (
          <div key={section.id} className="border border-[#BDC3C7]/30 rounded-lg overflow-hidden">
            
            <div className="bg-[#F7F7F7] px-4 py-3 border-b border-[#BDC3C7]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-[#5DA5A3]">{section.type}</span>
                  <h4 className="font-semibold text-[#2C3E50]">{section.title}</h4>
                  {section.suggestions.filter(s => !s.isApplied).length > 0 && (
                    <span className="px-2 py-1 bg-[#A8E6CF] text-[#2C3E50] rounded-full text-xs font-medium">
                      {section.suggestions.filter(s => !s.isApplied).length} sugerencias
                    </span>
                  )}
                  
                  {/* NUEVO: Indicador de reclasificación profesional */}
                  {auditState.professionalOverrides[section.id] && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                      🔄 {auditState.professionalOverrides[section.id]}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* NUEVO: Controles de auditoría */}
                  <AuditControls section={section} />
                  
                  {!isReadOnly && (
                    <button
                      onClick={() => handleSectionEdit(section.id, !section.isEditing)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        section.isEditing
                          ? 'bg-[#5DA5A3] text-white'
                          : 'bg-[#BDC3C7] text-[#2C3E50] hover:bg-[#A8B2B8]'
                      }`}
                    >
                      {section.isEditing ? '✓ Guardar' : '✏️ Editar'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4">
              {section.isEditing ? (
                <textarea
                  ref={(el) => textareaRefs.current[section.id] = el}
                  value={section.content}
                  onChange={(e) => {
                    handleContentChange(section.id, e.target.value);
                    autoResize(e.target);
                  }}
                  onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                  placeholder={`Escriba el contenido para la sección ${section.title}...`}
                  className="w-full min-h-[120px] p-3 border border-[#BDC3C7]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5DA5A3]/30 resize-none"
                  style={{ overflow: 'hidden' }}
                />
              ) : (
                <div className="min-h-[120px] p-3 bg-[#F9F9F9] rounded-md">
                  {section.content ? (
                    <div className="text-sm text-[#2C3E50] whitespace-pre-wrap">
                      {section.content}
                    </div>
                  ) : (
                    <div className="text-sm text-[#2C3E50]/50 italic">
                      No hay contenido en esta sección. {!isReadOnly && 'Haga clic en "Editar" para agregar contenido.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {showSuggestions && section.suggestions.filter(s => !s.isApplied).length > 0 && (
              <div className="border-t border-[#BDC3C7]/30 bg-[#A8E6CF]/10 p-4">
                <h5 className="text-sm font-medium text-[#2C3E50] mb-3">💡 Sugerencias del Asistente:</h5>
                <div className="space-y-2">
                  {section.suggestions.filter(s => !s.isApplied).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-start justify-between p-3 bg-white rounded-md border border-[#A8E6CF]/30">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs px-2 py-1 bg-[#5DA5A3]/20 text-[#5DA5A3] rounded">
                            {suggestion.source === 'TEMPLATE' ? '📋 Plantilla' : 
                             suggestion.source === 'RED_FLAG' ? '🚨 Alerta' : '🤖 Asistente'}
                          </span>
                          <span className="text-xs text-[#2C3E50]/60">
                            {new Date(suggestion.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#2C3E50]">{suggestion.text}</p>
                      </div>
                      
                      {!isReadOnly && (
                        <div className="flex space-x-2 ml-3">
                          <button
                            onClick={() => handleApplySuggestion(suggestion, section.type)}
                            className="bg-[#5DA5A3] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#4A8280] transition-colors"
                          >
                            ✓ Aplicar
                          </button>
                          <button
                            onClick={() => handleDismissSuggestion(suggestion.id)}
                            className="bg-[#BDC3C7] text-[#2C3E50] px-2 py-1 rounded text-xs font-medium hover:bg-[#A8B2B8] transition-colors"
                          >
                            ✗ Descartar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[#BDC3C7]/30">
        <div className="flex items-center justify-between text-xs text-[#2C3E50]/60">
          <div className="flex items-center space-x-4">
            <span>📝 Secciones completadas: {soapSections.filter(s => s.content.trim()).length}/4</span>
            <span>💡 Sugerencias pendientes: {pendingSuggestions.filter(s => !s.isApplied).length}</span>
            <span>✅ Sugerencias aplicadas: {pendingSuggestions.filter(s => s.isApplied).length}</span>
            
            {/* NUEVO: Estadísticas de auditoría */}
            {auditMode && (
              <>
                <span>🔍 Segmentos auditados: {classifiedSegments.length}</span>
                <span>🔄 Reclasificaciones: {Object.keys(auditState.professionalOverrides).length}</span>
                <span>📊 Confianza promedio: {
                  soapSections.length > 0 
                    ? Math.round((soapSections.reduce((sum, s) => sum + (s.auditMetadata?.confidence || 0), 0) / soapSections.length) * 100)
                    : 0}%
                </span>
              </>
            )}
          </div>
          <div className="text-right">
            <span>Última actualización: {new Date().toLocaleTimeString()}</span>
            {auditMode && (
              <div className="mt-1">
                <span className="text-blue-600">🔍 Modo Auditoría Activo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicSOAPEditor;
