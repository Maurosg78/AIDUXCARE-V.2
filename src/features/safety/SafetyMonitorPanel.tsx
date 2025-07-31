/**
 * 🚨 PANEL DE MONITOREO DE SEGURIDAD - AIDUXCARE V2
 * 
 * Componente principal que se integra en el panel derecho de tu Layout existente.
 * Usa la imagen de marca oficial con gradientes, colores y tipografía consistentes.
 */

import React, { useState, useEffect } from 'react';
import { useSafetySystem } from '@/hooks/useSafetySystem';
import { SafetyAlert } from '@/types/clinical';

export const SafetyMonitorPanel: React.FC = () => {
  const {
    systemState,
    isInitialized,
    isSupported,
    initialize,
    start,
    stop,
    activeAlerts,
    dismissAlert,
    clearAllAlerts,
    recentAnalyses,
    statistics,
    simulateRisk,
    analyzeText
  } = useSafetySystem({
    enableMockMode: true, // Para testing en desarrollo
    logLevel: 'debug',
    onAlert: (alert) => {
      console.log('🚨 Nueva alerta recibida:', alert);
    },
    onError: (error) => {
      console.error('❌ Error del sistema:', error);
    }
  });

  const [testText, setTestText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Inicializar automáticamente si es soportado
  useEffect(() => {
    if (isSupported && !isInitialized) {
      initialize();
    }
  }, [isSupported, isInitialized, initialize]);

  // Manejar análisis de texto manual
  const handleAnalyzeText = async () => {
    if (!testText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeText(testText);
      setTestText(''); // Limpiar después del análisis
    } catch (error) {
      console.error('Error analizando texto:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  if (!isSupported) {
    return (
      <div className="h-full p-4 flex items-center justify-center bg-gradient-to-br from-white via-slate-100 to-blue-50">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p className="text-sm font-medium text-neutral-700">
            Navegador No Compatible
          </p>
          <p className="text-xs mt-1 text-neutral-500">
            Este navegador no soporta las APIs necesarias para el sistema de seguridad
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-white via-slate-100 to-blue-50">
      {/* Header del Panel */}
      <div className="p-4 border-b border-neutral/40 bg-white rounded-t-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            MONITOR DE SEGURIDAD
          </h3>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: systemState.isActive ? '#10b981' : '#94a3b8',
              animation: systemState.isActive ? 'pulse 2s infinite' : 'none'
            }}
          />
        </div>

        {/* Estado General */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Estado:</span>
          <span 
            className="font-medium"
            style={{ color: systemState.isActive ? '#3b82f6' : '#64748b' }}
          >
            {systemState.isActive ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-neutral-500">Riesgo:</span>
          <div className="flex items-center space-x-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getRiskColor(systemState.currentRiskLevel) }}
            />
            <span 
              className="font-medium capitalize text-neutral-700"
            >
              {systemState.currentRiskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Controles Principales */}
      <div className="p-4 border-b border-neutral/40 bg-white">
        <div className="space-y-2">
          {!systemState.isActive ? (
            <button
              onClick={start}
              disabled={!isInitialized}
              className="btn-gradient w-full py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
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
              className="w-full py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
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

          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-center p-2 rounded-xl bg-gradient-to-r from-fuchsia-100 via-blue-100 to-purple-100">
              <div className="text-lg font-bold text-neutral-700">
                {statistics.totalAnalyses}
              </div>
              <div className="text-xs text-neutral-500">
                Análisis
              </div>
            </div>
            <div className="text-center p-2 rounded-xl bg-gradient-to-r from-fuchsia-100 via-blue-100 to-purple-100">
              <div className="text-lg font-bold" style={{ color: activeAlerts.length > 0 ? '#ef4444' : '#64748b' }}>
                {activeAlerts.length}
              </div>
              <div className="text-xs text-neutral-500">
                Alertas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Activas */}
      {activeAlerts.length > 0 && (
        <div className="border-b border-neutral/40 bg-white">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-neutral-700">
                ALERTAS ACTIVAS ({activeAlerts.length})
              </h4>
              {activeAlerts.length > 1 && (
                <button
                  onClick={clearAllAlerts}
                  className="text-xs hover:underline text-neutral-500"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-2 rounded-xl border-l-4 text-xs"
                  style={{
                    backgroundColor: alert.urgencyLevel >= 4 ? '#fef2f2' : '#fffbeb',
                    borderLeftColor: alert.urgencyLevel >= 4 ? '#ef4444' : '#f59e0b'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 mb-1">
                        <span>{getUrgencyIcon(alert.urgencyLevel)}</span>
                        <span className="font-medium text-neutral-700">
                          Nivel {alert.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-xs leading-tight text-neutral-700">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="ml-2 hover:opacity-70 text-neutral-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testing Manual */}
      <div className="p-4 border-b border-neutral/40 bg-white">
        <h4 className="text-xs font-semibold mb-2 text-neutral-700">
          ANÁLISIS MANUAL
        </h4>
        
        <div className="space-y-2">
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Ingresa texto para analizar riesgos..."
            className="w-full p-2 text-xs rounded-xl border border-neutral/40 resize-none text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-2 focus:border-blue-500 focus:bg-white"
            rows={3}
          />
          
          <div className="flex space-x-1">
            <button
              onClick={handleAnalyzeText}
              disabled={!testText.trim() || isAnalyzing}
              className="btn-gradient flex-1 py-1 px-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? 'Analizando...' : 'Analizar'}
            </button>
          </div>
        </div>

        {/* Botones de Simulación */}
        <div className="mt-3">
          <h5 className="text-xs font-medium mb-2 text-neutral-500">
            Simulación:
          </h5>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => simulateRisk('low')}
              className="py-1 px-2 rounded-xl transition-colors bg-green-50 text-green-700 border border-green-200"
            >
              Bajo
            </button>
            <button
              onClick={() => simulateRisk('medium')}
              className="py-1 px-2 rounded-xl transition-colors bg-yellow-50 text-yellow-700 border border-yellow-200"
            >
              Medio
            </button>
            <button
              onClick={() => simulateRisk('high')}
              className="py-1 px-2 rounded-xl transition-colors bg-orange-50 text-orange-700 border border-orange-200"
            >
              Alto
            </button>
            <button
              onClick={() => simulateRisk('critical')}
              className="py-1 px-2 rounded-xl transition-colors bg-red-50 text-red-700 border border-red-200"
            >
              Crítico
            </button>
          </div>
        </div>
      </div>

      {/* Análisis Recientes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-xs font-semibold mb-2 text-neutral-700">
            ANÁLISIS RECIENTES
          </h4>
          
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-8 h-8 mx-auto mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <p className="text-xs text-neutral-500">
                No hay análisis disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAnalyses.slice(0, 5).map((analysis, index) => analysis && (
                <div
                  key={analysis.audioChunkId || index}
                  className="p-2 rounded-xl border border-neutral/40 bg-white"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <span>{getUrgencyIcon(analysis.urgencyLevel)}</span>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getRiskColor(analysis.riskLevel) }}
                      />
                      <span className="text-xs font-medium capitalize text-neutral-700">
                        {analysis.riskLevel}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(analysis.metadata?.processingTimeMs || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {analysis.transcription && (
                    <p className="text-xs leading-tight mb-2 text-neutral-700">
                      "{analysis.transcription}"
                    </p>
                  )}
                  
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium text-neutral-500">
                        Recomendación:
                      </span>
                      <span className="text-neutral-700"> {analysis.recommendations[0]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 