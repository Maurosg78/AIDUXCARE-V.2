/**
 * 🏥 CLINICAL ASSISTANT PANEL - INTERFAZ DE ASISTENCIA Y CHECKLIST
 */

import React, { useState, useEffect } from 'react';
import { 
  RedFlag, 
  ExamTemplate, 
  ClinicalSuggestion, 
  ClinicalAnalysisResult,
  ExamTest,
  Patient,
  ClinicalEntity
} from '../../services/ClinicalAssistantService';

interface ClinicalAssistantPanelProps {
  patient: Patient;
  entities: ClinicalEntity[];
  analysisResult: ClinicalAnalysisResult | null;
  isAnalyzing: boolean;
  onSuggestionAccepted: (suggestion: ClinicalSuggestion) => void;
  onSuggestionDismissed: (suggestion: ClinicalSuggestion) => void;
  onTestCompleted: (templateId: string, testId: string, result: string, notes?: string) => void;
  onSOAPEnhancement: (enhancement: any) => void;
}

interface AcceptedSuggestion extends ClinicalSuggestion {
  acceptedAt: string;
}

const ClinicalAssistantPanel: React.FC<ClinicalAssistantPanelProps> = ({
  patient,
  entities,
  analysisResult,
  isAnalyzing,
  onSuggestionAccepted,
  onSuggestionDismissed,
  onTestCompleted,
  onSOAPEnhancement
}) => {
  
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<AcceptedSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'templates' | 'accepted'>('alerts');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (analysisResult) {
      console.log('🔍 Nuevo análisis recibido:', analysisResult);
    }
  }, [analysisResult]);

  const handleAcceptSuggestion = (suggestion: ClinicalSuggestion) => {
    const acceptedSuggestion: AcceptedSuggestion = {
      ...suggestion,
      isAccepted: true,
      acceptedAt: new Date().toISOString()
    };

    setAcceptedSuggestions(prev => [...prev, acceptedSuggestion]);
    onSuggestionAccepted(suggestion);

    if (suggestion.type === 'EXAM_TEMPLATE') {
      setActiveTab('accepted');
    }

    console.log('SUCCESS: Sugerencia aceptada:', suggestion.title);
  };

  const handleDismissSuggestion = (suggestion: ClinicalSuggestion) => {
    setDismissedSuggestions(prev => [...prev, suggestion.id]);
    onSuggestionDismissed(suggestion);
    console.log('ERROR: Sugerencia descartada:', suggestion.title);
  };

  const handleTestComplete = (templateId: string, testId: string, result: string, notes?: string) => {
    onTestCompleted(templateId, testId, result, notes);
    
    setAcceptedSuggestions(prev => 
      prev.map(suggestion => {
        if (suggestion.type === 'EXAM_TEMPLATE' && suggestion.id.includes(templateId)) {
          const template = suggestion.data as ExamTemplate;
          const updatedTemplate = {
            ...template,
            tests: template.tests.map(test => 
              test.id === testId 
                ? { ...test, isCompleted: true, result, notes }
                : test
            )
          };
          return { ...suggestion, data: updatedTemplate };
        }
        return suggestion;
      })
    );

    console.log('📝 Test completado:', testId, result);
  };

  const getSeverityColor = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return 'WARNING:';
      case 'MEDIUM': return '⚡';
      case 'LOW': return 'ℹ️';
      default: return 'NOTES:';
    }
  };

  const getPriorityColor = (priority: ExamTemplate['priority']) => {
    switch (priority) {
      case 'HIGH': return 'border-red-400 bg-red-50';
      case 'MEDIUM': return 'border-yellow-400 bg-yellow-50';
      case 'LOW': return 'border-blue-400 bg-blue-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getFilteredSuggestions = () => {
    if (!analysisResult) return [];
    
    return analysisResult.suggestions.filter(suggestion => 
      !dismissedSuggestions.includes(suggestion.id) &&
      !acceptedSuggestions.some(accepted => accepted.id === suggestion.id)
    );
  };

  const getRedFlags = () => {
    return getFilteredSuggestions().filter(s => s.type === 'RED_FLAG');
  };

  const getExamTemplates = () => {
    return getFilteredSuggestions().filter(s => s.type === 'EXAM_TEMPLATE');
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#2C3E50]">Asistente Clínico</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#A8E6CF] rounded-full animate-pulse"></div>
            <span className="text-xs text-[#5DA5A3] font-medium">Analizando</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-12 h-12 border-4 border-[#A8E6CF] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h4 className="text-lg font-medium text-[#2C3E50] mb-2">Análisis Clínico en Progreso</h4>
          <p className="text-sm text-[#2C3E50]/60 max-w-xs">
            Detectando banderas rojas y generando sugerencias de examen...
          </p>
        </div>
      </div>
    );
  }

  if (!analysisResult || (analysisResult.suggestions.length === 0 && acceptedSuggestions.length === 0)) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#2C3E50]">Asistente Clínico</h3>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 bg-[#A8E6CF]/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[#2C3E50] mb-2">Todo en Orden</h4>
          <p className="text-sm text-[#2C3E50]/60 max-w-xs">
            No se detectaron alertas críticas. El asistente estará disponible cuando se complete la transcripción.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-semibold text-[#2C3E50]">Asistente Clínico</h3>
        </div>
        
        {/* Score de Riesgo */}
        {analysisResult && (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-[#2C3E50]">Score de Riesgo</div>
              <div className={`text-lg font-bold ${
                analysisResult.riskScore >= 70 ? 'text-red-500' :
                analysisResult.riskScore >= 40 ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {analysisResult.riskScore}/100
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              analysisResult.riskScore >= 70 ? 'bg-red-500' :
              analysisResult.riskScore >= 40 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}></div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-[#F7F7F7] rounded-lg p-1">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'bg-white text-[#2C3E50] shadow-sm'
              : 'text-[#2C3E50]/60 hover:text-[#2C3E50]'
          }`}
        >
          🚨 Alertas ({getRedFlags().length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-white text-[#2C3E50] shadow-sm'
              : 'text-[#2C3E50]/60 hover:text-[#2C3E50]'
          }`}
        >
          NOTES: Plantillas ({getExamTemplates().length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'accepted'
              ? 'bg-white text-[#2C3E50] shadow-sm'
              : 'text-[#2C3E50]/60 hover:text-[#2C3E50]'
          }`}
        >
          SUCCESS: Aceptadas ({acceptedSuggestions.length})
        </button>
      </div>

      {/* Contenido de Tabs */}
      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
        
        {/* Tab: Alertas */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {getRedFlags().length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#2C3E50]/60">No se detectaron alertas críticas</p>
              </div>
            ) : (
              getRedFlags().map((suggestion) => {
                const redFlag = suggestion.data as RedFlag;
                return (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      redFlag.severity === 'CRITICAL' ? 'border-red-500 bg-red-50' :
                      redFlag.severity === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                      redFlag.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getSeverityIcon(redFlag.severity)}</span>
                          <h4 className="font-semibold text-[#2C3E50] text-sm">{redFlag.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getSeverityColor(redFlag.severity)}`}>
                            {redFlag.severity}
                          </span>
                        </div>
                        <p className="text-sm text-[#2C3E50]/80 mb-3">{redFlag.description}</p>
                        <div className="bg-white/60 p-3 rounded-md mb-3">
                          <h5 className="font-medium text-[#2C3E50] text-xs mb-1">Recomendación:</h5>
                          <p className="text-xs text-[#2C3E50]/70">{redFlag.recommendation}</p>
                        </div>
                        {redFlag.relatedEntities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {redFlag.relatedEntities.map((entity, index) => (
                              <span key={index} className="px-2 py-1 bg-[#2C3E50]/10 text-[#2C3E50] rounded text-xs">
                                {entity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        className="flex-1 bg-[#5DA5A3] text-white py-2 px-3 rounded-md text-xs font-medium hover:bg-[#4A8280] transition-colors"
                      >
                        ✓ Revisar
                      </button>
                      <button
                        onClick={() => handleDismissSuggestion(suggestion)}
                        className="flex-1 bg-[#BDC3C7] text-[#2C3E50] py-2 px-3 rounded-md text-xs font-medium hover:bg-[#A8B2B8] transition-colors"
                      >
                        ✗ Descartar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Plantillas */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            {getExamTemplates().length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm text-[#2C3E50]/60">No hay plantillas de examen sugeridas</p>
              </div>
            ) : (
              getExamTemplates().map((suggestion) => {
                const template = suggestion.data as ExamTemplate;
                return (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-lg border-2 ${getPriorityColor(template.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">NOTES:</span>
                          <h4 className="font-semibold text-[#2C3E50] text-sm">{template.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                            template.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {template.priority}
                          </span>
                        </div>
                        <p className="text-sm text-[#2C3E50]/80 mb-2">{template.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-[#2C3E50]/60">
                          <span>TIME: {template.estimatedTime} min</span>
                          <span>TARGET: {template.tests.length} pruebas</span>
                          <span>STATS: {Math.floor(template.confidence * 100)}% confianza</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        className="flex-1 bg-[#5DA5A3] text-white py-2 px-3 rounded-md text-xs font-medium hover:bg-[#4A8280] transition-colors"
                      >
                        ✓ Usar Plantilla
                      </button>
                      <button
                        onClick={() => handleDismissSuggestion(suggestion)}
                        className="flex-1 bg-[#BDC3C7] text-[#2C3E50] py-2 px-3 rounded-md text-xs font-medium hover:bg-[#A8B2B8] transition-colors"
                      >
                        ✗ No Usar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Aceptadas */}
        {activeTab === 'accepted' && (
          <div className="space-y-3">
            {acceptedSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-sm text-[#2C3E50]/60">No hay sugerencias aceptadas aún</p>
              </div>
            ) : (
              acceptedSuggestions.map((suggestion) => {
                if (suggestion.type === 'EXAM_TEMPLATE') {
                  const template = suggestion.data as ExamTemplate;
                  const isExpanded = expandedTemplate === suggestion.id;
                  const completedTests = template.tests.filter(test => test.isCompleted).length;
                  const totalTests = template.tests.length;
                  const progress = (completedTests / totalTests) * 100;

                  return (
                    <div key={suggestion.id} className="p-4 rounded-lg border border-[#5DA5A3] bg-[#5DA5A3]/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">SUCCESS:</span>
                          <h4 className="font-semibold text-[#2C3E50] text-sm">{template.title}</h4>
                        </div>
                        <button
                          onClick={() => setExpandedTemplate(isExpanded ? null : suggestion.id)}
                          className="text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
                        >
                          <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#2C3E50]/60 mb-1">
                          <span>Progreso: {completedTests}/{totalTests} pruebas</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-[#BDC3C7]/30 rounded-full h-2">
                          <div 
                            className="bg-[#5DA5A3] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Lista de Pruebas (Expandible) */}
                      {isExpanded && (
                        <div className="space-y-2">
                          {template.tests.map((test) => (
                            <TestItem
                              key={test.id}
                              test={test}
                              onComplete={(result, notes) => handleTestComplete(template.id, test.id, result, notes)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div key={suggestion.id} className="p-3 rounded-lg border border-[#A8E6CF] bg-[#A8E6CF]/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">SUCCESS:</span>
                        <span className="text-sm font-medium text-[#2C3E50]">{suggestion.title}</span>
                        <span className="text-xs text-[#2C3E50]/60">
                          Aceptada {new Date(suggestion.acceptedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TestItemProps {
  test: ExamTest;
  onComplete: (result: string, notes?: string) => void;
}

const TestItem: React.FC<TestItemProps> = ({ test, onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [result, setResult] = useState(test.result || '');
  const [notes, setNotes] = useState(test.notes || '');

  const handleComplete = () => {
    if (result.trim()) {
      onComplete(result, notes);
      setIsCompleting(false);
    }
  };

  return (
    <div className={`p-3 rounded-md border ${
      test.isCompleted 
        ? 'border-green-300 bg-green-50' 
        : 'border-[#BDC3C7]/30 bg-white'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-sm ${test.isCompleted ? 'text-green-600' : 'text-[#2C3E50]'}`}>
              {test.isCompleted ? 'SUCCESS:' : '⭕'}
            </span>
            <h5 className="font-medium text-[#2C3E50] text-sm">{test.name}</h5>
            <span className="px-2 py-1 bg-[#A8E6CF]/20 text-[#2C3E50] rounded text-xs">
              {test.type}
            </span>
          </div>
          <p className="text-xs text-[#2C3E50]/70 mb-2">{test.description}</p>
          <p className="text-xs text-[#5DA5A3] font-medium mb-2">
            NOTES: {test.instructions}
          </p>
          {test.normalRange && (
            <p className="text-xs text-[#2C3E50]/60 mb-2">
              STATS: Rango normal: {test.normalRange}
            </p>
          )}

          {test.isCompleted ? (
            <div className="bg-green-100 p-2 rounded text-xs">
              <div className="font-medium text-green-800">Resultado: {test.result}</div>
              {test.notes && <div className="text-green-700 mt-1">Notas: {test.notes}</div>}
            </div>
          ) : isCompleting ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Resultado de la prueba..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5DA5A3]/30"
              />
              <textarea
                placeholder="Notas adicionales (opcional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5DA5A3]/30"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleComplete}
                  disabled={!result.trim()}
                  className="flex-1 bg-[#5DA5A3] text-white py-1 px-3 rounded text-xs font-medium hover:bg-[#4A8280] transition-colors disabled:opacity-50"
                >
                  ✓ Completar
                </button>
                <button
                  onClick={() => setIsCompleting(false)}
                  className="flex-1 bg-[#BDC3C7] text-[#2C3E50] py-1 px-3 rounded text-xs font-medium hover:bg-[#A8B2B8] transition-colors"
                >
                  ✗ Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCompleting(true)}
              className="bg-[#5DA5A3] text-white py-1 px-3 rounded text-xs font-medium hover:bg-[#4A8280] transition-colors"
            >
              📝 Realizar Prueba
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalAssistantPanel;
