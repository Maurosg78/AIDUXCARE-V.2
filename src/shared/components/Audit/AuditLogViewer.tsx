import React, { useState } from 'react';
import { AuditLogEntry } from '@/core/mcp/AuditLogger';

interface AuditLogViewerProps {
  visitId: string;
  logs: AuditLogEntry[];
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ visitId, logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtrar solo los logs relacionados con esta visita
  const filteredLogs = logs.filter(log => log.visit_id === visitId);

  if (filteredLogs.length === 0) {
    return null;
  }

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

  return (
    <div className="mt-8 border rounded-md border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          Historial de Auditoría MCP
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Bloque
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contenido Anterior
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contenido Nuevo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <tr key={`${log.block_id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getBlockTypeText(log.block_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="max-w-md overflow-hidden text-ellipsis">
                        {truncateContent(log.old_content)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="max-w-md overflow-hidden text-ellipsis">
                        {truncateContent(log.new_content)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">
              Total de registros: {filteredLogs.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer; 