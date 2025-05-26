import React, { useState } from 'react';
import { AuditLogEntry, MCPUpdateAuditEntry, SuggestionIntegrationAuditEntry } from '@/core/audit/AuditLogger';

interface AuditLogViewerProps {
  visitId: string;
  logs?: AuditLogEntry[];
  fromSupabase?: boolean;
}

interface LogDetails {
  visit_id?: string;
  patient_id?: string;
  blocks_count?: number;
  suggestions_count?: number;
  description?: string;
  content?: string;
  section?: string;
  block_type?: string;
  block_content?: string;
  suggestion_content?: string;
  emr_section?: string;
}

/**
 * Verifica si una entrada de log es del tipo MCPUpdateAuditEntry
 */
const isMCPUpdateEntry = (log: AuditLogEntry): log is AuditLogEntry & { event_type: 'mcp.block.update' } => {
  return log.event_type === 'mcp.block.update';
};

/**
 * Verifica si una entrada de log es del tipo SuggestionIntegrationAuditEntry
 */
const isSuggestionIntegrationEntry = (log: AuditLogEntry): log is AuditLogEntry & { event_type: 'suggestion.integrated' } => {
  return log.event_type === 'suggestion.integrated';
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ visitId, logs = [], fromSupabase = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Usar logs de Supabase o los proporcionados vía props
  const allLogs: AuditLogEntry[] = logs;

  // Filtrar solo los logs relacionados con esta visita
  const filteredLogs = allLogs.filter((log: AuditLogEntry) => {
    if (isMCPUpdateEntry(log)) {
      return log.visit_id === visitId;
    }
    if (isSuggestionIntegrationEntry(log)) {
      return log.visit_id === visitId;
    }
    return log.details?.visit_id === visitId;
  });

  // Función para formatear la fecha y hora
  const formatDateTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Función para truncar el contenido a un máximo de caracteres
  const truncateContent = (content: string, maxLength = 200): string => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  // Función para mapear el tipo de bloque a un texto más amigable
  const getBlockTypeText = (type: string): string => {
    switch (type) {
      case 'contextual':
        return 'Memoria Contextual';
      case 'persistent':
        return 'Memoria Persistente';
      case 'semantic':
        return 'Memoria Semántica';
      default:
        return type;
    }
  };

  // Obtener la descripción del tipo de evento
  const getEventTypeDescription = (log: AuditLogEntry): string => {
    switch (log.event_type) {
      case 'mcp.block.update':
        return 'Actualización MCP';
      case 'suggestion.integrated':
        return 'Integración de Sugerencia';
      case 'audio.integrated':
        return 'Integración de Audio';
      case 'audio.validated':
        return 'Validación de Audio';
      case 'form.update':
        return 'Actualización de Formulario';
      case 'visit.loaded':
        return 'Visita Cargada';
      case 'ai.suggestion':
        return 'Sugerencia IA Generada';
      case 'visit.create':
        return 'Creación de Visita';
      case 'patient.create':
        return 'Creación de Paciente';
      case 'audio.transcription':
        return 'Transcripción de Audio';
      case 'audio.summary.integrated':
        return 'Resumen de Audio Integrado';
      default:
        return log.event_type || 'Evento Desconocido';
    }
  };

  // Obtener el color para la fuente de acción
  const getSourceBadge = (source: string): { color: string; label: string } => {
    switch (source) {
      case 'ia':
        return { color: 'bg-blue-100 text-blue-800', label: 'IA' };
      case 'audio':
        return { color: 'bg-purple-100 text-purple-800', label: 'Audio' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Manual' };
    }
  };

  // Función para renderizar los detalles del log
  const renderLogDetails = (log: AuditLogEntry) => {
    if (isMCPUpdateEntry(log)) {
      const details = log.details as LogDetails;
      return (
        <div className="mt-2 text-sm">
          <p className="text-gray-600">
            <span className="font-medium">Tipo de Bloque:</span> {getBlockTypeText(details.block_type || '')}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Contenido:</span> {truncateContent(details.block_content || '')}
          </p>
        </div>
      );
    }

    if (isSuggestionIntegrationEntry(log)) {
      const details = log.details as LogDetails;
      return (
        <div className="mt-2 text-sm">
          <p className="text-gray-600">
            <span className="font-medium">Sección:</span> {details.emr_section || ''}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Contenido:</span> {truncateContent(details.suggestion_content || '')}
          </p>
        </div>
      );
    }

    if (!log.details) {
      return null;
    }

    const details: LogDetails = log.details;
    return (
      <div className="mt-2 text-sm">
        {typeof details.description === 'string' ? (
          <p className="text-gray-600">{details.description}</p>
        ) : (
          <pre className="text-xs overflow-auto max-h-24 bg-gray-50 p-2 rounded">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 border rounded-md border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          Historial de Actividad Clínica {fromSupabase ? '(Supabase)' : '(Local)'}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
          data-testid="toggle-audit-logs"
        >
          {isExpanded ? 'Ocultar historial' : 'Mostrar historial'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">No hay registros de actividad para mostrar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div 
                  key={`${log.event_type}-${log.timestamp}-${index}`}
                  className="border rounded-md p-3 hover:bg-gray-50"
                  data-testid={`audit-log-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getEventTypeDescription(log)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSourceBadge(log.source || 'manual').color}`}>
                        {getSourceBadge(log.source || 'manual').label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  {renderLogDetails(log)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

AuditLogViewer.displayName = 'AuditLogViewer';

export default AuditLogViewer; 