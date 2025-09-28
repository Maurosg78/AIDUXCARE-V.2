// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { useUser } from '../../core/auth/UserContext';
import { AuditPerformanceOptimizer } from '../../core/audit/AuditPerformanceOptimizer';

interface AuditMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByHour: Record<string, number>;
  topPatients: Array<{ patientId: string; accessCount: number }>;
}

interface CriticalEvents {
  failedLogins: number;
  unauthorizedAccess: number;
  dataExports: number;
  logoutEvents: number;
  patientDataAccess: number;
  visitDataAccess: number;
  suspiciousActivity: string[];
}

export const AuditMetricsDashboard: React.FC = () => {
  const { user, hasRole } = useUser();
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [criticalEvents, setCriticalEvents] = useState<CriticalEvents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadMetrics = async () => {
    if (!user || !hasRole(['ADMIN', 'OWNER'])) {
      setError('Acceso denegado: Se requieren permisos de administrador');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [metricsData, criticalData] = await Promise.all([
        AuditPerformanceOptimizer.generateAuditMetrics(),
        AuditPerformanceOptimizer.detectCriticalEvents()
      ]);
      
      setMetrics(metricsData);
      setCriticalEvents(criticalData);
      setLastUpdate(new Date());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [user]);

  if (!user || !hasRole(['ADMIN', 'OWNER'])) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600">Se requieren permisos de administrador para acceder a este dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Métricas de Auditoría</h1>
              <p className="mt-2 text-gray-600">
                Métricas en tiempo real del sistema de auditoría enterprise
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </p>
              <button
                onClick={loadMetrics}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading && !metrics ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Métricas Generales */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Generales</h3>
                
                {metrics && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{metrics.totalEvents}</div>
                      <div className="text-sm text-blue-700">Total de Eventos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {Object.keys(metrics.eventsByType).length}
                      </div>
                      <div className="text-sm text-green-700">Tipos de Eventos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {Object.keys(metrics.eventsByUser).length}
                      </div>
                      <div className="text-sm text-purple-700">Usuarios Activos</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Eventos Críticos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos Críticos (Últimas 24h)</h3>
                
                {criticalEvents && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{criticalEvents.failedLogins}</div>
                      <div className="text-sm text-red-700">Logins Fallidos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{criticalEvents.unauthorizedAccess}</div>
                      <div className="text-sm text-orange-700">Accesos No Autorizados</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{criticalEvents.dataExports}</div>
                      <div className="text-sm text-yellow-700">Exportaciones</div>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{criticalEvents.logoutEvents}</div>
                      <div className="text-sm text-blue-700">Logouts</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{criticalEvents.patientDataAccess}</div>
                      <div className="text-sm text-green-700">Accesos Pacientes</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{criticalEvents.visitDataAccess}</div>
                      <div className="text-sm text-purple-700">Accesos Visitas</div>
                    </div>
                  </div>
                )}

                {/* Actividad Sospechosa */}
                {criticalEvents?.suspiciousActivity && criticalEvents.suspiciousActivity.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Actividad Sospechosa</h4>
                    <div className="space-y-2">
                      {criticalEvents.suspiciousActivity.map((activity, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">{activity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Eventos por Tipo */}
            {metrics && (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos por Tipo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(metrics.eventsByType)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([type, count]) => (
                        <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900">{count}</div>
                          <div className="text-xs text-gray-600 truncate">{type}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Pacientes */}
            {metrics && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pacientes</h3>
                  <div className="space-y-3">
                    {metrics.topPatients.slice(0, 5).map((patient, index) => (
                      <div key={patient.patientId} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}. {patient.patientId}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{patient.accessCount} accesos</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 