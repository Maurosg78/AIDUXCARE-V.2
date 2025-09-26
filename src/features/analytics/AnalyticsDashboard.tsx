/* eslint-disable no-unreachable */
/* eslint-disable no-unreachable */
import React, { useState, useEffect } from 'react';

import { analyticsService, type DashboardMetrics } from '../../services/analyticsService';

import logger from '@/shared/utils/logger';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    end: new Date()
  });

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const dashboardMetrics = await analyticsService.getDashboardMetrics(dateRange);
      setMetrics(dashboardMetrics);
    } catch (error) {
      logger.error('Error cargando métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas de analítica...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudieron cargar las métricas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Centro de Análisis Operativo y de Uso
          </h1>
          <p className="text-gray-600">
            Métricas en vivo del sistema AiDuxCare
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="dateRangeStart" className="text-sm font-medium text-gray-700">Rango de fechas:</label>
            <input
              id="dateRangeStart"
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                start: new Date(e.target.value)
              }))}
              className="border border-gray-300 rounded px-3 py-1"
            />
            <span className="text-gray-500">a</span>
            <input
              id="dateRangeEnd"
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                end: new Date(e.target.value)
              }))}
              className="border border-gray-300 rounded px-3 py-1"
            />
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.usageByModule.reduce((sum, module) => sum + module.count, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions Acceptance Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aceptación Sugerencias</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.suggestionsMetrics.acceptanceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Time Saved */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tiempo Ahorrado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(metrics.timeMetrics.totalTimeSaved)} min
                </p>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.userMetrics.activeUsers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usage by Module */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso por Módulo</h3>
            <div className="space-y-3">
              {metrics.usageByModule.map((module) => (
                <div key={module.module} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{module.module}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${module.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {module.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage by Specialty */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso por Especialidad</h3>
            <div className="space-y-3">
              {metrics.userMetrics.usageBySpecialty.map((specialty) => (
                <div key={specialty.specialty} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{specialty.specialty}</span>
                  <span className="text-sm text-gray-500">{specialty.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suggestions Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Sugerencias</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Aceptadas</span>
                <span className="text-sm font-medium text-green-600">{metrics.suggestionsMetrics.accepted}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rechazadas</span>
                <span className="text-sm font-medium text-red-600">{metrics.suggestionsMetrics.rejected}%</span>
              </div>
            </div>
          </div>

          {/* Time Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Tiempo</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duración Promedio</span>
                <span className="text-sm font-medium text-gray-900">{metrics.timeMetrics.averageSessionDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tiempo Ahorrado/Paciente</span>
                <span className="text-sm font-medium text-gray-900">{metrics.timeMetrics.timeSavedPerPatient} min</span>
              </div>
            </div>
          </div>

          {/* Error Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Errores</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Errores</span>
                <span className="text-sm font-medium text-red-600">{metrics.errorMetrics.totalErrors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tasa de Error</span>
                <span className="text-sm font-medium text-red-600">{metrics.errorMetrics.errorRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar Datos</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => exportData('csv')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => exportData('json')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Exportar JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const data = await analyticsService.exportAnalyticsData(dateRange, format);
      
      // Create download link
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${dateRange.start.toISOString().split('T')[0]}_${dateRange.end.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Error exportando datos:', error);
      alert('Error al exportar datos');
    }
  };
};
