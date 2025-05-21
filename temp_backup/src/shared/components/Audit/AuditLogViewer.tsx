import React, { useState, useEffect } from 'react';
import { AuditLogEntry, MCPUpdateAuditEntry, SuggestionIntegrationAuditEntry, AuditLogger } from '@/core/audit/AuditLogger';

interface AuditLogViewerProps {
  visitId: string;
  logs?: AuditLogEntry[];
  fromSupabase?: boolean;
}

/**
 * Verifica si una entrada de log es del tipo MCPUpdateAuditEntry
 */
const isMCPUpdateEntry = (log: AuditLogEntry): log is MCPUpdateAuditEntry => {
  return log.event_type === 'mcp.block.update';
};

/**
 * Verifica si una entrada de log es del tipo SuggestionIntegrationAuditEntry
 */
const isSuggestionIntegrationEntry = (log: AuditLogEntry): log is SuggestionIntegrationAuditEntry => {
  return log.event_type === 'suggestion.integrated';
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ visitId, logs = [], fromSupabase = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [supabaseLogs, setSupabaseLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar logs desde Supabase si es necesario
  useEffect(() => {
    const fetchLogsFromSupabase = async () => {
      if (!fromSupabase) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchedLogs = await AuditLogger.getAuditLogsFromSupabase(visitId);
        setSupabaseLogs(fetchedLogs);
      } catch (err) {
        console.error('Error fetching audit logs from Supabase:', err);
        setError('Error al cargar los logs de auditoría desde Supabase');
      } finally {
        setLoading(false);
      }
    };
    
    if (fromSupabase && isExpanded) {
      fetchLogsFromSupabase();
    }
  }, [fromSupabase, visitId, isExpanded]);

  // Usar logs de Supabase o los proporcionados vía props
  const allLogs = fromSupabase ? supabaseLogs : logs;

  // Filtrar solo los logs relacionados con esta visita
  const filteredLogs = allLogs.filter(log => 
    log.details && (
      (log.details.visit_id === visitId) || 
      (isMCPUpdateEntry(log) && log.visit_id === visitId) ||
      (isSuggestionIntegrationEntry(log) && log.visit_id === visitId) ||
      ('visit_id' in log && log.visit_id === visitId)
    )
  );

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
        return log.event_type;
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

  return (
    <div className="mt-8 border rounded-md border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          Historial de Actividad Clínica {fromSupabase ? '(Supabase)' : '(Local)'}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          {isExpanded ? 'Ocultar historial' : 'Mostrar historial'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Cargando logs de auditoría...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  if (fromSupabase) {
                    setLoading(true);
                    AuditLogger.getAuditLogsFromSupabase(visitId)
                      .then(setSupabaseLogs)
                      .catch(err => {
                        console.error('Error retrying logs fetch:', err);
                        setError('Error al cargar los logs. Intente nuevamente.');
                      })
                      .finally(() => setLoading(false));
                  }
                }}
                className="mt-2 px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">No hay logs de auditoría para esta visita.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fuente
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => {
                    const sourceBadge = getSourceBadge(log.source || 'manual');
                    
                    return (
                      <tr key={`log-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {log.user_id}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                          {getEventTypeDescription(log)}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${sourceBadge.color}`}>
                            {sourceBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {isMCPUpdateEntry(log) && (
                            <div>
                              <p><strong>Tipo de bloque:</strong> {getBlockTypeText(log.block_type || '')}</p>
                              <p><strong>Contenido anterior:</strong> {truncateContent(log.old_content || '')}</p>
                              <p><strong>Contenido nuevo:</strong> {truncateContent(log.new_content || '')}</p>
                            </div>
                          )}
                          {isSuggestionIntegrationEntry(log) && (
                            <div>
                              <p><strong>Tipo:</strong> {log.suggestion_type}</p>
                              <p><strong>Contenido:</strong> {truncateContent(log.suggestion_content || '')}</p>
                              <p><strong>Sección EMR:</strong> {log.emr_section}</p>
                            </div>
                          )}
                          {!isMCPUpdateEntry(log) && !isSuggestionIntegrationEntry(log) && (
                            <div>
                              {(log as any).details && typeof (log as any).details.description === 'string' ? (
                                <p>{(log as any).details.description}</p>
                              ) : (
                                <pre className="text-xs overflow-auto max-h-24">{JSON.stringify((log as any).details || {}, null, 2)}</pre>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">
              Total de registros: {filteredLogs.length}
            </p>
            {fromSupabase && (
              <button 
                onClick={() => {
                  setLoading(true);
                  AuditLogger.getAuditLogsFromSupabase(visitId)
                    .then(setSupabaseLogs)
                    .catch(err => {
                      console.error('Error refreshing logs:', err);
                      setError('Error al actualizar los logs.');
                    })
                    .finally(() => setLoading(false));
                }}
                className="ml-2 px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={loading}
              >
                Actualizar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer; 