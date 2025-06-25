/**
 * SECURITY: SECURITY DASHBOARD - MEDICAL SECURITY MONITORING
 * Panel de monitoreo de seguridad médica en tiempo real
 * Auditoría + Alertas + Estadísticas de seguridad
 */

import React, { useState, useEffect } from 'react';
import MedicalAuditService from '@/security/MedicalAuditService';

interface SecurityStats {
  totalEvents: number;
  recentAlerts: number;
  eventsByType: Record<string, number>;
  riskDistribution: Record<string, number>;
}

const SecurityDashboard: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateStats = () => {
      const currentStats = MedicalAuditService.getAuditStatistics();
      setStats(currentStats);
      setLastUpdate(new Date());
    };

    // Actualizar inmediatamente
    updateStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'AUTHENTICATION': return 'SECURITY';
      case 'PATIENT_RECORD_ACCESS': return 'USER:';
      case 'DATA_MODIFICATION': return '✏️';
      case 'EMERGENCY_ACCESS': return 'ALERT';
      case 'SYSTEM_CONFIGURATION': return '⚙️';
      case 'SECURITY_INCIDENT': return 'SECURITY:';
      default: return 'NOTES:';
    }
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Seguridad Médica</h3>
              <p className="text-blue-100 text-sm">
                {stats.totalEvents} eventos • {stats.recentAlerts} alertas recientes
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Estado de seguridad */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">ACTIVO</span>
            </div>
            {/* Icono expandir/colapsar */}
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
              <div className="text-sm text-blue-700">Total Eventos</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(stats.eventsByType).reduce((a, b) => a + b, 0) - stats.recentAlerts}
              </div>
              <div className="text-sm text-green-700">Eventos Seguros</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.recentAlerts}</div>
              <div className="text-sm text-yellow-700">Alertas Recientes</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.eventsByType['PATIENT_RECORD_ACCESS'] || 0}
              </div>
              <div className="text-sm text-purple-700">Accesos Médicos</div>
            </div>
          </div>

          {/* Distribución por tipo de evento */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Eventos por Tipo</h4>
            <div className="space-y-2">
              {Object.entries(stats.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getEventTypeIcon(type)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución de riesgo */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Niveles de Riesgo</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(stats.riskDistribution).map(([level, count]) => (
                <div key={level} className={`p-3 rounded-lg ${getRiskColor(level)}`}>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs font-medium">{level}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Características de seguridad activas */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Características Activas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-green-800">Cifrado Médico</div>
                  <div className="text-sm text-green-600">AES-256 + Field-Level</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">Auditoría HIPAA</div>
                  <div className="text-sm text-blue-600">Logging Completo</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-purple-800">Autenticación Segura</div>
                  <div className="text-sm text-purple-600">PIN + Hashing</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-indigo-800">Anonimización</div>
                  <div className="text-sm text-indigo-600">GDPR Compliant</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con timestamp */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
              <span>SECURE Seguridad médica activa</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard; 