import React, { useState } from 'react';
import { TranscriptionSegment, audioCaptureService } from '@/core/audio/AudioCaptureService';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/core/audit/AuditLogger';

interface AudioReviewChecklistProps {
  transcription: TranscriptionSegment[];
  visitId: string;
  userId: string;
  onApproveSegment: (content: string) => void;
  onClose: () => void;
}

/**
 * Componente para revisar y aprobar/rechazar segmentos de transcripción
 */
const AudioReviewChecklist: React.FC<AudioReviewChecklistProps> = ({
  transcription,
  visitId,
  userId,
  onApproveSegment,
  onClose
}) => {
  const [segments, setSegments] = useState<TranscriptionSegment[]>(transcription);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [approvedCount, setApprovedCount] = useState(0);
  
  // Manejar la edición de un segmento
  const handleEdit = (segment: TranscriptionSegment) => {
    setEditingId(segment.id);
    setEditContent(segment.content);
  };
  
  // Guardar los cambios de edición
  const handleSaveEdit = (segmentId: string) => {
    setSegments(prev => 
      prev.map(s => 
        s.id === segmentId 
          ? { ...s, content: editContent, edited: true } 
          : s
      )
    );
    setEditingId(null);
  };
  
  // Cancelar la edición en curso
  const handleCancelEdit = () => {
    setEditingId(null);
  };
  
  // Aprobar un segmento
  const handleApprove = (segment: TranscriptionSegment) => {
    // Actualizar el estado del segmento
    setSegments(prev => 
      prev.map(s => 
        s.id === segment.id 
          ? { ...s, approved: true } 
          : s
      )
    );
    
    // Incrementar contador de aprobados
    setApprovedCount(prev => prev + 1);
    
    // Insertar en el EMR
    onApproveSegment(segment.content);
    
    // Registrar evento en el log de auditoría
    AuditLogger.log('audio.validated', {
      userId,
      visitId,
      patientId: 'unknown',
      segmentId: segment.id,
      actor: segment.actor,
      content: segment.content,
      edited: segment.edited || false
    });
    
    // Registrar métrica
    trackMetric(
      'suggestions_accepted',
      {
        suggestionId: segment.id,
        suggestionType: 'recommendation',
        suggestionField: 'audio'
      },
      userId,
      visitId
    );
  };
  
  // Rechazar un segmento
  const handleReject = (segmentId: string) => {
    setSegments(prev => 
      prev.map(s => 
        s.id === segmentId 
          ? { ...s, approved: false } 
          : s
      )
    );
  };
  
  // Generar y aprobar resumen completo
  const handleApproveAll = () => {
    const approvedSegments = segments.filter(s => s.approved);
    if (approvedSegments.length === 0) return;
    
    const content = audioCaptureService.generateClinicalContent(approvedSegments);
    
    // Enviar el contenido estructurado al EMR
    onApproveSegment(content);
    
    // Registrar en auditoría
    AuditLogger.log('audio.summary.integrated', {
      userId,
      visitId,
      patientId: 'unknown',
      segmentsCount: approvedSegments.length,
      contentLength: content.length
    });
    
    // Cerrar el checklist
    onClose();
  };
  
  // Obtener el color de fondo según el tipo de actor
  const getActorBgColor = (actor: string): string => {
    switch (actor) {
      case 'profesional':
        return 'bg-blue-50 border-blue-100';
      case 'paciente':
        return 'bg-green-50 border-green-100';
      case 'acompañante':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };
  
  // Obtener el color de texto según el tipo de actor
  const getActorTextColor = (actor: string): string => {
    switch (actor) {
      case 'profesional':
        return 'text-blue-800';
      case 'paciente':
        return 'text-green-800';
      case 'acompañante':
        return 'text-purple-800';
      default:
        return 'text-gray-800';
    }
  };
  
  // Obtener el label para el tipo de actor
  const getActorLabel = (actor: string): string => {
    switch (actor) {
      case 'profesional':
        return 'Profesional';
      case 'paciente':
        return 'Paciente';
      case 'acompañante':
        return 'Acompañante';
      default:
        return 'Desconocido';
    }
  };
  
  // Obtener el color y el texto según el nivel de confianza
  const getConfidenceInfo = (confidence: string): { color: string; text: string } => {
    switch (confidence) {
      case 'entendido':
        return { color: 'text-green-600', text: 'Alta confianza' };
      case 'poco_claro':
        return { color: 'text-yellow-600', text: 'Confianza media' };
      case 'no_reconocido':
        return { color: 'text-red-600', text: 'Baja confianza' };
      default:
        return { color: 'text-gray-600', text: 'Desconocido' };
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">
          Revisión de Transcripción
        </h3>
        <div className="text-sm text-gray-500">
          {approvedCount} de {segments.length} segmentos aprobados
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Revise y edite cada segmento antes de aprobarlo para su incorporación al EMR. 
        Los segmentos con baja confianza requieren especial atención.
      </p>
      
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto p-2">
        {segments.map(segment => {
          const confidenceInfo = getConfidenceInfo(segment.confidence);
          const isEditing = editingId === segment.id;
          
          return (
            <div
              key={segment.id}
              className={`p-4 border rounded-md ${getActorBgColor(segment.actor)} ${
                segment.approved !== undefined
                  ? segment.approved
                    ? 'ring-2 ring-green-400'
                    : 'opacity-50'
                  : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getActorBgColor(segment.actor)} ${getActorTextColor(segment.actor)}`}>
                    {getActorLabel(segment.actor)}
                  </span>
                  <span className={`ml-2 text-xs ${confidenceInfo.color}`}>
                    {confidenceInfo.text}
                  </span>
                </div>
                
                {segment.approved === undefined && (
                  <div className="flex space-x-2">
                    {!isEditing && (
                      <button
                        onClick={() => handleEdit(segment)}
                        className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                      >
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Editar
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Editar transcripción..."
                    aria-label="Editar transcripción"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(segment.id)}
                      className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className={`text-sm ${segment.confidence === 'no_reconocido' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    {segment.content}
                  </p>
                  
                  {segment.approved === undefined && (
                    <div className="flex justify-end space-x-2 mt-3">
                      <button
                        onClick={() => handleReject(segment.id)}
                        className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(segment)}
                        className="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700"
                      >
                        Aprobar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        
        <button
          onClick={handleApproveAll}
          disabled={approvedCount === 0}
          className={`px-4 py-2 text-white rounded-md ${
            approvedCount > 0
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Generar Resumen e Integrar
        </button>
      </div>
    </div>
  );
};

export default AudioReviewChecklist; 