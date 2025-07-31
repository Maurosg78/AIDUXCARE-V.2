/**
 * 🚨 SafetySystemDemoPage - Página de Demostración del Sistema de Seguridad
 * 
 * Página para probar y demostrar el sistema de seguridad médica en tiempo real
 * que previene daño al paciente durante técnicas manuales.
 * 
 * OBJETIVO: Proporcionar una interfaz completa para testing del sistema
 * de análisis iatrogénico y banderas rojas.
 */

import React, { useState, useEffect, useRef } from 'react';
import { EnhancedAudioCaptureManager, EnhancedAudioCaptureConfig, EnhancedAudioCaptureCallbacks } from '../services/EnhancedAudioCaptureManager';
import RealTimeAlertComponent from '../components/audio/RealTimeAlertComponent';
import { SafetyAlert, SafetySystemState, SafetyClinicalAnalysis } from '../types/clinical';

/**
 * 🚨 Página de Demostración del Sistema de Seguridad
 */
export const SafetySystemDemoPage: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [systemState, setSystemState] = useState<SafetySystemState>({
    isActive: false,
    isProcessing: false,
    currentRiskLevel: 'safe',
    activeAlerts: [],
    analysisCount: 0,
    errors: []
  });
  const [analyses, setAnalyses] = useState<SafetyClinicalAnalysis[]>([]);
  const [statistics, setStatistics] = useState({
    totalAnalyses: 0,
    alertsGenerated: 0,
    criticalAlerts: 0,
    activeAlerts: 0,
    systemUptimeMs: 0
  });

  const audioManagerRef = useRef<EnhancedAudioCaptureManager | null>(null);

  // Configuración del sistema de seguridad
  const safetyConfig: EnhancedAudioCaptureConfig = {
    // Configuración base de audio
    method: 'web-speech',
    language: 'es',
    continuous: true,
    interimResults: false,
    maxAlternatives: 1,
    
    // Configuración de seguridad
    safety: {
      enabled: true,
      chunkSizeMs: 15000, // 15 segundos
      overlapMs: 2000, // 2 segundos
      alertThreshold: 3, // Nivel mínimo para alertar
      autoStopThreshold: 5, // Nivel para detener automáticamente
      enableAudioAlerts: true,
      enableVisualAlerts: true,
      enableVibration: true,
      logAllAnalyses: true
    }
  };

  // Callbacks del sistema de seguridad
  const safetyCallbacks: EnhancedAudioCaptureCallbacks = {
    onCaptureStart: () => {
      console.log('🎤 Captura iniciada');
      setIsCapturing(true);
    },
    onCaptureStop: () => {
      console.log('🛑 Captura detenida');
      setIsCapturing(false);
    },
    onTranscriptionUpdate: (transcription) => {
      console.log('📝 Transcripción:', transcription);
    },
    onQualityUpdate: (quality) => {
      console.log('📊 Calidad:', quality);
    },
    onError: (error) => {
      console.error('❌ Error:', error);
    },
    onRiskAnalysis: (analysis) => {
      console.log('🚨 Análisis de riesgo:', analysis);
      setAnalyses(prev => [analysis, ...prev.slice(0, 9)]); // Mantener últimos 10
    },
    onSafetyAlert: (alert) => {
      console.log('🚨 Alerta de seguridad:', alert);
      setAlerts(prev => [alert, ...prev]);
    },
    onSafetyStateChange: (state) => {
      console.log('🔄 Estado del sistema:', state);
      setSystemState(state);
    }
  };

  // Inicializar gestor de audio mejorado
  useEffect(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new EnhancedAudioCaptureManager(safetyConfig, safetyCallbacks);
    }

    return () => {
      audioManagerRef.current?.cleanup();
    };
  }, []);

  // Actualizar estadísticas
  useEffect(() => {
    if (audioManagerRef.current) {
      const stats = audioManagerRef.current.getSafetyStatistics();
      setStatistics(stats);
    }
  }, [systemState]);

  // Handlers para alertas
  const handleDismissAlert = (alertId: string) => {
    audioManagerRef.current?.dismissAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    audioManagerRef.current?.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isDismissed: true } : alert
    ));
  };

  const handleStopTechnique = (alertId: string) => {
    audioManagerRef.current?.stopTechnique(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isDismissed: true } : alert
    ));
  };

  // Iniciar captura
  const startCapture = async () => {
    try {
      await audioManagerRef.current?.startCapture();
    } catch (error) {
      console.error('Error iniciando captura:', error);
    }
  };

  // Detener captura
  const stopCapture = async () => {
    try {
      await audioManagerRef.current?.stopCapture();
    } catch (error) {
      console.error('Error deteniendo captura:', error);
    }
  };

  // Simular frases de riesgo para testing
  const simulateRiskPhrases = () => {
    const riskPhrases = [
      "El paciente refiere dolor intenso durante la manipulación",
      "Observo parestesias nuevas en la extremidad",
      "Hay signos de infección local activa",
      "La técnica está siendo aplicada con fuerza excesiva",
      "Detecto signos neurológicos de alarma"
    ];

    riskPhrases.forEach((phrase, index) => {
      setTimeout(() => {
        console.log(`🧪 Simulando frase de riesgo: ${phrase}`);
        // En un sistema real, esto se procesaría a través del análisis
      }, index * 2000);
    });
  };

  return (
    <div className="safety-system-demo" style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <style>
        {`
          .safety-system-demo {
            max-width: 1200px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .demo-header {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .demo-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .demo-subtitle {
            font-size: 16px;
            opacity: 0.9;
          }
          
          .demo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .demo-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .card-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1f2937;
          }
          
          .control-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
          }
          
          .btn-primary {
            background: #3b82f6;
            color: white;
          }
          
          .btn-primary:hover {
            background: #2563eb;
          }
          
          .btn-danger {
            background: #dc2626;
            color: white;
          }
          
          .btn-danger:hover {
            background: #b91c1b;
          }
          
          .btn-success {
            background: #10b981;
            color: white;
          }
          
          .btn-success:hover {
            background: #059669;
          }
          
          .btn-warning {
            background: #f59e0b;
            color: white;
          }
          
          .btn-warning:hover {
            background: #d97706;
          }
          
          .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
          }
          
          .status-active {
            background: #10b981;
            color: white;
          }
          
          .status-inactive {
            background: #6b7280;
            color: white;
          }
          
          .status-processing {
            background: #f59e0b;
            color: white;
          }
          
          .status-danger {
            background: #dc2626;
            color: white;
          }
          
          .statistics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
          }
          
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .analysis-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
          }
          
          .analysis-item {
            padding: 8px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 12px;
          }
          
          .analysis-item:last-child {
            border-bottom: none;
          }
          
          .risk-level {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .risk-safe { background: #10b981; color: white; }
          .risk-caution { background: #f59e0b; color: white; }
          .risk-warning { background: #ea580c; color: white; }
          .risk-danger { background: #dc2626; color: white; }
        `}
      </style>

      <div className="demo-header">
        <h1 className="demo-title">🚨 Sistema de Seguridad Médica</h1>
        <p className="demo-subtitle">
          Demostración del sistema de análisis en tiempo real para prevenir daño al paciente
        </p>
      </div>

      <div className="control-buttons">
        <button
          className={`btn ${isCapturing ? 'btn-danger' : 'btn-primary'}`}
          onClick={isCapturing ? stopCapture : startCapture}
        >
          {isCapturing ? '🛑 Detener Captura' : '🎤 Iniciar Captura'}
        </button>
        
        <button
          className="btn btn-warning"
          onClick={simulateRiskPhrases}
          disabled={!isCapturing}
        >
          🧪 Simular Frases de Riesgo
        </button>
        
        <button
          className="btn btn-success"
          onClick={() => setAlerts([])}
        >
          🧹 Limpiar Alertas
        </button>
      </div>

      <div className="demo-grid">
        {/* Estado del Sistema */}
        <div className="demo-card">
          <h3 className="card-title">Estado del Sistema</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <span className={`status-indicator ${
              systemState.isActive 
                ? systemState.currentRiskLevel === 'danger' 
                  ? 'status-danger' 
                  : systemState.isProcessing 
                    ? 'status-processing' 
                    : 'status-active'
                : 'status-inactive'
            }`}>
              <span>●</span>
              {systemState.isActive 
                ? systemState.currentRiskLevel === 'danger' 
                  ? 'CRÍTICO' 
                  : systemState.isProcessing 
                    ? 'PROCESANDO' 
                    : 'ACTIVO'
                : 'INACTIVO'
              }
            </span>
          </div>
          
          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalAnalyses}</div>
              <div className="stat-label">Análisis</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.alertsGenerated}</div>
              <div className="stat-label">Alertas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.criticalAlerts}</div>
              <div className="stat-label">Críticas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.activeAlerts}</div>
              <div className="stat-label">Activas</div>
            </div>
          </div>
          
          {systemState.errors.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Errores:</h4>
              <div style={{ fontSize: '12px', color: '#dc2626' }}>
                {systemState.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Análisis Recientes */}
        <div className="demo-card">
          <h3 className="card-title">Análisis Recientes</h3>
          
          <div className="analysis-list">
            {analyses.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                No hay análisis disponibles
              </div>
            ) : (
              analyses.map((analysis, index) => (
                <div key={index} className="analysis-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className={`risk-level risk-${analysis.riskLevel}`}>
                      {analysis.riskLevel.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                      Urgencia: {analysis.urgencyLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#374151' }}>
                    {analysis.transcription?.substring(0, 100)}...
                  </div>
                  {analysis.safetyWarnings && analysis.safetyWarnings.length > 0 && (
                    <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '4px' }}>
                      ⚠️ {analysis.safetyWarnings.length} riesgos detectados
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alertas en Tiempo Real */}
      <RealTimeAlertComponent
        alerts={alerts}
        systemState={systemState}
        onDismissAlert={handleDismissAlert}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onStopTechnique={handleStopTechnique}
      />

      {/* Información de Testing */}
      <div className="demo-card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">🧪 Información de Testing</h3>
        
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>Frases de prueba para simular riesgos:</strong></p>
          <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
            <li>"El paciente refiere dolor intenso durante la manipulación"</li>
            <li>"Observo parestesias nuevas en la extremidad"</li>
            <li>"Hay signos de infección local activa"</li>
            <li>"La técnica está siendo aplicada con fuerza excesiva"</li>
            <li>"Detecto signos neurológicos de alarma"</li>
          </ul>
          
          <p style={{ marginTop: '16px' }}>
            <strong>Niveles de urgencia:</strong><br />
            • <span style={{ color: '#dc2626' }}>5 - DETENER INMEDIATAMENTE</span><br />
            • <span style={{ color: '#ea580c' }}>4 - ALERTA CRÍTICA</span><br />
            • <span style={{ color: '#f59e0b' }}>3 - PRECAUCIÓN</span><br />
            • <span style={{ color: '#3b82f6' }}>2-1 - INFORMACIÓN</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafetySystemDemoPage; 