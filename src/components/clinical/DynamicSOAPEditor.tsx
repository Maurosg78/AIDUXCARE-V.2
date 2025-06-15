/**
 * 🏥 DYNAMIC SOAP EDITOR - SOAP EDITABLE Y DINÁMICO
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
}

interface SOAPSuggestion {
  id: string;
  text: string;
  source: 'ASSISTANT' | 'TEMPLATE' | 'RED_FLAG';
  isApplied: boolean;
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
}

const DynamicSOAPEditor: React.FC<DynamicSOAPEditorProps> = ({
  initialSOAP,
  acceptedSuggestions,
  completedTests,
  onSOAPChange,
  onSuggestionApplied,
  isReadOnly = false
}) => {

  const [soapSections, setSOAPSections] = useState<SOAPSection[]>([
    {
      id: 'subjective',
      type: 'S',
      title: 'Subjetivo (S)',
      content: initialSOAP?.subjective || '',
      suggestions: [],
      isEditing: false
    },
    {
      id: 'objective',
      type: 'O',
      title: 'Objetivo (O)',
      content: initialSOAP?.objective || '',
      suggestions: [],
      isEditing: false
    },
    {
      id: 'assessment',
      type: 'A',
      title: 'Evaluación (A)',
      content: initialSOAP?.assessment || '',
      suggestions: [],
      isEditing: false
    },
    {
      id: 'plan',
      type: 'P',
      title: 'Plan (P)',
      content: initialSOAP?.plan || '',
      suggestions: [],
      isEditing: false
    }
  ]);

  const [pendingSuggestions, setPendingSuggestions] = useState<SOAPSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
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

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-[#2C3E50]">Nota SOAP Dinámica</h3>
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
                </div>
                
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
          </div>
          <div className="text-right">
            <span>Última actualización: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicSOAPEditor;
