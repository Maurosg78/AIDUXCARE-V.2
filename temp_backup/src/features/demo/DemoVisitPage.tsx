import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import AudioListener from '@/shared/components/Audio/AudioListener';
import AudioReviewChecklist from '@/shared/components/Audio/AudioReviewChecklist';
import AgentSuggestionsViewer from '@/shared/components/Agent/AgentSuggestionsViewer';
import AgentUsageDashboard from '@/shared/components/Agent/AgentUsageDashboard';
import MCPContextViewer from '@/shared/components/MCP/MCPContextViewer';
import AuditLogViewer from '@/shared/components/Audit/AuditLogViewer';
import { TranscriptionSegment } from '@/core/audio/AudioCaptureService';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { track } from '@/services/UsageAnalyticsService';
import {
  mockPatient,
  mockVisit,
  mockMCPContext,
  mockAgentSuggestions,
  mockTranscription,
  mockEMRData,
  mockUserId
} from '@/core/demo/mockVisitData';

/**
 * Página de demostración integrada para AiDuxCare V.2
 * Muestra un flujo clínico completo con todos los módulos principales
 */
const DemoVisitPage: React.FC = () => {
  // Estados para la página
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionSegment[]>([]);
  const [emrContent, setEmrContent] = useState(mockEMRData);
  const [insertedContent, setInsertedContent] = useState<string[]>([]);
  
  // Inicializar logs de auditoría simulados
  useEffect(() => {
    // En una implementación real tendríamos métodos para limpiar y añadir logs de prueba
    // Aquí simulamos que los logs ya están cargados desde mockAuditLogs
    
    // Para la demo, registramos un evento inicial
    AuditLogger.log('demo.page.loaded', mockUserId, {
      visit_id: mockVisit.id,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Manejar la captura de audio completada
  const handleCaptureComplete = (transcription: TranscriptionSegment[]) => {
    setTranscriptionData(transcription.length > 0 ? transcription : mockTranscription);
    setShowTranscription(true);
    
    // Registrar evento de audio
    AuditLogger.log('audio.capture.completed', mockUserId, {
      visit_id: mockVisit.id,
      segments_count: transcription.length > 0 ? transcription.length : mockTranscription.length
    });
    
    // Registrar métrica
    track('suggestions_generated', mockUserId, mockVisit.id, 
      transcription.length > 0 ? transcription.length : mockTranscription.length);
  };

  // Manejar la aprobación de segmentos de audio
  const handleApproveAudioSegment = (content: string) => {
    // Añadir el contenido aprobado al EMR (sección notas)
    const newEmrContent = { ...emrContent };
    newEmrContent.notes = `${newEmrContent.notes}\n\n${content}`;
    setEmrContent(newEmrContent);
    
    // Añadir a la lista de contenido insertado
    setInsertedContent(prev => [...prev, content]);
    
    // Registrar evento de auditoría
    AuditLogger.log('audio.integrated', mockUserId, {
      visit_id: mockVisit.id,
      content_length: content.length,
      source: 'audio_transcription'
    });
    
    // Registrar métrica
    track('suggestions_accepted', mockUserId, mockVisit.id, 1);
  };
  
  // Manejar el cierre del checklist de revisión
  const handleCloseReview = () => {
    setShowTranscription(false);
    setTranscriptionData([]);
  };
  
  // Manejar la integración de sugerencias
  const handleIntegrateSuggestions = (count: number) => {
    // Registrar métrica
    track('suggestions_integrated', mockUserId, mockVisit.id, count);
  };
  
  // Estilo para cada pestaña
  const getTabStyle = (selected: boolean) => {
    return `px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none ${
      selected 
        ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' 
        : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200'
    }`;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Encabezado con información del paciente y visita */}
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
        {/* Panel principal (2/3 del ancho) */}
        <div className="md:col-span-2 space-y-6">
          {/* Componente de escucha activa */}
          {!showTranscription && (
            <AudioListener onCaptureComplete={handleCaptureComplete} />
          )}
          
          {/* Componente de revisión de transcripción */}
          {showTranscription && transcriptionData.length > 0 && (
            <AudioReviewChecklist 
              transcription={transcriptionData}
              visitId={mockVisit.id}
              userId={mockUserId}
              onApproveSegment={handleApproveAudioSegment}
              onClose={handleCloseReview}
            />
          )}
          
          {/* Sugerencias del agente */}
          <AgentSuggestionsViewer 
            visitId={mockVisit.id}
            suggestions={mockAgentSuggestions}
            onIntegrateSuggestions={handleIntegrateSuggestions}
            userId={mockUserId}
            patientId={mockPatient.id}
          />
          
          {/* EMR editable */}
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
        
        {/* Panel lateral (1/3 del ancho) */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-md shadow-sm">
            <Tab.Group>
              <Tab.List className="flex border-b border-gray-200">
                <Tab className={({ selected }: { selected: boolean }) => getTabStyle(selected)}>
                  Métricas
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => getTabStyle(selected)}>
                  Auditoría
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => getTabStyle(selected)}>
                  Contexto MCP
                </Tab>
              </Tab.List>
              <Tab.Panels className="p-4">
                {/* Panel de métricas */}
                <Tab.Panel>
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
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">85%</span>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
                
                {/* Panel de auditoría */}
                <Tab.Panel>
                  <h3 className="text-lg font-medium mb-4">Registro de Auditoría</h3>
                  <AuditLogViewer 
                    visitId={mockVisit.id} 
                    logs={AuditLogger.getAuditLogs()}
                  />
                </Tab.Panel>
                
                {/* Panel de contexto MCP */}
                <Tab.Panel>
                  <h3 className="text-lg font-medium mb-4">Contexto MCP</h3>
                  <div className="max-h-[50vh] overflow-y-auto">
                    <MCPContextViewer context={mockMCPContext} />
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoVisitPage; 