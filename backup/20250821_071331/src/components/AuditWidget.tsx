import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  timestamp: Timestamp;
  status: 'success' | 'error';
  details?: Record<string, unknown>;
  error?: string;
}

interface AuditWidgetProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AuditWidget: React.FC<AuditWidgetProps> = ({ isVisible, onClose }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    action: '',
    status: '',
    dateRange: '24h' as '24h' | '7d' | '30d'
  });

  useEffect(() => {
    if (isVisible && user) {
      fetchAuditLogs();
    }
  }, [isVisible, user, filter]);

  const fetchAuditLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const db = getFirestore();
      
      // Calcular rango de fechas
      const now = new Date();
                        const startDate = new Date();
      
      switch (filter.dateRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Construir query
      let q = query(
        collection(db, 'audit_logs'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      if (filter.action) {
        q = query(q, where('action', '==', filter.action));
      }

      if (filter.status) {
        q = query(q, where('status', '==', filter.status));
      }

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLogEntry[];

      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'assistant_query':
        return 'IA';
      case 'assistant_data_lookup':
        return 'SEARCH';
      case 'create_patient':
        return 'PATIENT';
      case 'create_appointment':
        return 'APPOINTMENT';
      case 'create_note':
        return 'NOTE';
      default:
        return 'INFO';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-soft max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Widget de Auditoría</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex gap-4 items-center">
            <div>
              <label htmlFor="action-filter" className="block text-sm font-medium text-slate-700 mb-1">Acción</label>
              <select
                id="action-filter"
                value={filter.action}
                onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500"
              >
                <option value="">Todas las acciones</option>
                <option value="assistant_query">Consulta IA</option>
                <option value="assistant_data_lookup">Búsqueda de datos</option>
                <option value="create_patient">Crear paciente</option>
                <option value="create_appointment">Crear cita</option>
                <option value="create_note">Crear nota</option>
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                id="status-filter"
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500"
              >
                <option value="">Todos los estados</option>
                <option value="success">Éxito</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label htmlFor="date-range-filter" className="block text-sm font-medium text-slate-700 mb-1">Rango</label>
              <select
                id="date-range-filter"
                value={filter.dateRange}
                onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as '24h' | '7d' | '30d' }))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500"
              >
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>

            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="px-4 py-2 bg-brand-in-500 text-white rounded-lg hover:bg-brand-in-600 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-in-500 mx-auto"></div>
              <p className="mt-2 text-slate-500">Cargando logs de auditoría...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No se encontraron logs de auditoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getActionIcon(log.action)}</span>
                      <div>
                        <h4 className="font-medium text-slate-900">{log.action}</h4>
                        <p className="text-sm text-slate-500">Usuario: {log.userId}</p>
                        <p className="text-sm text-slate-500">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium ${getStatusColor(log.status)}`}>
                      {log.status === 'success' ? '✅' : '❌'}
                    </span>
                  </div>
                  
                  {log.details && (
                    <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                      <p className="text-sm text-slate-700">
                        <strong>Detalles:</strong> {JSON.stringify(log.details, null, 2)}
                      </p>
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {log.error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Mostrando {logs.length} logs de auditoría
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
