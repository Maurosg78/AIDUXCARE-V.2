import React, { useState, useEffect } from 'react';
import { ClinicalHighlight, RedFlag, ClinicalInsight } from '../services/RealTimeClinicalAnalysis';

export const RealTimeHighlights: React.FC = () => {
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [clinicalInsights, setClinicalInsights] = useState<ClinicalInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Escuchar chunks analizados
    const handleClinicalHighlight = (event: CustomEvent) => {
      const { 
        highlights: newHighlights, 
        redFlags: newRedFlags,
        clinicalInsights: newInsights 
      } = event.detail;
      
      setHighlights(prev => [...prev, ...newHighlights]);
      setRedFlags(prev => [...prev, ...newRedFlags]);
      setClinicalInsights(prev => [...prev, ...newInsights]);
      setIsProcessing(false);
      setLastUpdate(new Date());
    };

    const handleSemanticChunk = () => {
      setIsProcessing(true);
    };

    window.addEventListener('clinicalHighlight', handleClinicalHighlight);
    window.addEventListener('semanticChunkProcessing', handleSemanticChunk);

    return () => {
      window.removeEventListener('clinicalHighlight', handleClinicalHighlight);
      window.removeEventListener('semanticChunkProcessing', handleSemanticChunk);
    };
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return 'ℹ️';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      symptom: '🔸 Síntomas',
      finding: '🔍 Hallazgos',
      treatment: '💊 Tratamiento',
      assessment: '📋 Evaluación'
    };
    return labels[category] || category;
  };

  const getSOAPColor = (soapCategory: string) => {
    const colors = {
      S: 'bg-blue-100 text-blue-800',
      O: 'bg-green-100 text-green-800',
      A: 'bg-yellow-100 text-yellow-800',
      P: 'bg-purple-100 text-purple-800'
    };
    return colors[soapCategory] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="real-time-highlights bg-white rounded-lg shadow-md p-6">
      <div className="highlights-header flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Highlights Clínicos</h3>
        <div className="flex items-center space-x-2">
          {isProcessing && (
            <div className="processing-indicator flex items-center space-x-2">
              <div className="animate-pulse bg-green-500 h-2 w-2 rounded-full"></div>
              <span className="text-sm text-gray-600">Analizando...</span>
            </div>
          )}
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Red Flags - Prioridad alta */}
      {redFlags.length > 0 && (
        <div className="red-flags mb-6">
          <h4 className="text-red-600 font-semibold mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Alertas Clínicas
          </h4>
          <div className="space-y-3">
            {redFlags.map((flag, index) => (
              <div key={index} className={`alert p-3 rounded-lg border-l-4 ${
                flag.severity === 'high' ? 'border-red-500 bg-red-50' :
                flag.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start">
                  <span className="flag-icon text-lg mr-3">{getSeverityIcon(flag.severity)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{flag.flag}</p>
                    <p className="text-sm text-gray-600 mt-1">{flag.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Insights */}
      {clinicalInsights.length > 0 && (
        <div className="clinical-insights mb-6">
          <h4 className="text-blue-600 font-semibold mb-3 flex items-center">
            <span className="mr-2">🧠</span>
            Insights Clínicos
          </h4>
          <div className="space-y-3">
            {clinicalInsights.map((insight, index) => (
              <div key={index} className="insight-item p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-800 mb-2">{insight.insight}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">Confianza: {(insight.confidence * 100).toFixed(0)}%</span>
                  <span className="text-gray-500">{insight.evidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highlights por categoría */}
      <div className="highlights-by-category">
        {['symptom', 'finding', 'treatment', 'assessment'].map(category => {
          const categoryHighlights = highlights.filter(h => h.category === category);
          if (categoryHighlights.length === 0) return null;

          return (
            <div key={category} className="category-section mb-6">
              <h4 className="category-title font-semibold text-gray-700 mb-3">
                {getCategoryLabel(category)}
              </h4>
              <div className="space-y-3">
                {categoryHighlights.map((highlight, index) => (
                  <div key={index} className="highlight-item p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="highlight-text text-gray-800 flex-1">{highlight.text}</span>
                      <div className="highlight-meta flex items-center space-x-2 ml-4">
                        <span className={`soap-tag px-2 py-1 rounded text-xs font-medium ${getSOAPColor(highlight.soapCategory)}`}>
                          {highlight.soapCategory}
                        </span>
                        <span className="relevance-score text-xs text-gray-500">
                          {(highlight.relevance * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado vacío */}
      {highlights.length === 0 && redFlags.length === 0 && clinicalInsights.length === 0 && !isProcessing && (
        <div className="empty-state text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🧬</div>
          <p className="text-gray-500">Esperando análisis clínico...</p>
          <p className="text-sm text-gray-400 mt-2">Los highlights aparecerán durante la consulta</p>
        </div>
      )}
    </div>
  );
};