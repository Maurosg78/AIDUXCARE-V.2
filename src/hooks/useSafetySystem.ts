/**
 * 🚨 useSafetySystem - Hook para Sistema de Seguridad Médica
 * 
 * Hook personalizado que integra el SafetyMonitoringService con componentes React
 * para proporcionar análisis de seguridad en tiempo real durante consultas médicas.
 * 
 * OBJETIVO: Facilitar la integración del sistema de seguridad en cualquier
 * componente que requiera monitoreo de riesgos iatrogénicos.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SafetyMonitoringService } from '../services/SafetyMonitoringService';
import { 
  SafetyClinicalAnalysis, 
  SafetyAlert, 
  SafetySystemState, 
  SafetyConfig,
  UseSafetySystemOptions 
} from '../types/clinical';

/**
 * 🚨 Hook para Sistema de Seguridad Médica
 * 
 * Proporciona funcionalidad completa de monitoreo de seguridad
 * con análisis en tiempo real y gestión de alertas.
 */
export const useSafetySystem = (options: UseSafetySystemOptions = {}) => {
  const {
    config = {},
    onAnalysisComplete,
    onAlert,
    onError,
    onStateChange,
    autoStart = false,
    enableMockMode = false,
    logLevel = 'info'
  } = options;

  // Referencias
  const safetyServiceRef = useRef<SafetyMonitoringService | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado del sistema
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRiskLevel, setCurrentRiskLevel] = useState<'safe' | 'caution' | 'warning' | 'danger'>('safe');
  const [activeAlerts, setActiveAlerts] = useState<SafetyAlert[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<SafetyClinicalAnalysis | null>(null);
  const [statistics, setStatistics] = useState({
    totalAnalyses: 0,
    systemUptimeMs: 0,
    isActive: false
  });

  // Estado del sistema combinado
  const systemState: SafetySystemState = {
    isActive,
    isProcessing,
    currentRiskLevel,
    activeAlerts,
    analysisCount,
    errors,
    lastAnalysis: lastAnalysis || undefined
  };

  /**
   * Inicializar el servicio de seguridad
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      if (logLevel === 'debug') {
        console.log('🚨 Inicializando useSafetySystem...');
      }

      // Crear instancia del servicio
      safetyServiceRef.current = new SafetyMonitoringService(config);
      
      // Inicializar servicio
      const success = await safetyServiceRef.current.initialize();
      
      if (success) {
        setIsInitialized(true);
        
        if (logLevel === 'debug') {
          console.log('✅ useSafetySystem inicializado correctamente');
        }

        // Auto-start si está configurado
        if (autoStart) {
          start();
        }

        return true;
      } else {
        throw new Error('Falló la inicialización del SafetyMonitoringService');
      }
    } catch (error) {
      const errorMessage = `Error inicializando useSafetySystem: ${error}`;
      console.error('❌', errorMessage);
      setErrors(prev => [...prev, errorMessage]);
      onError?.(errorMessage);
      return false;
    }
  }, [config, autoStart, logLevel, onError]);

  /**
   * Activar el sistema de seguridad
   */
  const start = useCallback(() => {
    if (!safetyServiceRef.current || !isInitialized) {
      const errorMessage = 'Sistema no inicializado';
      console.warn('⚠️', errorMessage);
      setErrors(prev => [...prev, errorMessage]);
      onError?.(errorMessage);
      return;
    }

    try {
      safetyServiceRef.current.start();
      setIsActive(true);
      
      if (logLevel === 'debug') {
        console.log('🚨 Sistema de seguridad ACTIVADO');
      }

      // Notificar cambio de estado
      onStateChange?.(systemState);

    } catch (error) {
      const errorMessage = `Error activando sistema: ${error}`;
      console.error('❌', errorMessage);
      setErrors(prev => [...prev, errorMessage]);
      onError?.(errorMessage);
    }
  }, [isInitialized, logLevel, onStateChange, onError, systemState]);

  /**
   * Desactivar el sistema de seguridad
   */
  const stop = useCallback(() => {
    if (!safetyServiceRef.current) {
      return;
    }

    try {
      safetyServiceRef.current.stop();
      setIsActive(false);
      setIsProcessing(false);
      
      // Limpiar intervalos
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }

      if (logLevel === 'debug') {
        console.log('⏹️ Sistema de seguridad DESACTIVADO');
      }

      // Notificar cambio de estado
      onStateChange?.(systemState);

    } catch (error) {
      const errorMessage = `Error desactivando sistema: ${error}`;
      console.error('❌', errorMessage);
      setErrors(prev => [...prev, errorMessage]);
      onError?.(errorMessage);
    }
  }, [logLevel, onStateChange, onError, systemState]);

  /**
   * Analizar transcripción en tiempo real
   */
  const analyzeTranscription = useCallback(async (
    transcription: string,
    chunkId?: string,
    timestamp?: number
  ): Promise<SafetyClinicalAnalysis | null> => {
    if (!safetyServiceRef.current || !isActive) {
      return null;
    }

    try {
      setIsProcessing(true);
      
      if (logLevel === 'debug') {
        console.log(`🔍 Analizando transcripción: "${transcription.substring(0, 100)}..."`);
      }

      // Analizar transcripción
      const analysis = await safetyServiceRef.current.analyzeTranscription(
        transcription,
        chunkId,
        timestamp
      );

      // Actualizar estado
      setLastAnalysis(analysis);
      setAnalysisCount(prev => prev + 1);
      setCurrentRiskLevel(analysis.riskLevel);

      // Actualizar estadísticas
      if (safetyServiceRef.current) {
        const stats = safetyServiceRef.current.getStatistics();
        setStatistics(stats);
      }

      // Notificar análisis completado
      onAnalysisComplete?.(analysis);

      // Si debe alertar, crear alerta
      if (analysis.shouldAlert) {
        const alert: SafetyAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          urgencyLevel: analysis.urgencyLevel,
          type: analysis.urgencyLevel >= 4 ? 'iatrogenic_risk' : 'technique_warning',
          message: analysis.recommendations?.[0] || 'Revisar técnica actual',
          recommendations: analysis.recommendations || [],
          warnings: analysis.safetyWarnings || [],
          highlights: analysis.safetyHighlights || [],
          actionRequired: analysis.urgencyLevel >= 4 ? 'STOP_IMMEDIATELY' : 'CAUTION',
          evidence: transcription,
          bodyRegion: analysis.safetyWarnings?.[0]?.bodyRegion,
          isDismissed: false
        };

        setActiveAlerts(prev => [alert, ...prev]);
        onAlert?.(alert);
      }

      return analysis;

    } catch (error) {
      const errorMessage = `Error analizando transcripción: ${error}`;
      console.error('❌', errorMessage);
      setErrors(prev => [...prev, errorMessage]);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isActive, logLevel, onAnalysisComplete, onAlert, onError]);

  /**
   * Iniciar análisis automático con intervalos
   */
  const startAutoAnalysis = useCallback((intervalMs: number = 15000) => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    analysisIntervalRef.current = setInterval(() => {
      if (isActive && !isProcessing) {
        // En modo mock, simular análisis
        if (enableMockMode) {
          const mockTranscriptions = [
            "El paciente refiere dolor intenso durante la manipulación",
            "Observo parestesias nuevas en la extremidad",
            "Hay signos de infección local activa",
            "La técnica está siendo aplicada con fuerza excesiva",
            "Detecto signos neurológicos de alarma"
          ];

          const randomTranscription = mockTranscriptions[
            Math.floor(Math.random() * mockTranscriptions.length)
          ];

          analyzeTranscription(randomTranscription, `mock_${Date.now()}`);
        }
      }
    }, intervalMs);

    if (logLevel === 'debug') {
      console.log(`🔄 Análisis automático iniciado cada ${intervalMs}ms`);
    }
  }, [isActive, isProcessing, enableMockMode, analyzeTranscription, logLevel]);

  /**
   * Detener análisis automático
   */
  const stopAutoAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
      
      if (logLevel === 'debug') {
        console.log('⏹️ Análisis automático detenido');
      }
    }
  }, [logLevel]);

  /**
   * Dismiss alerta
   */
  const dismissAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    if (logLevel === 'debug') {
      console.log(`✅ Alerta descartada: ${alertId}`);
    }
  }, [logLevel]);

  /**
   * Acknowledge alerta
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isDismissed: true } : alert
    ));
    
    if (logLevel === 'debug') {
      console.log(`✅ Alerta reconocida: ${alertId}`);
    }
  }, [logLevel]);

  /**
   * Limpiar todas las alertas
   */
  const clearAllAlerts = useCallback(() => {
    setActiveAlerts([]);
    
    if (logLevel === 'debug') {
      console.log('🧹 Todas las alertas limpiadas');
    }
  }, [logLevel]);

  /**
   * Obtener estadísticas actualizadas
   */
  const getStatistics = useCallback(() => {
    if (safetyServiceRef.current) {
      return safetyServiceRef.current.getStatistics();
    }
    return statistics;
  }, [statistics]);

  /**
   * Reinicializar el sistema
   */
  const reinitialize = useCallback(async (): Promise<boolean> => {
    stop();
    setActiveAlerts([]);
    setErrors([]);
    setAnalysisCount(0);
    setLastAnalysis(null);
    setCurrentRiskLevel('safe');
    
    return await initialize();
  }, [stop, initialize]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      stop();
    };
  }, [stop]);

  // Actualizar estado del sistema cuando cambien las dependencias
  useEffect(() => {
    onStateChange?.(systemState);
  }, [systemState, onStateChange]);

  return {
    // Estado
    isInitialized,
    isActive,
    isProcessing,
    currentRiskLevel,
    activeAlerts,
    analysisCount,
    errors,
    lastAnalysis,
    statistics,
    systemState,
    isSupported: true, // Por ahora siempre soportado

    // Métodos principales
    initialize,
    start,
    stop,
    analyzeTranscription,
    startAutoAnalysis,
    stopAutoAnalysis,
    dismissAlert,
    acknowledgeAlert,
    clearAllAlerts,
    getStatistics,
    reinitialize,
    
    // Funciones adicionales para el panel
    analyzeText: analyzeTranscription, // Alias para compatibilidad
    simulateRisk: async (level: 'low' | 'medium' | 'high' | 'critical') => {
      const mockTexts = {
        low: "Realizo movilización suave de la articulación",
        medium: "Aplico la técnica con fuerza moderada",
        high: "El paciente refiere dolor irradiado nuevo",
        critical: "Voy a realizar un thrust en C1-C2 con rotación forzada"
      };
      await analyzeTranscription(mockTexts[level]);
    },
    recentAnalyses: [lastAnalysis].filter(Boolean)
  };
};

export default useSafetySystem; 