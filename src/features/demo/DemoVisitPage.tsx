import { vi } from "vitest";
import React, { useState, useEffect } from 'react';
import AudioListener from '@/shared/components/Audio/AudioListener';
import AudioReviewChecklist from '@/shared/components/Audio/AudioReviewChecklist';
import AgentSuggestionsViewer from '@/shared/components/Agent/AgentSuggestionsViewer';
import AgentUsageDashboard from '@/shared/components/Agent/AgentUsageDashboard';
import MCPContextViewer from '@/shared/components/MCP/MCPContextViewer';
import AuditLogViewer from '@/shared/components/Audit/AuditLogViewer';
import { TranscriptionSegment } from '@/core/audio/AudioCaptureService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';
import {
  mockPatient,
  mockVisit,
  mockMCPContext,
  mockAgentSuggestions,
  mockTranscription,
  mockEMRData,
  mockUserId
} from '@/core/demo/mockVisitData';
import { MCPContext } from '@/core/mcp/schema';
import { useParams } from 'react-router-dom';
import { AgentSuggestion } from '@/types/agent';
import { runClinicalAgent } from '@/core/agent/runClinicalAgent';

/**
 * Página de demostración integrada para AiDuxCare V.2
 * Muestra un flujo clínico completo con todos los módulos principales
 */
const DemoVisitPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionSegment[]>([]);
  const [emrContent, setEmrContent] = useState(mockEMRData);
  const [insertedContent, setInsertedContent] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!visitId) return;

      try {
        setIsLoading(true);
        setError(null);
        const suggestions = await runClinicalAgent(visitId);
        setSuggestions(suggestions);
      } catch (err) {
        setError('Error al cargar las sugerencias');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [visitId]);

  useEffect(() => {
    // Registrar carga de la página en auditoría
    AuditLogger.log('demo.page.loaded', {
      user_id: mockUserId,
      visit_id: mockVisit.id,
      timestamp: new Date().toISOString()
    });
    
    // Cargar los datos iniciales
    setTranscriptionData(mockTranscription);
    setEmrContent(mockEMRData);
    
    // Establecer documento de título
    document.title = `Consulta ${mockVisit.id} | AiduxCare`;
  }, []);

  const handleCaptureComplete = (transcription: TranscriptionSegment[]) => {
    setTranscriptionData(transcription);
    setShowTranscription(true);
    
    // Registrar en auditoría
    AuditLogger.log('audio.capture.completed', {
      user_id: mockUserId,
      visit_id: mockVisit.id,
      segments_count: transcription.length > 0 ? transcription.length : mockTranscription.length
    });
    
    // Registrar métrica
    trackMetric(
      'suggestions_generated',
      mockUserId,
      mockVisit.id,
      transcription.length > 0 ? transcription.length : mockTranscription.length,
      {
        segments_count: transcription.length > 0 ? transcription.length : mockTranscription.length
      }
    );
  };

  const handleApproveAudioSegment = (content: string) => {
    // Integrar contenido al EMR (demostración)
    setInsertedContent(prev => [...prev, content]);
    
    // Registrar en auditoría
    AuditLogger.log('audio.integrated', {
      user_id: mockUserId,
      visit_id: mockVisit.id,
      content_length: content.length,
      source: 'audio_transcription'
    });
    
    // Simular cierre de revisión después de unos segundos
    setTimeout(() => {
      setShowTranscription(false);
    }, 1500);
    
    // Registrar métrica
    trackMetric(
      'suggestions_accepted',
      mockUserId,
      mockVisit.id,
      1,
      {
        content_length: content.length,
        source: 'audio_transcription'
      }
    );
  };
  
  const handleCloseReview = () => {
    setShowTranscription(false);
    setTranscriptionData([]);
  };
  
  const handleIntegrateSuggestions = (count: number) => {
    // Registrar métrica
    trackMetric(
      'suggestions_integrated',
      mockUserId,
      mockVisit.id,
      count,
      {
        suggestions_count: count
      }
    );
  };
  
  const getTabStyle = (isActive: boolean) => {
    return `px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none ${
      isActive 
        ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' 
        : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200'
    }`;
  };

  const renderActiveTabPanel = () => {
    switch(activeTab) {
      case 0:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Métricas de Uso</h3>
            <AgentUsageDashboard visitId={mockVisit.id} />
            
            {/* Métricas adicionales */}
            <div className="mt-4 space-y-3">
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs uppercase text-gray-500 font-medium">Tiempo estimado ahorrado</p>
                <p className="text-2xl font-bold text-green-600">12 min</p>
              </div>
              
              <div className="border border-gray-200 rounded-md p-3">
                <p className="text-xs uppercase text-gray-500 font-medium">Precisión documentación</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-blue-600">94%</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Registro de Auditoría</h3>
            <AuditLogViewer visitId={mockVisit.id} />
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Contexto MCP</h3>
            <MCPContextViewer
              context={mockMCPContext as unknown as MCPContext}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!visitId) {
    return <div>ID de visita no proporcionado</div>;
  }

  if (isLoading) {
    return <div>Cargando sugerencias...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-md shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {mockPatient.name}, {mockPatient.age} años
            </h1>
            <p className="text-gray-600">ID: {mockPatient.id} • Seguro: {mockPatient.insuranceId}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-700">{mockVisit.type}</p>
            <p className="text-gray-600">
              {new Date(mockVisit.date).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-600">Dr(a): {mockVisit.provider}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <span className="px-2 py-1 bg-blue-100 rounded-md">
            Consulta {mockVisit.id}
          </span>
          <span className="px-2 py-1 bg-green-100 rounded-md text-green-600">
            {mockVisit.department}
          </span>
          <span className="px-2 py-1 bg-purple-100 rounded-md text-purple-600">
            {mockVisit.facility}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {!showTranscription && (
            <AudioListener onCaptureComplete={handleCaptureComplete} />
          )}
          
          {showTranscription && transcriptionData.length > 0 && (
            <AudioReviewChecklist 
              transcription={transcriptionData}
              visitId={mockVisit.id}
              userId={mockUserId}
              onApproveSegment={handleApproveAudioSegment}
              onClose={handleCloseReview}
            />
          )}
          
          <AgentSuggestionsViewer 
            visitId={mockVisit.id}
            suggestions={suggestions}
            onSuggestionAccepted={(suggestion) => {
              console.log('Sugerencia aceptada:', suggestion);
            }}
            onSuggestionRejected={(suggestion) => {
              console.log('Sugerencia rechazada:', suggestion);
            }}
            userId={mockUserId}
            patientId={mockPatient.id}
          />
          
          <div className="bg-white rounded-md shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Registro Médico Electrónico</h2>
            
            <div className="mb-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Subjetivo</h3>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md whitespace-pre-wrap text-sm">
                  {emrContent.subjective}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Objetivo</h3>
                <div className="p-3 bg-green-50 border border-green-100 rounded-md whitespace-pre-wrap text-sm">
                  {emrContent.objective}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Evaluación</h3>
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md whitespace-pre-wrap text-sm">
                  {emrContent.assessment}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Plan</h3>
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-md whitespace-pre-wrap text-sm">
                  {emrContent.plan}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Notas Adicionales</h3>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-md whitespace-pre-wrap text-sm">
                  {emrContent.notes}
                  
                  {/* Mostrar contenido insertado */}
                  {insertedContent.map((content, index) => (
                    <div key={`inserted-${index}`} className="mt-2 p-2 bg-blue-100 border-l-4 border-blue-500 rounded">
                      {content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white rounded-md shadow-sm">
            <div className="flex border-b border-gray-200">
              <button 
                className={getTabStyle(activeTab === 0)}
                onClick={() => setActiveTab(0)}
              >
                Métricas
              </button>
              <button 
                className={getTabStyle(activeTab === 1)}
                onClick={() => setActiveTab(1)}
              >
                Auditoría
              </button>
              <button 
                className={getTabStyle(activeTab === 2)}
                onClick={() => setActiveTab(2)}
              >
                Contexto MCP
              </button>
            </div>

            <div className="p-4">
              {renderActiveTabPanel()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DemoVisitPage.displayName = 'DemoVisitPage';

export default DemoVisitPage; 