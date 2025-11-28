import React, { useState, useEffect } from 'react';

import { FirestoreAuditLogger, AuditEvent } from '../../../core/audit/FirestoreAuditLogger';
import { useUser } from '../../../core/auth/UserContext';

interface AuditLogViewerProps {
  className?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ className = '' }) => {
  const { user, hasRole } = useUser();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    userId: '',
    patientId: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  const loadLogs = async () => {
    if (!user || !hasRole(['ADMIN', 'OWNER'])) {
      setError('Acceso denegado: Se requieren permisos de administrador');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const events = await FirestoreAuditLogger.getEvents({
        userId: filters.userId || undefined,
        patientId: filters.patientId || undefined,
        type: filters.type || undefined,
        limit: 100
      });
      setLogs(events);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    if (!user || !hasRole(['ADMIN', 'OWNER'])) {
      setError('Acceso denegado: Se requieren permisos de administrador');
      return;
    }

    try {
      const allLogs = await FirestoreAuditLogger.exportAllLogs();
      const csvContent = generateCSV(allLogs);
      downloadCSV(csvContent, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const generateCSV = (events: AuditEvent[]): string => {
    const headers = ['ID', 'Tipo', 'Usuario', 'Rol', 'Paciente', 'Visita', 'Timestamp', 'Metadatos'];
    const rows = events.map(event => [
      event.id || '',
      event.type,
      event.userId,
      event.userRole,
      event.patientId || '',
      event.visitId || '',
      event.timestamp.toISOString(),
      JSON.stringify(event.metadata || {})
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const getEventTypeColor = (type: string): string => {
    if (type.includes('login')) return 'text-green-600';
    if (type.includes('logout')) return 'text-red-600';
    if (type.includes('patient')) return 'text-blue-600';
    if (type.includes('visit')) return 'text-purple-600';
    if (type.includes('edit')) return 'text-orange-600';
    if (type.includes('export')) return 'text-indigo-600';
    return 'text-gray-600';
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (!user || !hasRole(['ADMIN', 'OWNER'])) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Acceso Denegado</h3>
        <p className="text-red-600">Se requieren permisos de administrador para acceder a los logs de auditoría.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Logs de Auditoría</h2>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="ID de Usuario"
            value={filters.userId}
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="ID de Paciente"
            value={filters.patientId}
            onChange={(e) => setFilters(prev => ({ ...prev, patientId: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los tipos</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="patient">Acceso a Paciente</option>
            <option value="visit">Acceso a Visita</option>
            <option value="edit">Edición de Datos</option>
            <option value="export">Exportación</option>
          </select>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Cargando...' : 'Aplicar Filtros'}
        </button>
      </div>

      {/* Lista de logs */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron logs de auditoría
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-semibold ${getEventTypeColor(log.type)}`}>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {log.timestamp.toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Usuario:</span> {log.userId} ({log.userRole})
                  </div>
                  {log.patientId && (
                    <div>
                      <span className="font-medium">Paciente:</span> {log.patientId}
                    </div>
                  )}
                  {log.visitId && (
                    <div>
                      <span className="font-medium">Visita:</span> {log.visitId}
                    </div>
                  )}
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                        Ver metadatos
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 