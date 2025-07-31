/**
 * 🧪 SafetyTestingPage - Página de Testing del Sistema de Seguridad
 * 
 * Página para probar exhaustivamente el sistema de seguridad médica
 * usando el hook useSafetySystem y el SafetyMonitoringService.
 * 
 * OBJETIVO: Proporcionar una interfaz completa para testing y validación
 * del sistema de análisis de riesgos iatrogénicos.
 */

import React, { useState, useEffect } from 'react';
import useSafetySystem from '../hooks/useSafetySystem';
import RealTimeAlertComponent from '../components/audio/RealTimeAlertComponent';
import { SafetyClinicalAnalysis, SafetyAlert } from '../types/clinical';

/**
 * 🧪 Página de Testing del Sistema de Seguridad
 */
export const SafetyTestingPage: React.FC = () => {
  const [testTranscriptions, setTestTranscriptions] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<SafetyClinicalAnalysis[]>([]);
  const [isAutoTesting, setIsAutoTesting] = useState(false);

  // Configuración del sistema de seguridad
  const safetyConfig = {
    enabled: true,
    chunkSizeMs: 15000,
    overlapMs: 2000,
    alertThreshold: 3,
    autoStopThreshold: 5,
    enableAudioAlerts: true,
    enableVisualAlerts: true,
    enableVibration: true,
    logAllAnalyses: true
  };

  // Frases de prueba predefinidas
  const predefinedTests = [
    {
      name: "Riesgo Crítico - Manipulación Cervical",
      transcription: "Voy a realizar un thrust en C1-C2 con rotación forzada del cuello",
      expectedRisk: "danger",
      expectedUrgency: 5
    },
    {
      name: "Riesgo Alto - Dolor Irradiado",
      transcription: "El paciente refiere dolor irradiado nuevo que baja hasta la pierna",
      expectedRisk: "warning",
      expectedUrgency: 4
    },
    {
      name: "Riesgo Medio - Fuerza Excesiva",
      transcription: "Aplico la técnica con fuerza excesiva en la zona lumbar",
      expectedRisk: "caution",
      expectedUrgency: 3
    },
    {
      name: "Bandera Roja Neurológica",
      transcription: "El paciente presenta parestesias nuevas en el brazo derecho",
      expectedRisk: "warning",
      expectedUrgency: 4
    },
    {
      name: "Bandera Roja Vascular",
      transcription: "Observo edema súbito y cambio de color en la extremidad",
      expectedRisk: "warning",
      expectedUrgency: 4
    },
    {
      name: "Seguro - Técnica Normal",
      transcription: "Realizo movilización suave de la articulación del hombro",
      expectedRisk: "safe",
      expectedUrgency: 1
    }
  ];

  // Hook del sistema de seguridad
  const {
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
    initialize,
    start,
    stop,
    analyzeTranscription,
    startAutoAnalysis,
    stopAutoAnalysis,
    dismissAlert,
    acknowledgeAlert,
    clearAllAlerts,
    getStatistics
  } = useSafetySystem({
    config: safetyConfig,
    autoStart: false,
    enableMockMode: false,
    logLevel: 'debug',
    onAnalysisComplete: (analysis) => {
      console.log('📊 Análisis completado:', analysis);
      setAnalysisResults(prev => [analysis, ...prev.slice(0, 9)]); // Mantener últimos 10
    },
    onAlert: (alert) => {
      console.log('🚨 Alerta generada:', alert);
    },
    onError: (error) => {
      console.error('❌ Error del sistema:', error);
    },
    onStateChange: (state) => {
      console.log('🔄 Estado del sistema:', state);
    }
  });

  // Inicializar sistema al montar
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handlers para testing
  const handleStartSystem = () => {
    start();
  };

  const handleStopSystem = () => {
    stop();
  };

  const handleTestTranscription = async (transcription: string) => {
    if (!isActive) {
      alert('El sistema debe estar activo para realizar análisis');
      return;
    }

    setTestTranscriptions(prev => [transcription, ...prev.slice(0, 4)]);
    await analyzeTranscription(transcription, `test_${Date.now()}`);
  };

  const handlePredefinedTest = async (test: typeof predefinedTests[0]) => {
    await handleTestTranscription(test.transcription);
  };

  const handleRunAllTests = async () => {
    if (!isActive) {
      alert('El sistema debe estar activo para realizar análisis');
      return;
    }

    setIsAutoTesting(true);
    
    for (let i = 0; i < predefinedTests.length; i++) {
      const test = predefinedTests[i];
      console.log(`🧪 Ejecutando test: ${test.name}`);
      
      await handleTestTranscription(test.transcription);
      
      // Esperar entre tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsAutoTesting(false);
  };

  const handleStartAutoTesting = () => {
    startAutoAnalysis(5000); // Cada 5 segundos
  };

  const handleStopAutoTesting = () => {
    stopAutoAnalysis();
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  const handleStopTechnique = (alertId: string) => {
    console.log(`⛔ TÉCNICA DETENIDA por alerta: ${alertId}`);
    acknowledgeAlert(alertId);
    stop();
  };

  return (
    <div className="safety-testing-page" style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <style>
        {`
          .safety-testing-page {
            max-width: 1400px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .page-header {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
          }
          
          .page-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .page-subtitle {
            font-size: 18px;
            opacity: 0.9;
          }
          
          .testing-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .testing-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .card-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .control-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
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
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
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
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
          }
          
          .stat-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }
          
          .test-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
          }
          
          .test-item {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .test-item:hover {
            background-color: #f9fafb;
          }
          
          .test-item:last-child {
            border-bottom: none;
          }
          
          .test-name {
            font-weight: 600;
            margin-bottom: 4px;
            color: #1f2937;
          }
          
          .test-transcription {
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
          }
          
          .test-expected {
            font-size: 11px;
            margin-top: 4px;
          }
          
          .expected-danger { color: #dc2626; }
          .expected-warning { color: #ea580c; }
          .expected-caution { color: #f59e0b; }
          .expected-safe { color: #10b981; }
          
          .analysis-list {
            max-height: 400px;
            overflow-y: auto;
          }
          
          .analysis-item {
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 8px;
            background: #f9fafb;
          }
          
          .analysis-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          
          .risk-level {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .risk-danger { background: #dc2626; color: white; }
          .risk-warning { background: #ea580c; color: white; }
          .risk-caution { background: #f59e0b; color: white; }
          .risk-safe { background: #10b981; color: white; }
          
          .transcription-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 12px;
            font-family: inherit;
          }
          
          .transcription-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .error-list {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
          }
          
          .error-item {
            color: #dc2626;
            font-size: 12px;
            margin-bottom: 4px;
          }
        `}
      </style>

      <div className="page-header">
        <h1 className="page-title">🧪 Testing del Sistema de Seguridad</h1>
        <p className="page-subtitle">
          Pruebas exhaustivas del sistema de análisis de riesgos iatrogénicos
        </p>
      </div>

      <div className="testing-grid">
        {/* Panel de Control */}
        <div className="testing-card">
          <h2 className="card-title">🎛️ Panel de Control</h2>
          
          <div className="status-indicator" style={{
            backgroundColor: isActive 
              ? currentRiskLevel === 'danger' 
                ? '#dc2626' 
                : isProcessing 
                  ? '#f59e0b' 
                  : '#10b981'
              : '#6b7280',
            color: 'white'
          }}>
            <span>●</span>
            {isActive 
              ? currentRiskLevel === 'danger' 
                ? 'CRÍTICO' 
                : isProcessing 
                  ? 'PROCESANDO' 
                  : 'ACTIVO'
              : 'INACTIVO'
            }
          </div>

          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-value">{analysisCount}</div>
              <div className="stat-label">Análisis</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeAlerts.length}</div>
              <div className="stat-label">Alertas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{errors.length}</div>
              <div className="stat-label">Errores</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(statistics.systemUptimeMs / 1000)}s</div>
              <div className="stat-label">Tiempo</div>
            </div>
          </div>

          <div className="control-buttons">
            <button
              className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
              onClick={isActive ? handleStopSystem : handleStartSystem}
              disabled={!isInitialized}
            >
              {isActive ? '🛑 Detener' : '▶️ Iniciar'}
            </button>
            
            <button
              className="btn btn-warning"
              onClick={handleRunAllTests}
              disabled={!isActive || isAutoTesting}
            >
              🧪 Ejecutar Todos
            </button>
            
            <button
              className="btn btn-primary"
              onClick={isAutoTesting ? handleStopAutoTesting : handleStartAutoTesting}
              disabled={!isActive}
            >
              {isAutoTesting ? '⏹️ Parar Auto' : '🔄 Auto Test'}
            </button>
            
            <button
              className="btn btn-warning"
              onClick={clearAllAlerts}
            >
              🧹 Limpiar Alertas
            </button>
          </div>

          {errors.length > 0 && (
            <div className="error-list">
              <h4 style={{ marginBottom: '8px', color: '#dc2626' }}>Errores:</h4>
              {errors.map((error, index) => (
                <div key={index} className="error-item">• {error}</div>
              ))}
            </div>
          )}
        </div>

        {/* Tests Predefinidos */}
        <div className="testing-card">
          <h2 className="card-title">📋 Tests Predefinidos</h2>
          
          <div className="test-list">
            {predefinedTests.map((test, index) => (
              <div 
                key={index} 
                className="test-item"
                onClick={() => handlePredefinedTest(test)}
              >
                <div className="test-name">{test.name}</div>
                <div className="test-transcription">"{test.transcription}"</div>
                <div className={`test-expected expected-${test.expectedRisk}`}>
                  Esperado: {test.expectedRisk.toUpperCase()} (Urgencia {test.expectedUrgency})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Análisis Personalizado */}
      <div className="testing-card" style={{ marginBottom: '30px' }}>
        <h2 className="card-title">✏️ Análisis Personalizado</h2>
        
        <input
          type="text"
          className="transcription-input"
          placeholder="Escribe una transcripción para analizar..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              handleTestTranscription(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
        />
        
        <div className="control-buttons">
          <button
            className="btn btn-primary"
            onClick={() => {
              const input = document.querySelector('.transcription-input') as HTMLInputElement;
              if (input?.value.trim()) {
                handleTestTranscription(input.value.trim());
                input.value = '';
              }
            }}
            disabled={!isActive}
          >
            🔍 Analizar
          </button>
        </div>

        {testTranscriptions.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '8px' }}>Transcripciones Recientes:</h4>
            {testTranscriptions.map((transcription, index) => (
              <div key={index} style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginBottom: '4px',
                fontStyle: 'italic'
              }}>
                "{transcription}"
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resultados de Análisis */}
      <div className="testing-card">
        <h2 className="card-title">📊 Resultados de Análisis</h2>
        
        <div className="analysis-list">
          {analysisResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              No hay análisis disponibles. Ejecuta algunos tests para ver resultados.
            </div>
          ) : (
            analysisResults.map((analysis, index) => (
              <div key={index} className="analysis-item">
                <div className="analysis-header">
                  <span className={`risk-level risk-${analysis.riskLevel}`}>
                    {analysis.riskLevel.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Urgencia: {analysis.urgencyLevel}
                  </span>
                </div>
                
                <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                  "{analysis.transcription?.substring(0, 100)}..."
                </div>
                
                {analysis.safetyWarnings && analysis.safetyWarnings.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '4px' }}>
                    ⚠️ {analysis.safetyWarnings.length} riesgos detectados
                  </div>
                )}
                
                {analysis.safetyHighlights && analysis.safetyHighlights.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#ea580c', marginBottom: '4px' }}>
                    🚩 {analysis.safetyHighlights.length} banderas rojas
                  </div>
                )}
                
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#059669' }}>
                    💡 {analysis.recommendations[0]}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alertas en Tiempo Real */}
      <RealTimeAlertComponent
        alerts={activeAlerts}
        systemState={systemState}
        onDismissAlert={handleDismissAlert}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onStopTechnique={handleStopTechnique}
      />
    </div>
  );
};

export default SafetyTestingPage; 