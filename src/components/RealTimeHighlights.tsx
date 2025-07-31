import React, { useState, useEffect } from 'react';

interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'symptom' | 'finding' | 'treatment' | 'assessment';
  relevance: number;
  soapCategory: 'S' | 'O' | 'A' | 'P';
  timestamp: number;
}

interface RedFlag {
  id: string;
  flag: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  timestamp: number;
}

export const RealTimeHighlights: React.FC = () => {
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Escuchar eventos de análisis clínico
    const handleClinicalHighlight = (event: CustomEvent) => {
      const { highlights: newHighlights, redFlags: newRedFlags } = event.detail;
      
      if (newHighlights) {
        setHighlights(prev => [...prev, ...newHighlights]);
      }
      
      if (newRedFlags) {
        setRedFlags(prev => [...prev, ...newRedFlags]);
      }
      
      setIsProcessing(false);
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

  return (
    <div className="real-time-highlights bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Highlights Clínicos
          </h3>
          {isProcessing && (
            <div className="flex items-center text-sm text-blue-600">
              <div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full mr-2"></div>
              <span>Analizando...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Red Flags - Prioridad alta */}
        {redFlags.length > 0 && (
          <div className="red-flags">
            <h4 className="text-red-600 font-semibold mb-3">⚠️ Alertas Clínicas</h4>
            {redFlags.slice(-3).map((flag) => (
              <div key={flag.id} className={`p-3 rounded border-l-4 mb-2 ${
                flag.severity === 'high' ? 'bg-red-50 border-red-500' :
                flag.severity === 'medium' ? 'bg-orange-50 border-orange-500' :
                'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-start">
                  <span className="mr-2 text-lg">{getSeverityIcon(flag.severity)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{flag.flag}</p>
                    <p className="text-sm text-gray-600 mt-1">{flag.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Highlights por categoría */}
        <div className="highlights-by-category">
          {['symptom', 'finding', 'treatment', 'assessment'].map(category => {
            const categoryHighlights = highlights.filter(h => h.category === category);
            if (categoryHighlights.length === 0) return null;

            return (
              <div key={category} className="category-section mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {getCategoryLabel(category)}
                </h4>
                <div className="space-y-2">
                  {categoryHighlights.slice(-3).map((highlight) => (
                    <div key={highlight.id} className="highlight-item p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {highlight.text}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            highlight.soapCategory === 'S' ? 'bg-blue-100 text-blue-800' :
                            highlight.soapCategory === 'O' ? 'bg-green-100 text-green-800' :
                            highlight.soapCategory === 'A' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {highlight.soapCategory}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(highlight.relevance * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(highlight.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado vacío */}
        {highlights.length === 0 && redFlags.length === 0 && !isProcessing && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎤</div>
            <p>Inicia grabación para ver highlights en tiempo real</p>
          </div>
        )}
      </div>
    </div>
  );
}; 