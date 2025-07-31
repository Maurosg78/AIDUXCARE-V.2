import React, { useState, useEffect } from 'react';

interface SessionMetrics {
  totalChunks: number;
  analyzedChunks: number;
  averageProcessingTime: number;
  clinicalRelevance: number;
  redFlagsCount: number;
  soapCompleteness: {
    S: number;
    O: number;
    A: number;
    P: number;
  };
}

interface ClinicalMetricsProps {
  isRecording: boolean;
  currentPhase: string;
  sessionDuration: number;
}

export const ClinicalMetrics: React.FC<ClinicalMetricsProps> = ({
  isRecording,
  currentPhase,
  sessionDuration
}) => {
  const [metrics, setMetrics] = useState<SessionMetrics>({
    totalChunks: 0,
    analyzedChunks: 0,
    averageProcessingTime: 0,
    clinicalRelevance: 0,
    redFlagsCount: 0,
    soapCompleteness: { S: 0, O: 0, A: 0, P: 0 }
  });

  const [realtimeStats, setRealtimeStats] = useState({
    chunksPerMinute: 0,
    averageChunkDuration: 0,
    currentProcessingTime: 0
  });

  useEffect(() => {
    // Escuchar actualizaciones de métricas
    const handleMetricsUpdate = (event: any) => {
      setMetrics(prev => ({
        ...prev,
        ...event.detail
      }));
    };

    const handleSemanticChunkAnalyzed = (event: any) => {
      const { chunk, analysis } = event.detail;
      
      setRealtimeStats(prev => ({
        ...prev,
        currentProcessingTime: analysis.metadata?.processingTime || 0,
        averageChunkDuration: chunk.duration
      }));

      // Actualizar métricas
      setMetrics(prev => ({
        ...prev,
        totalChunks: prev.totalChunks + 1,
        analyzedChunks: prev.analyzedChunks + 1,
        averageProcessingTime: (prev.averageProcessingTime + (analysis.metadata?.processingTime || 0)) / 2,
        clinicalRelevance: chunk.contextRelevance || prev.clinicalRelevance,
        redFlagsCount: prev.redFlagsCount + (analysis.redFlags?.length || 0)
      }));
    };

    window.addEventListener('clinicalMetricsUpdate', handleMetricsUpdate);
    window.addEventListener('semanticChunkAnalyzed', handleSemanticChunkAnalyzed);

    return () => {
      window.removeEventListener('clinicalMetricsUpdate', handleMetricsUpdate);
      window.removeEventListener('semanticChunkAnalyzed', handleSemanticChunkAnalyzed);
    };
  }, []);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatSessionDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="clinical-metrics bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Métricas de Sesión
        </h3>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Estado actual */}
        <div className="current-status">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Estado Actual</span>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isRecording 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isRecording ? 'Grabando' : 'Pausado'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-item p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {formatSessionDuration(sessionDuration)}
              </div>
              <div className="text-sm text-blue-800">Duración</div>
            </div>
            
            <div className="metric-item p-3 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600 capitalize">
                {currentPhase}
              </div>
              <div className="text-sm text-purple-800">Fase Actual</div>
            </div>
          </div>
        </div>

        {/* Métricas de procesamiento */}
        <div className="processing-metrics">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Procesamiento
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-card p-3 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">
                {metrics.analyzedChunks}
              </div>
              <div className="text-sm text-green-800">Chunks Analizados</div>
            </div>
            
            <div className="metric-card p-3 bg-orange-50 rounded">
              <div className="text-xl font-bold text-orange-600">
                {formatDuration(metrics.averageProcessingTime)}
              </div>
              <div className="text-sm text-orange-800">Tiempo Promedio</div>
            </div>
          </div>
        </div>

        {/* Calidad clínica */}
        <div className="clinical-quality">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Calidad Clínica
          </h4>
          
          <div className="quality-bar mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Relevancia</span>
              <span>{(metrics.clinicalRelevance * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.clinicalRelevance * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Red flags */}
          {metrics.redFlagsCount > 0 && (
            <div className="red-flags-alert p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center">
                <span className="text-red-600 mr-2 text-lg">⚠️</span>
                <div>
                  <div className="font-medium text-red-800">
                    {metrics.redFlagsCount} Alerta{metrics.redFlagsCount > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-red-600">
                    Revisar highlights
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SOAP Progress */}
        <div className="soap-progress">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Progreso SOAP
          </h4>
          
          <div className="soap-sections space-y-2">
            {Object.entries(metrics.soapCompleteness).map(([section, percentage]) => (
              <div key={section} className="soap-section">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">{section}</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      section === 'S' ? 'bg-blue-500' :
                      section === 'O' ? 'bg-green-500' :
                      section === 'A' ? 'bg-orange-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}; 