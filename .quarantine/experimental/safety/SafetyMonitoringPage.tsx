/**
 * 🚨 PÁGINA DE MONITOREO DE SEGURIDAD - AIDUXCARE V2
 * 
 * Página dedicada para el monitoreo completo del sistema de seguridad médica.
 * Proporciona una interfaz completa con todas las funcionalidades de seguridad.
 * Usa la imagen de marca oficial con gradientes, colores y tipografía consistentes.
 */

import React, { useState, useEffect } from 'react';
import { useSafetySystem } from '@/hooks/useSafetySystem';
import { SafetyMonitorPanel } from './SafetyMonitorPanel';
import { SafetyClinicalAnalysis, SafetyAlert } from '@/types/clinical';

export const SafetyMonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'testing' | 'analytics' | 'settings'>('monitor');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const {
    systemState,
    isInitialized,
    isActive,
    isProcessing,
    currentRiskLevel,
    activeAlerts,
    analysisCount,
    statistics,
    initialize,
    start,
    stop,
    analyzeTranscription,
    simulateRisk,
    clearAllAlerts
  } = useSafetySystem({
    enableMockMode: true,
    logLevel: 'debug',
    onAlert: (alert) => {
      console.log('🚨 Nueva alerta recibida:', alert);
    },
    onError: (error) => {
      console.error('❌ Error del sistema:', error);
    }
  });

  // Inicializar automáticamente
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Función para obtener color del nivel de riesgo usando paleta oficial
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'danger': return '#ef4444'; // Red-500
      case 'warning': return '#f59e0b'; // Amber-500
      case 'caution': return '#eab308'; // Yellow-500
      default: return '#10b981'; // Green-500
    }
  };

  // Función para obtener icono del nivel de urgencia
  const getUrgencyIcon = (urgencyLevel: number) => {
    if (urgencyLevel >= 5) return '⛔';
    if (urgencyLevel >= 4) return '🚨';
    if (urgencyLevel >= 3) return '⚠️';
    if (urgencyLevel >= 2) return '👁️';
    return '✅';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-blue-50">
      {/* Header de la Página */}
      <div className="bg-white border-b border-neutral/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-bold text-lg flex items-center justify-center">
                  🛡️
                </div>
                <h1 className="text-2xl font-bold text-gradient">
                  Monitor de Seguridad Médica
                </h1>
              </div>
              
              {/* Estado del Sistema */}
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: systemState.isActive ? '#10b981' : '#94a3b8',
                    animation: systemState.isActive ? 'pulse 2s infinite' : 'none'
                  }}
                />
                <span className="text-sm font-medium text-neutral-700">
                  {systemState.isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </div>

            {/* Controles Principales */}
            <div className="flex items-center space-x-3">
              {!systemState.isActive ? (
                <button
                  onClick={start}
                  disabled={!isInitialized}
                  className="btn-gradient px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                  style={{
                    opacity: isInitialized ? 1 : 0.6
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-2 0a7 7 0 11-12 0 7 7 0 0112 0z"/>
                  </svg>
                  <span>Iniciar Monitoreo</span>
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h6v4H9z"/>
                  </svg>
                  <span>Detener Monitoreo</span>
                </button>
              )}

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-xl transition-colors bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Navegación por Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {[
                { id: 'monitor', name: 'Monitor', icon: 'shield' },
                { id: 'testing', name: 'Testing', icon: 'flask' },
                { id: 'analytics', name: 'Analytics', icon: 'chart' },
                { id: 'settings', name: 'Configuración', icon: 'settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {tab.icon === 'shield' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    )}
                    {tab.icon === 'flask' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    )}
                    {tab.icon === 'chart' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    )}
                    {tab.icon === 'settings' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    )}
                  </svg>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Principal de Monitoreo */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-neutral/40">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4 text-neutral-700">
                    Monitor en Tiempo Real
                  </h2>
                  
                  {/* Estado Actual */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded-xl bg-gradient-to-r from-fuchsia-100 via-blue-100 to-purple-100">
                      <div className="text-2xl font-bold text-neutral-700">
                        {analysisCount}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Análisis
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-r from-fuchsia-100 via-blue-100 to-purple-100">
                      <div className="text-2xl font-bold" style={{ color: activeAlerts.length > 0 ? '#ef4444' : '#64748b' }}>
                        {activeAlerts.length}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Alertas
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-r from-fuchsia-100 via-blue-100 to-purple-100">
                      <div className="text-2xl font-bold" style={{ color: getRiskColor(currentRiskLevel) }}>
                        {currentRiskLevel.toUpperCase()}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Riesgo
                      </div>
                    </div>
                  </div>

                  {/* Alertas Activas */}
                  {activeAlerts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-semibold mb-3 text-neutral-700">
                        Alertas Activas ({activeAlerts.length})
                      </h3>
                      <div className="space-y-2">
                        {activeAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="p-3 rounded-xl border-l-4"
                            style={{
                              backgroundColor: alert.urgencyLevel >= 4 ? '#fef2f2' : '#fffbeb',
                              borderLeftColor: alert.urgencyLevel >= 4 ? '#ef4444' : '#f59e0b'
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span>{getUrgencyIcon(alert.urgencyLevel)}</span>
                                  <span className="font-medium text-neutral-700">
                                    Nivel {alert.urgencyLevel}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-700">
                                  {alert.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Análisis Manual */}
                  <div>
                    <h3 className="text-md font-semibold mb-3 text-neutral-700">
                      Análisis Manual
                    </h3>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Ingresa texto para analizar riesgos médicos..."
                        className="w-full p-3 rounded-xl border border-neutral/40 resize-none text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-2 focus:border-blue-500 focus:bg-white"
                        rows={4}
                      />
                      <div className="flex space-x-2">
                        <button
                          className="btn-gradient px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          Analizar Texto
                        </button>
                        <button
                          onClick={() => simulateRisk('critical')}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white'
                          }}
                        >
                          Simular Crítico
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Lateral */}
            <div className="lg:col-span-1">
              <SafetyMonitorPanel />
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="bg-white rounded-xl border border-neutral/40 p-6">
            <h2 className="text-lg font-semibold mb-4 text-neutral-700">
              Testing del Sistema
            </h2>
            <p className="text-sm text-neutral-500">
              Funcionalidades de testing en desarrollo...
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl border border-neutral/40 p-6">
            <h2 className="text-lg font-semibold mb-4 text-neutral-700">
              Analytics de Seguridad
            </h2>
            <p className="text-sm text-neutral-500">
              Métricas y análisis en desarrollo...
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-neutral/40 p-6">
            <h2 className="text-lg font-semibold mb-4 text-neutral-700">
              Configuración del Sistema
            </h2>
            <p className="text-sm text-neutral-500">
              Configuraciones avanzadas en desarrollo...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 